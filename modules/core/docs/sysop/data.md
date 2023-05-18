# Data
## `app.json` (shared)
- `name` — Application name (`string`, default: `Bacon`)
- `type` — Production type (`dev | test | pro`, default: `dev`)

> Full data file path:
> - [`/core/shared/data/app.json`](/modules/core/shared/data/app.json)

## 🔒 `database.json` (backend)
- `host` — Database hostname (`string`, default: `localhost`)
- `user` — Database username (`string`, default: `bacon`)
- `password` — Database password (`string`, default: *`null`*)
- `database` — Database name (`string`, default: `bacon`)

> Full data file path:
> - [`/core/backend/data/database.json`](/modules/core/backend/data/database.json)

## 🔒 `email.json` (backend)
- `host` — Database host (`string`, default: `localhost`)
- `port` — Database port (`number`, default: `25`)
- `user` — Database user (`string`, default: `bacon`)
- `password` — Database password (`string`, default: *`null`*)
- `from` — E-mail sender (`string`, default: `Bacon <bacon@localhost>`

> Full data file path:
> - [`/core/backend/data/email.json`](/modules/core/backend/data/email.json)

## `server.json` (backend)
- `http`

	- `enabled` — Enables the HTTP server (`boolean`, default: `true`)
	- `host` — HTTP server host (`string`, default: `localhost`)
	- `port` — HTTP server port (`number`, default: `2137`)
	- `redirectToHTTPS` (`boolean`, default: `true`) <br>
		Redirects all HTTP queries to the HTTPS. <br>
		Requires both http.enabled and https.enabled to be true.

- `https`

	- `enabled` — Enables the HTTPS server (`boolean`, default: `true`)
	- `host` — HTTPS server host (`string`, default: `localhost`)
	- `port` — HTTPS server port (`number`, default: `2137`)
	- `cert` (`path`, default: `/core/backend/data/pem/cert.pem`) <br>
		Path to the X.509 certificate file that:
		- Begins with the `-----BEGIN CERTIFICATE-----`.
		- Ends with the `-----END CERTIFICATE-----`.
	- `key` (`path`, default: `/core/backend/data/pem/key.pem`) <br>
		Path to the private key that:
		- Begins with the `-----BEGIN PRIVATE KEY-----`.
		- Ends with the `-----END PRIVATE KEY-----`.

- `extensions` — Front-end whitelisted extensions.

	- type:

		```ts
		Object.<string, string>
		```

		- Key: The extension.
		- Value: Content type of the extension.

	- default value:

		```json
		{
			"json": "application/json",
			"css": "text/css; charset=utf-8",
			"html": "text/html; charset=utf-8",
			"mjs": "text/javascript; charset=utf-8",
			"js": "text/javascript; charset=utf-8",
			"apng": "image/apng",
			"avif": "image/avif",
			"gif": "image/gif",
			"jpg": "image/jpeg",
			"ico": "image/x-icon",
			"png": "image/png",
			"svg": "image/svg+xml",
			"webp": "image/webp",
			"ttf": "font/ttf"
		}
		```

- `maxUploadSize` — Maximum size of user uploaded files (in MiB) (`uint`, default: `16`).
- `uploadImgExtensions` — Front-end whitelisted extensions for users to upload.

	- type:

		```ts
		Object.<string, string>
		```

		- Key: The extension.
		- Value: Content type of the extension.

	- default value:

		```json
		{
			"apng": "image/apng",
			"avif": "image/avif",
			"gif": "image/gif",
			"jpg": "image/jpeg",
			"ico": "image/x-icon",
			"png": "image/png",
			"svg": "image/svg+xml",
			"webp": "image/webp"
		}
		```

- `interactive` — Enables the application interactivity mode (`boolean`, default: `true`).
- `autorestart` — Restarts the application on each error instead of on the level 3 reset system error code only (`boolean`, default: `true`).

> Full data file path:
> - [`/core/backend/data/server.json`](/modules/core/backend/data/server.json)

<br>

At least one server: HTTP or HTTPS must be enabled. If both servers are enabled, HTTP does not redirect to HTTPS, and both servers works on same host and port, the Net server shall run and redirect requests to the correct server automatically so Bacon can server both HTTP and HTTPS simultaneously.

> Want to test HTTPS locally?
> - Windows:
> 	Install `/tools/localhost.crt` to the `Trusted Root Certification Authorities`.