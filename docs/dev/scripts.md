# Scripts
## `loader.js`
Re-maps imports to `/modules`.

## `start.js`
Starts the app utilizing a [cluster](https://nodejs.org/api/cluster.html) that forks itself upon restart.

> Related script from `core` module:
> - [`/core/backend/scripts/classes/Application.mjs`](/modules/core/backend/scripts/classes/Application.mjs)

## `stop.js`
Stops the app, returning `0`.