# Scripts
## `loader.js`
Re-maps imports to `/modules`.

## `app.js`
Starts the app utilizing a [cluster](https://nodejs.org/api/cluster.html) that forks itself upon a restart and optionally upon an error.

> Related script from `core` module:
> - [`/core/backend/scripts/classes/Application.mjs`](/modules/core/backend/scripts/classes/Application.mjs)