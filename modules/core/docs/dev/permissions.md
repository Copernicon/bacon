# Permissions
The Bacon application uses **the permissions** as a whitelist. Certain actions may require users to have multiple permissions, but no permission should restrict user in any way.

> Related database tables:
> - `permissions`
>
> 	Column    | Type
> 	--------- | ----
> 	`id`      | int(10) unsigned Auto Increment
> 	`module`  | varchar(128)
> 	`name`    | varchar(128)
> 	`global`  | int(1) unsigned [0]
>
> - `users_permissions`
>
>	Column        | Type
>	------------- | ----
>	`user`        | int(10) unsigned
>	`project`     | int(10) unsigned NULL
>	`permission`  | int(10) unsigned
>
> - `roles_permissions`
>
>	Column        | Type
>	------------- | ----
>	`role`        | int(10) unsigned
>	`permission`  | int(10) unsigned

## Bounds
Each permission is bound to xeither a user xor a group, to a module and a project¹.
1. `null` project means the permission is global.

> ⚠️ `WARNING`
>
> - Distinct permissions by `id` xor by pairs of `module` and a `name`.
> - All pairs of `module` and a `name` must be unique.

## Scope
We can divide the types of permissions by scope:

- **Global permissions** — project independent, global powers that allows bound user to make certain global actions, eg `projects/list` at `core` module.
- **Project permissions** — project-wide powers that allows bound user to make certain actions in the bound project, eg `project/edit` at `core` module.

## Target
We can divide the types of permissions by target:

- **User permissions** — User-wide powers — granted for a single user.
- **Role permissions** — Role-wide powers — granted for all users with the bound role and for all users with roles which subroles of any level contains the bound role.

## Global permissions
### `core` module
- `projects/list`
- `projects/add`
- `projects/edit`
- `session`

## Project permissions
### `core` module
- `owner`
- `admin`
- `moderator`