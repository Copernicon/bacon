# Scripts
## `HTTP` (backend)
Handles HTTP requests with `request` event.

> Full script path:
> - [`/core/backend/scripts/interfaces/HTTP.mjs`](/modules/core/backend/scripts/interfaces/HTTP.mjs)

### Paths
Bacon HTTP server accepts end-user requests with paths of the following formats:
- `/${module}/${layer}${directory}/${filename}.${extension}`
- `/${module}/${layer}${directory}/${filename}.${extension}?${query}`

Example of a valid path: `/core/frontend/pages/main.html`.

- `module` — a directory inside `/modules` (*eg* `core`)
- `layer` — an access layer: `frontend`, `backend`, `api` xor `shared`
- `directory` — a relative path from a layer to a file (*eg* `/pages`)
- `filename` — requested file's name (*eg* `main`)
- `extension` — requested file's extension (*eg* `html`)
- `query` — *(optional)* request query string (*eg* `from=1&to=2`)

### Layers
Each layer has different uses.
- `frontend` — for front-end requests only, returned directly.
- `shared` — for both front-end and back-end, returned directly on front-end requests.
- `api` — for both front-end and back-end, imported and executed by back-end, result returned.
- `backend` — for back-end only, not available for front-end requests.

### API
Files from `api` layer with extension `mjs` are API files. API files must be javascript modules that `export default function ()` and return a JSON. Default exported function will be executed upon permitted request and result JSON returned.

API requests data must be a valid JSON that is a plain object, *ie* `obect` which constructor is the `Object`, *ia* not `null`, not an `Array` not a `Function` and not a `class`.

### Extensions
Bacon uses a whitelist of extensions.

> Related data entry:
> - `extensions` at [`/core/backend/data/server.json`](/modules/core/backend/data/server.json)

Server refuses to process user's request if requesting file's extension is not on a whitelist or user does not
have at least one required permission to access the file, if any. Not refused requests are permitted requests.

### Permissions
Access to a file at path `${path}` can be restricted, requiring user to have all permissions listed at optional file at path `${path}.perms`, which are split by a new line character (U+000A: `\n`).

Special permissions:
- `system` — not available for users — forbids them accessing the file
- `core/session` — pseudo permission — requires user to be logged in

### Redirects
- Both `/index` and `/index.html` redirects to `/`
- `/` loads the `Index` page ※ [`/core/backend/scripts/feats/Index.mjs`](/modules/core/backend/scripts/feats/Index.mjs)
- `/${module}/${filename}` loads `/${module}/frontend/pages/${filename}.html`
- `/${module}/api/v${version}/${endpoint}` exucutes `/${module}/api/v${version}/${endpoint}.mjs` and returns its result.

### Responses
Correctly handled valid requests returns HTTP response status code `200 OK`. <br>
Other requests returns different HTTP response status codes and their content is a JSON.