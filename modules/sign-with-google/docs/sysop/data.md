# Data
## `auth.json` (backend)
- `methods` — An object with the following property:
	- `email` — An object with the following properties:
		- `register` (`boolean`, default: `true`) <br>
			Indicates if e-mail registration is enabled.
		- `login` (`boolean`, default: `true`) <br>
			Indicates if e-mail login is enabled.

## 🔒 `google.json` (backend)
- `clientSecret` — Google Client Secret (`string`, default: *`null`*)

> Full data file path:
> - [`/sign-with-google/backend/data/google.json`](/modules/sign-with-google/backend/data/google.json)

## `google.json` (shared)
- `clientID` — Google Client ID (`string`, default: *`null`*)

> Full data file path:
> - [`/sign-with-google/shared/data/google.json`](/modules/sign-with-google/shared/data/google.json)