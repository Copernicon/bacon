# API
## Availability
While some API end–points are freely available, some of them are restricted.

### Tokens
Some API requests may require to pass a `token` (128 alnum chars). <br>
There are two kinds of tokens:
- A session token (auto appended from front–end scripts for logged–in users).
- ❌ TODO:  ~~A persistent token (persistent tokens can be created in the user panel).~~

> 	Property | Type                      | Description
> 	-------- | ----                      | -----------
> 	`token`  | `string`, 128 alnum chars | session ∨ ❌ TODO: ~~persistent~~

### Project identifier
Some API requests may require to pass a `project` id (`uint`). <br>
Project identifier is naturally required for project dependent queries.

> 	Property  | Type   | Description
> 	--------- | ----   | -----------
> 	`project` | `uint` | The project id.

### Permissions
Some API requests may require user to have certain permissions (either global or in the project in case the `project` id was passed).

## Response
Response is a JSON stringified object with the following properties:

> 	Property   | Type      | Description
> 	--------   | ----      | -----------
> 	`success`  | `boolean` | The success state.
> 	`message?` | `string`  | Additional notes.

If the request did not succeeded, additional property is available:

> 	Property | Type   | Description
> 	-------- | ----   | -----------
> 	`code`   | `uint` | [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) to return.

## End–points
### `POST /core/api/v0/register`
Registers a new user account, then send an e-mail with an activation link.

> <br>
>
> - Request
>
>	✳️ No token is required. <br>
>	🧿 No project id is required.
>
> 	Property     | Type
> 	--------     | ----
>	`login`      | `string`, 3 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u`
>	`email`      | `string`, 3 – 128 chars, `/.@./u`
>	`password`   | `string`, 16 – 128 chars
> 	`first_name` | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u`
> 	`nick_name`  | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u`
> 	`last_name`  | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u`
> 	`phone`      | `null` \| `string`, 0 – 32 chars, `/^(?:\+[1-9])?[\d \-]+$/u`
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	No additional data.
>
> <br>
<br>

### `POST /core/api/v0/activate`
Activates a user account (`user` and `code` are sent via e-mail upon registration).

> <br>
>
> - Request
>
>	✳️ No token is required. <br>
>	🧿 No project id is required.
>
> 	Property  | Type                      | Description
> 	--------  | ----                      | -----------
> 	`user`    | `uint`                    | ID of the user to activate.
> 	`code`    | `string`, 128 alnum chars | Activation code sent to an e-mail.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	No additional data.
>
> <br>
<br>

### `POST /core/api/v0/login`
Log–ins a user.

> <br>
>
> - Request
>
>	✳️ No token is required. <br>
>	🧿 No project id is required.
>
> 	Property   | Type                                                                          | Description
> 	--------   | ----                                                                          | ---
>	`login`    | `string`, 3 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u` | The user login.
>	`password` | `string`, 16 – 128 chars                                                      | The user password.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property     | Type                                                                                    | Description
> 	--------     | ----                                                                                    | ---
>	`token`      | `string`, 128 alnum chars                                                               | The session token.
>	`expiration` | `time`                                                                                  | Session expiration time.
>	`user`       | `uint`                                                                                  | The user id.
>	`login`      | `string`, 3 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u`           | The user login.
> 	`first_name` | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user first name.
> 	`nick_name`  | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user nick name.
> 	`last_name`  | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user last name.
>
> <br>
<br>

### `POST /core/api/v0/logout`
Log–outs a user.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	No additional data.
>
> <br>
<br>

### `POST /core/api/v0/validate-session`
Validates a user session (checks if `token` is valid and not expired).

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property     | Type      | Description
> 	--------     | ----      | ---
>	`valid`      | `boolean` | Indicates if the token is valid.
>	`user`       | `uint`    | The user id.
>	`expiration` | `time`    | Session expiration time.
>
> <br>
<br>

### `POST /core/api/v0/validate-project`
Validates a user project (checks if user joined the project).

> <br>
>
> - Request
>
> 	Property  | Type                      | Description
> 	--------  | ----                      | ---
>	`token`   | `string`, 128 alnum chars | The session token.
>	`project` | `uint`                    | The project id.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property | Type      | Description
> 	-------- | ----      | ---
>	`valid`  | `boolean` | Indicates if user joined the project.
>	`name`   | `string`  | The project name.
>	`logo`   | `string`  | The project logo URL.
>
> <br>
<br>

### `POST /core/api/v0/extend-session`
Extends a user session.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property     | Type                      | Description
> 	--------     | ----                      | ---
>	`token`      | `string`, 128 alnum chars | A new session token.
>	`expiration` | `time`                    | A new session expiration time.
>
> <br>
<br>

### `POST /core/api/v0/get-image-upload-restrictions`
Gets image upload restrictions.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property          | Type       | Description
> 	--------          | ----       | ---
>	`max-upload-size` | `uint`     | Max upload size (in MiB).
>	`extensions`      | `string[]` | A list of white–listed upload extensions.
>
> <br>
<br>

### `POST /core/api/v0/projects`
#### `action: list all`
Gets all projects.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>	`action` | `list all`
>
> - Required permission
>
>	- `projects/list`
>
>	<br>
>
> - Response
>
> 	Property   | Type                | Description
> 	--------   | ----                | ---
> 	`projects` | `null \| Project[]` | A list of all projects.
>
> <br>
<br>

#### `action: list mine`
Gets all projects the user joined to.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>	`action` | `list mine`
>
> - Required permission
>
>	✳️ No permissions are required.
>
>	<br>
>
> - Response
>
> 	Property   | Type                | Description
> 	--------   | ----                | ---
> 	`projects` | `null \| Project[]` | A list of user projects.
>
> <br>
<br>

#### `action: list available`
Gets all projects the user has access to.
- Returns all projects if a user has the `projects/list` permission.
- Returns user projects only otherwise.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>	`action` | `list available`
>
> - Required permission
>
>	✳️ No permissions are required.
>
>	<br>
>
> - Response
>
> 	Property   | Type                | Description
> 	--------   | ----                | ---
> 	`projects` | `null \| Project[]` | A list of available projects.
>
> <br>
<br>

#### `action: add`
Adds a project.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property         | Type                                  | Description
> 	--------         | ----                                  | ---
>	`token`          | `string`, 128 alnum chars             | The session token.
>	`action`         | `add`
>	`name`           | `string`                              | The project name.
>	`logo`           | `null \| string`, base64 encoded file | The project logo.
>	`logo_extension` | `null \| string`                      | The project logo extension.
>
> - Required permission
>
>	- `projects/add`
>
>	<br>
>
> - Response
>
> 	No additional data.
>
> <br>
<br>

#### `action: remove`
Removes a project.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property | Type                      | Description
> 	-------- | ----                      | ---
>	`token`  | `string`, 128 alnum chars | The session token.
>	`action` | `remove`
>	`id`     | `uint`                    | The project id.
>
> - Required permission
>
>	- `projects/remove`
>
>	<br>
>
> - Response
>
> 	No additional data.
>
> <br>
<br>

### `POST /core/api/v0/menu`
Gets the menu.

> <br>
>
> - Request
>
>	✳️ No token is required. <br>
>	🧿 No project id is required.
>
> 	Property  | Type                                | Description
> 	--------  | ----                                | ---
>	`token`   | `null` \| `string`, 128 alnum chars | The session token.
>	`project` | `null` \| `uint`                    | The project id.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property | Type     | Description
> 	-------- | ----     | ---
>	`menu`   | `string` | The menu, HTML.
>
> <br>
<br>

### `POST /core/api/v0/get-users`
Gets users that are searchable.

> <br>
>
> - Request
>
>	🧿 No project id is required.
>
> 	Property  | Type                                | Description
> 	--------  | ----                                | ---
>	`token`   | `null` \| `string`, 128 alnum chars | The session token.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property | Type    | Description
> 	-------- | ----    | ---
>	`users`  | `array` | *See the table below.*
>
> 	Property     | Type                                                                                    | Description
> 	--------     | ----                                                                                    | ---
>	`id`         | `uint`                                                                                  | The user id.
> 	`first_name` | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user first name.
> 	`nick_name`  | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user nick name.
> 	`last_name`  | `null` \| `string`, 1 – 64 chars, `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user last name.
>
> <br>
<br>