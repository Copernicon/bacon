import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';

/**

	@typedef {{ id: number, name: string, logo: string }} Project

	Properties:
	- `id` — (*unique uint*) Project identifier.
	- `name` — (*unique*) Project name, eg `Polcon 2077`.
	- `logo` — URL of project logo.

	Related class:
	- {@link Projects `Projects`}

	@property id (*unique uint*) Project identifier.
	@property name (*unique*) Project name, eg `Polcon 2077`.
	@property logo URL of project logo.

*/
export {};

export default class Projects
{
	/**
		Gets all projects.

		Related type:
		- {@link Project `Project`}

		@return {Promise<Project[]?>}
		A list of projects xor `null` if an error occured.
	*/
	static async getAllProjects()
	{
		const select = await SQL.select('SELECT id, name, logo FROM projects');

		if (select === null)
			return null;

		if (select === false)
			return [];

		/** @type {Project[]} */
		const result = [];

		for (const entry of select) // @ts-ignore
			result.push({ id: entry.id, name: entry.name, logo: entry.logo });

		return result;
	}

	/**
		Gets {@link user `user`} projects.

		Related type:
		- {@link Project `Project`}

		@param {number} user
		(*unique uint*) User identifier.

		@return {Promise<Project[]?>}
		A list of projects xor `null` if an error occured.
	*/
	static async getUserProjects(user)
	{
		const select = await SQL.select
		(
			`
				WITH $projects ($project) AS (SELECT project FROM users_projects WHERE user = :user)
				SELECT id, name, logo FROM projects, $projects WHERE id IN ($project)
			`,
			{ user }
		);

		if (select === null)
			return null;

		if (select === false)
			return [];

		/** @type {Project[]} */
		const result = [];

		for (const entry of select) // @ts-ignore
			result.push({ id: entry.id, name: entry.name, logo: entry.logo });

		return result;
	}

	/**
		Gets all available {@link user `user`} projects.
		- Returns all projects if {@link user `user`} has the `projects/list` permission.
		- Returns {@link user `user`} projects only otherwise.

		Related type:
		- {@link Project `Project`}

		@param {number} user
		(*unique uint*) User identifier.

		@return {Promise<Project[]?>}
		A list of projects xor `null` if an error occured.
	*/
	static async getAvailableProjects(user)
	{
		if (await Permissions.hasGlobalPermission(user, 'core', 'projects/list'))
			return await Projects.getAllProjects();

		return await Projects.getUserProjects(user);
	}

	/**
		Gets {@link user `user`} {@link project `project`}.

		Related type:
		- {@link Project `Project`}

		@param {number} user
		(*unique uint*) User identifier.

		@param {number} project
		(*unique uint*) Project identifier.

		@return {Promise<Project|null>}
		A project xor `null` if an error occured.
	*/
	static async getUserProject(user, project)
	{
		const select = await SQL.select
		(
			`
				WITH $projects ($project) AS (SELECT project FROM users_projects WHERE user = :user AND project = :project)
				SELECT id, name, logo FROM projects, $projects WHERE id IN ($project)
			`,
			{ user, project }
		);

		if (select === null)
			return null;

		if (select === false)
			return null;

		return {
			id: Number(select[0]?.id),
			name: String(select[0]?.name),
			logo: String(select[0]?.logo)
		};
	}
}