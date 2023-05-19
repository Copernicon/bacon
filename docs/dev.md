# Development documentation
Documentation for programmers.

## Start
Bacon should start by `npm start` command, which runs the [`app.js`](/app.js) using [`loader.mjs`](/loader.mjs) [loader](https://nodejs.org/api/esm.html#loaders).

## Modules
Bacon's functionality is split into modules.
Modules are directories with files, distributed as zipped files.
File [`modules.json`](/modules/core/backend/data/modules.json) contains a list of enabled modules.
Enabled modules are loaded from the [`app.js`](/app.js).

- Modules must have unique names.
- Modules must derive from the [`Module`](/modules/core/backend/scripts/classes/Module.mjs) class.
- Modules should be available as zipped files.
- Zipped module's top directory name must equal module's name.
- Modules should follow paths and layers convention (※ [`/core/docs/dev/scripts.md`](/modules/core/docs/dev/scripts.md)).
- Modules must have the following file: `/${module}/backend/scripts/main.mjs`.

### `/${module}/backend/scripts/main.mjs`
This file shall be run at back-end upon module load.

> Example: `main.js` of `core` module:
> - [`/core/backend/scripts/main.mjs`](/modules/core/backend/scripts/main.mjs)

### `core` module
Core app module is integrated with the application and should be always enabled.

## Coding
### `HookableEvent`
`HookableEvent` is a notable class that features hookable and implementable event, that can be suppressed and its data can be overriden. Hooking can happen pro-, pre-, pen- and post- the event.

```js
/** @type {HookableEvent<[string]>} */
const log = new HookableEvent();

log.pro(message => !message.match(/[\p{L}\p{N}]/u));    // pro hooks the log event, will supresses it if a message contains no alphanumeric character.
log.pre(messsage => openLogFile);                       // pre hooks the log event, will invoke the `openLogFile` function before event implementators.
log.pen(message => message = '[info] ' + message);      // pen hooks the log event, will prepend the `[info] ` tag to the message — event's parameter.
log.imp(message => console.log(message));               // implements the log event, will `console.log` modified message that includes prepended tag.
log.post(message => io.log(`<${user.id}> ${message}`)); // post hooks the log event, will invoke `io.log` function with given message-based string.

log.run('Test'); // Invokes the event, running pro- hook and then consecutively: pre-, pen-, imp- and post- hooks if the event was not suppressed.
```

> Full script path:
> - [`/core/shared/scripts/structs/HookableEvent.mjs`](/modules/core/shared/scripts/structs/HookableEvent.mjs)

## Read more
- [Scripts](/docs/dev/scripts.md)