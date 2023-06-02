# API
## End–points
### `POST /sign-with-google/api/v0/register-google`
Registers a new user account using *Sign with Google*.

> <br>
>
> - Request
>
>	✳️ No token is required. <br>
>	🧿 No project id is required.
>
> 	Property     | Type                             | Regex                                                 | Description
> 	--------     | ----                             | -----                                                 | -----------
>	`code`       | `string`                         |                                                       | The *Google Sign In* Code.
>	`login`      | `string`, 3 – 64 chars           | `/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u` | The user login.
> 	`nick_name`  | `null` \| `string`, 1 – 64 chars | `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user nick name.
> 	`phone`      | `null` \| `string`, 1 – 32 chars | `/^(?:\+[1-9])?[\d \-]+$/u`                           | The user phone.
>	`searchable` | `uint(1)`                        |                                                       | Indicates if the user is searchable.
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

### `POST /sign-with-google/api/v0/login-google`
#### `action: login`
Logins a user using *Sign with Google*.

> <br>
>
> - Request
>
>	✳️ No token is required. <br>
>	🧿 No project id is required.
>
> 	Property   | Type     | Description
> 	--------   | ----     | ---
>	`code`     | `string` | The *Google Sign In* Code.
>
> - Required permissions
>
>	✳️ No permissions are required.
>
> - Response
>
> 	Property     | Type                             | Regex                                                 | Description
> 	--------     | ----                             | -----                                                 | -----------
>	`token`      | `string`, 128 alnum chars        |                                                       | The session token.
>	`expiration` | `time`                           |                                                       | Session expiration time.
>	`user`       | `uint`                           |                                                       | The user id.
>	`login`      | `string`, 3 – 64 chars           | `/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u` | The user login.
> 	`first_name` | `null` \| `string`, 1 – 64 chars | `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user first name.
> 	`nick_name`  | `null` \| `string`, 1 – 64 chars | `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user nick name.
> 	`last_name`  | `null` \| `string`, 1 – 64 chars | `/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u` | The user last name.
> 	`logo`       | `null` \| `string`               |                                                       | The user logo address.
>
> <br>
<br>

#### `action: check availability`
TODO

#### `action: add login method`
TODO

#### `action: remove login method`
TODO