# Data
## `modules.json` (backend)
Array of strings that are names of enabled app modules.

> Full data file path:
> - [`/core/backend/data/modules.json`](/modules/core/backend/data/modules.json)

## `sources.json` (backend)
A JSON file that is an array of strings. Each string is an URL to a *bacon source file*.

> Full data file path:
> - [`/core/backend/data/sources.json`](/modules/core/backend/data/sources.json)

Example: `sources.json`

```json
["localhost:2137/source/modules.json"]
```

### *Bacon source file*
A JSON file that is an array of strings. Each string is an URL to a "bacon module file*.

Example: `modules.json`

```json
["localhost:2137/source/core.json"]
```

### *Bacon module file*
A JSON file that contains data about a bacon module.

- `name` — *string*, module name, should be unique
- `version` — */^\d+\.\d+\.\d+/*, module version: `${major}.${minor}.${patch}`
- `source` — *string*, url to the zipped module source

Example: `core.json`

```json
{
	"name": "core",
	"version": "0.0.0",
	"source": "localhost:2137/source/core.zip"
}
```