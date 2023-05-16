import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import validateSession from '/core/api/v0/validate-session.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

/**

	@typedef {{ module: string, name: string }} Permission

	Properties:
	- `module` — Module name, eg `core`.
	- `name` — Permission name, eg `projects/list`.

	Notes:
	- Pairs: `module` and `name` are unique.

	Related class:
	- {@link Permissions `Permissions`}

	@property module Module name, eg `core`.
	@property name Permission name, eg `admin`.

*/
export {};

/** End-user permissions related functions. */
export default class Permissions
{
	/**
		Checks if the session {@link token `token`} is valid.

		@return {Promise<number?>}
		- `number` — id of the user who owns the {@link token `token`} if it was valid.
		- `null` — if the {@link token `token`} was invalid.
	*/
	static async getUserByToken(/** @type {string} */ token)
	{
		if (token.length != server.tokenSize)
			return null;

		const session = JSON.parse(await validateSession(JSON.stringify({ token: token })));

		if (!session?.valid)
			return null;

		return session.user;
	}

	/**
		Gets {@link user `user`}'s global permissions.

		@return {Promise<Permission[]?>}
		{@link user `user`}'s global permissions xor `null` if they're unknown ∵ an error occured.
	*/
	static async getGlobalPermissions(/** @type {number} */ user)
	{
		const select = await SQL.select
		(
			`
				WITH RECURSIVE
				$roles ($role) AS (
					SELECT role FROM users_roles WHERE user = :user AND project IS NULL
					UNION SELECT subrole FROM roles_roles, $roles WHERE role = $role
				),
				$permissions ($permission) AS (
					SELECT permission FROM users_permissions WHERE user = :user AND project IS NULL
					UNION SELECT permission FROM roles_permissions, $roles WHERE role IN ($role)
				)
				SELECT module, name FROM permissions, $permissions WHERE id IN ($permission)
			`,
			{ user }
		);

		if (select === null)
			return null;

		if (select === false)
			return [];

		/** @type {Permission[]} */
		const result = [];

		for (const entry of select)
			if (typeof entry.module == 'string' && typeof entry.name == 'string')
				result.push({ module: entry.module, name: entry.name });

		return result;
	}

	/**
		Gets {@link user `user`}'s permissions in {@link project `project`}.

		@return {Promise<Permission[]?>}
		{@link user `user`}'s permissions in {@link project `project`} xor `null` if they're unknown ∵ an error occured.
	*/
	static async getProjectPermissions
	(
		/** @type {number} */ user,
		/** @type {number} */ project
	)
	{
		const select = await SQL.select
		(
			`
				WITH RECURSIVE
				$roles ($role) AS (
					SELECT role FROM users_roles WHERE user = :user AND project = :project
					UNION SELECT subrole FROM roles_roles, $roles WHERE role = $role
				),
				$permissions ($permission) AS (
					SELECT permission FROM users_permissions WHERE user = :user AND project = :project
					UNION SELECT permission FROM roles_permissions, $roles WHERE role IN ($role)
				)
				SELECT module, name FROM permissions, $permissions WHERE id IN ($permission)
			`,
			{ user, project }
		);

		if (select === null)
			return null;

		if (select === false)
			return [];

		/** @type {Permission[]} */
		const result = [];

		for (const entry of select) // @ts-ignore
			result.push({ module: entry.module, name: entry.name });

		return result;
	}

	/**
		Gets combined {@link user `user`}'s permissions: both global ones and in the {@link project `project`}.

		@return {Promise<Permission[]?>}
		Combined {@link user `user`}'s permissions: both global ones and in the {@link project `project`} xor `null` if they're unknown ∵ an error occured.
	*/
	static async getPermissions
	(
		/** @type {number} */ user,
		/** @type {number?} */ project = null
	)
	{
		const globalPermissions = await Permissions.getGlobalPermissions(user);

		if (project === null)
			return globalPermissions;

		const projectPermissions = await Permissions.getProjectPermissions(user, project);

		if
		(
				globalPermissions === null
			||	projectPermissions === null
		)
			return null;

		return [...globalPermissions, ...projectPermissions];
	}

	/**
		Checks if {@link user `user`} has global {@link permission `permission`} on {@link module `module`}.

		Related function:
		- {@link hasAllGlobalPermissions `hasAllGlobalPermissions`}

		@return {Promise<boolean?>}
		`null` if it's unknown ∵ an error occured xor `boolean` otherwise.
	*/
	static async hasGlobalPermission
	(
		/** @type {number} */ user,
		/** @type {string} */ module,
		/** @type {string} */ permission
	)
	{
		const select = await SQL.select
		(
			`
				WITH RECURSIVE
				$roles ($role) AS (
					SELECT role FROM users_roles WHERE user = :user AND project IS NULL
					UNION SELECT subrole FROM roles_roles, $roles WHERE role = $role
				),
				$permissions ($permission) AS (
					SELECT permission FROM users_permissions WHERE user = :user AND project IS NULL
					UNION SELECT permission FROM roles_permissions, $roles WHERE role IN ($role)
				)
				SELECT NULL FROM permissions, $permissions WHERE module = :module AND name = :permission AND id IN ($permission) LIMIT 1
			`,
			{ user, module, permission }
		);

		return select ? true : select;
	}

	/**
		Checks if {@link user `user`} has {@link permission `permission`} on {@link module `module`} in {@link project `project`}.

		@return {Promise<boolean?>}
		`null` if it's unknown ∵ an error occured xor `boolean` otherwise.
	*/
	static async hasProjectPermission
	(
		/** @type {number} */ user,
		/** @type {number} */ project,
		/** @type {string} */ module,
		/** @type {string} */ permission
	)
	{
		const select = await SQL.select
		(
			`
				WITH RECURSIVE
				$roles ($role) AS (
					SELECT role FROM users_roles, $projects WHERE user = :user AND project = :project
					UNION SELECT subrole FROM roles_roles, $roles WHERE role = $role
				),
				$permissions ($permission) AS (
					SELECT permission FROM users_permissions, $projects WHERE user = :user AND project = :project
					UNION SELECT permission FROM roles_permissions, $roles WHERE role IN ($role)
				)
				SELECT NULL FROM permissions, $permissions WHERE module = :module AND name = :permission AND id IN ($permission) LIMIT 1
			`,
			{ user, project, module, permission }
		);

		return select ? true : select;
	}

	/**
		Checks if {@link user `user`} has all global {@link permissions `permissions`}.

		Related type:
		- {@link Permission `Permission`}

		Related function:
		- {@link hasGlobalPermission `hasGlobalPermission`}

		@return {Promise<true|Permission[]|null>}
		If {@link user `user`} has all global {@link permissions `permissions`}:
		- `true`

		If {@link user `user`} hasn't all global {@link permissions `permissions`}:
		- `Permission[]` — missing permissions

		If it's unknown ∵ an error occured:
		- `null`
	*/
	static async hasAllGlobalPermissions
	(
		/** @type {number} */ user,
		/** @type {Permission[]} */ permissions
	)
	{
		if (permissions.length == 0)
			return true;

		const values = permissions.map(() => '(?, ?)').join(', ');
		const params = permissions.map(permission => [permission.module, permission.name]).flat();
		const select = await SQL.select
		(
			`
				WITH RECURSIVE
				$roles ($role) AS (
					SELECT role FROM users_roles WHERE user = ? AND project IS NULL
					UNION SELECT subrole FROM roles_roles, $roles WHERE role = $role
				),
				$permissions ($permission) AS (
					SELECT permission FROM users_permissions WHERE user = ? AND project IS NULL
					UNION SELECT permission FROM roles_permissions, $roles WHERE role IN ($role)
				)
				SELECT module, name FROM permissions, $permissions WHERE (module, name) IN (VALUES ${values}) AND id IN ($permission)
			`,
			[...[...new Array(2)].map(() => user), ...params]
		);

		if (select === null)
			return null;

		if (select === false)
			return permissions;

		let missingPermissions = permissions;

		for (const permission of Object.values(select))
			missingPermissions = missingPermissions.filter(missingPermission =>
					missingPermission.module == permission.module
				&&	missingPermission.name == permission.name
			);

		if (missingPermissions.length)
			return missingPermissions;

		return true;
	}

	/**
		Checks if {@link user `user`} has all {@link permissions `permissions`} in {@link project `project`}.

		Related type:
		- {@link Permission `Permission`}

		Related function:
		- {@link hasGlobalPermission `hasGlobalPermission`}

		@return {Promise<true|Permission[]|null>}
		If {@link user `user`} has all {@link permissions `permissions`} in {@link project `project`}:
		- `true`

		If {@link user `user`} hasn't all {@link permissions `permissions`} in {@link project `project`}:
		- `Permission[]` — missing permissions

		If it's unknown ∵ an error occured:
		- `null`
	*/
	static async hasAllProjectPermissions
	(
		/** @type {number} */ user,
		/** @type {number} */ project,
		/** @type {Permission[]} */ permissions
	)
	{
		if (permissions.length == 0)
			return true;

		const values = permissions.map(() => '(?, ?)').join(', ');
		const params = permissions.map(permission => [permission.module, permission.name]).flat();
		const select = await SQL.select
		(
			`
				WITH RECURSIVE
				$roles ($role) AS (
					SELECT role FROM users_roles WHERE user = ? AND project = ?
					UNION SELECT subrole FROM roles_roles, $roles WHERE role = $role
				),
				$permissions ($permission) AS (
					SELECT permission FROM users_permissions WHERE user = ? AND project = ?
					UNION SELECT permission FROM roles_permissions, $roles WHERE role IN ($role)
				)
				SELECT module, name FROM permissions, $permissions WHERE (module, name) IN (VALUES ${values}) AND id IN ($permission)
			`,
			[...[...new Array(2)].map(() => [user, project]).flat(), ...params]
		);

		if (select === null)
			return null;

		if (select === false)
			return permissions;

		let missingPermissions = permissions;

		for (const permission of Object.values(select))
			missingPermissions = missingPermissions.filter(missingPermission =>
					missingPermission.module == permission.module
				&&	missingPermission.name == permission.name
			);

		if (missingPermissions.length)
			return missingPermissions;

		return true;
	}

	/**
		Checks if {@link user `user`} has all {@link permissions `permissions`}, either global or in {@link project `project`}.

		Related type:
		- {@link Permission `Permission`}

		Related function:
		- {@link hasGlobalPermission `hasGlobalPermission`}

		@return {Promise<true|Permission[]|null>}
		If {@link user `user`} has all {@link permissions `permissions`}, either global or in {@link project `project`}:
		- `true`

		If {@link user `user`} hasn't all {@link permissions `permissions`}, either global or in {@link project `project`}:
		- `Permission[]` — missing permissions

		If it's unknown ∵ an error occured:
		- `null`
	*/
	static async hasAllPermissions
	(
		/** @type {number} */ user,
		/** @type {number?} */ project,
		/** @type {Permission[]} */ permissions
	)
	{
		const userPermissions = await Permissions.getPermissions(user, project);

		if (userPermissions === null)
			return null;

		let missingPermissions = permissions;

		for (const permission of userPermissions)
			missingPermissions = missingPermissions.filter(missingPermission =>
					missingPermission.module == permission.module
				&&	missingPermission.name == permission.name
			);

		if (missingPermissions.length)
			return missingPermissions;

		return true;
	}
}