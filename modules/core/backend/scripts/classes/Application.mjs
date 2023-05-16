import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import net from 'node:net';
import process from 'node:process';
import util from 'node:util';
import ws from 'ws';
import Module from '/core/backend/scripts/bases/Module.mjs';
import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import Console from '/core/backend/scripts/interfaces/Console.mjs';
import HTTP from '/core/backend/scripts/interfaces/HTTP.mjs';
import ServerSocket from '/core/backend/scripts/interfaces/ServerSocket.mjs';
import modules from '/core/backend/data/modules.json' assert { type: 'json' };
import server from '/core/backend/data/server.json' assert { type: 'json' };
import app from '^/package.json' assert { type: 'json' };

/**
	@typedef {Map.<string, Module>} Modules
	- *key* — Module name.
	- *value* — Module instance.

	Related class:
	- {@link Application `Application`}

*//**

	@typedef {Map.<string, FunctionConstructor>} ModuleConstructors
	- *key* — Module name.
	- *value* — Module constructor.

	Related class:
	- {@link Application `Application`}
*/
export {};

/**
	The Bacon application.

	- Manage modules.
	- Manage {@link https `https`} server.

	Related data files:
	- {@link modules `/core/backend/data/modules.json`}
	- {@link server `/core/backend/data/server.json`}
	- {@link app `^/package.json`}
*/
export default class Application
{
	/** Indicates if the application is started. */
	static #started = false;

	/**
		Initialized modules.
		@type {Modules}
	*/
	static #modules = new Map();

	/** @type {net.Socket[]} */
	static #NetSockets = [];

	/** @type {ws.WebSocket[]} */
	static #WebSockets = [];

	/** @type {ws.WebSocket[]} */
	static #WebSocketsSecure = [];

	/** @type {net.Server?} */
	static #NetServer = null;

	/** @type {http.Server?} */
	static #HTTPServer = null;

	/** @type {https.Server?} */
	static #HTTPSServer = null;

	/** @type {ws.WebSocketServer?} */
	static #WSServer = null;

	/** @type {ws.WebSocketServer?} */
	static #WSSServer = null;

	/** Checks if the application is started. */
	static get started() { return Application.#started; }

	/** Gets initialized modules. */
	static get modules() { return Application.#modules; }

	/**
		Starts the application.

		1. Loads app modules from [`/core/backend/data/modules.json`](/modules/core/backend/data/modules.json). For each app module:
			- Imports it from `/${module}/backend/scripts/main.mjs`.
			- Constructs it as a `Module` ※ [`/core/backend/scripts/Module.mjs`](/modules/core/backend/scripts/Module.mjs).
			- Runs its `start` event.
		2. Creates a positive number of the following servers: `node:http`, `node:https`.
			- If both `node:http` and `node:https` servers were created, creates also a `net` server.
			- Serves front-end requests with `HTTP` ※ [`/core/backend/scripts/HTTP.mjs`](/modules/core/backend/scripts/HTTP.mjs).

		Related event:
		- {@link stop `stop`}

		@type {HookableEvent<[]>}
	*/
	static start = new HookableEvent();

	/**
		Stops the application.

		Related event:
		- {@link start `start`}

		@type {HookableEvent<[]>}
	*/
	static stop = new HookableEvent();

	static
	{
		Application.start.pro(() => Application.#started);
		Application.start.imp(Application.#start);
		Application.start.post(() => void (Application.#started = true));

		Application.stop.pro(() => !Application.#started);
		Application.stop.imp(Application.#stop);
		Application.stop.post(() => void (Application.#started = false));
	}

	/** The implementation of the {@link start `start`} event. */
	static async #start()
	{
		Console.title('Start');
		Console.log(`Bacon v${app.version} has started with node v${process.versions.node}. `);
		Console.info('Press: Q to exit, R to restart.');

		await Application.#reviveModules();

		if (!server.http.enabled && !server.https.enabled)
		{
			Console.fatal('Neither HTTP nor HTTPS is enabled.');
			return;
		}

		if (server.https.enabled)
		{
			if (Application.#HTTPSServer === null)
				Application.#createHTTPSServer();

			if
			(
					!server.http.enabled
				||	server.http.host != server.https.host
				||	server.http.port != server.https.port
			)
				await Application.#openHTTPSServer();

			Application.#createWSSServer();
		}

		if (server.http.enabled)
		{
			if (Application.#HTTPServer === null)
				Application.#createHTTPServer();

			if
			(
					!server.https.enabled
				||	server.http.host != server.https.host
				||	server.http.port != server.https.port
			)
				await Application.#openHTTPServer();

			if (!server.http.redirectToHTTPS)
				Application.#createWSServer();
		}

		if
		(
				server.http.enabled
			&&	server.https.enabled
			&&	server.http.host == server.https.host
			&&	server.http.port == server.https.port
		)
		{
			if (Application.#NetServer === null)
				Application.#createNetServer();

			await Application.#openNetServer();
		}
	}

	/** The implementation of the {@link stop `stop`} event. */
	static async #stop()
	{
		if
		(
				server.http.enabled
			&&	server.https.enabled
			&&	server.http.host == server.https.host
			&&	server.http.port == server.https.port
		)
			await Application.#closeNetServer();

		if
		(
				server.http.enabled
			&&	(
						!server.https.enabled
					||	server.http.host != server.https.host
					||	server.http.port != server.https.port
				)
		)
		{
			if (!server.http.redirectToHTTPS)
				await Application.#closeWSServer();

			await Application.#closeHTTPServer();
		}

		if
		(
				server.https.enabled
			&&	(
						!server.http.enabled
					||	server.http.host != server.https.host
					||	server.http.port != server.https.port
				)
		)
		{
			await Application.#closeWSSServer();
			await Application.#closeHTTPSServer();
		}

		await Application.#killModules();

		Console.nl();
		Console.warn('Bacon has been stopped.');
	}

	/** Imports, initializes, loads and starts modules. */
	static async #reviveModules()
	{
		Console.title('Modules');

		switch (modules.length)
		{
			case 0:

				Console.log('There are no enabled modules.');
				return;

			case 1:

				Console.log('There is 1 enabled module.');
				break;

			default:

				Console.log(`There are ${modules.length} enabled modules.`);
		}

		Console.nl();
		Console.info('Importing modules.');

		const importedModules = await Application.#importModules(modules);
		switch (importedModules.size)
		{
			case 0:

				Console.info('No modules has been successfully imported.');
				return;

			case 1:

				Console.info('Successfully imported 1 module.');
				break;

			default:

				Console.info(`Successfully imported ${importedModules.size} modules.`);
		}

		Console.nl();
		Console.info('Initializing modules.');

		Application.#modules = await Application.#initializeModules(importedModules);
		switch (Application.#modules.size)
		{
			case 0:

				Console.info('No modules has been successfully initialized.');
				return;

			case 1:

				Console.info('Successfully initialized 1 module.');
				break;

			default:

				Console.info(`Successfully initialized ${Application.#modules.size} modules.`);
		}

		Console.nl();
		Console.info('Loading modules.');

		const loadedModules = await Application.#loadModules(Application.#modules);
		switch (loadedModules.size)
		{
			case 0:

				Console.info('No modules has been successfully loaded.');
				return;

			case 1:

				Console.info('Successfully loaded 1 module.');
				break;

			default:

				Console.info(`Successfully loaded ${loadedModules.size} modules.`);
		}

		Console.nl();
		Console.info('Starting modules.');

		const startedModules = await Application.#startModules(loadedModules);
		switch (startedModules.size)
		{
			case 0:

				Console.info('No modules has been successfully started.');
				return;

			case 1:

				Console.info('Successfully started 1 module.');
				break;

			default:

				Console.info(`Successfully started ${startedModules.size} modules.`);
		}
	}

	/** Stops and unloads modules. */
	static async #killModules()
	{
		Console.nl();
		Console.info('Stopping modules.');

		const startedModules = new Map([...Application.#modules].filter(([{}, module]) => module.started));
		const stoppedModules = await Application.#stopModules(startedModules);

		switch (stoppedModules.size)
		{
			case 0:

				Console.info('No modules has been successfully stopped.');
				return;

			case 1:

				Console.info('Successfully stopped 1 module.');
				break;

			default:

				Console.info(`Successfully stopped ${stoppedModules.size} modules.`);
		}

		Console.nl();
		Console.info('Unloading modules.');

		const unloadedModules = await Application.#unloadModules(stoppedModules);
		switch (unloadedModules.size)
		{
			case 0:

				Console.info('No modules has been successfully unloaded.');
				return;

			case 1:

				Console.info('Successfully unloaded 1 module.');
				break;

			default:

				Console.info(`Successfully unloaded ${unloadedModules.size} modules.`);
		}
	}

	/**
		Imports modules.

		@param {string[]} names
		Names of modules to import.

		@return
		Successfully imported module constructors.
	*/
	static async #importModules(names)
	{
		/** @type {Promise<{ name: string, constructor: FunctionConstructor }>[]} */
		const promises = [];

		for (const name of names)
		{
			promises.push(new Promise(async (resolve, reject) =>
			{
				try
				{
					const path = `/${name}/backend/scripts/main.mjs`;
					const file = await import(path);

					// class is a 'special function' with own property descriptor 'writable' set to `false`
					const isClass = (/** @type {*} */ type) =>
					(
							typeof type == 'function'
						&&	Object.getOwnPropertyDescriptor(type, 'prototype')?.writable === false
					);

					if (isClass(file?.default))
					{
						Console.ok(`Module '${name}' has been successfully imported.`);
						resolve({ name: name, constructor: file.default });
					}
					else
					{
						Console.error(`Imported module '${name}' is not a class.`);
						reject();
					}
				}
				catch (message)
				{
					Console.error(`Importing module '${name}' failed.`, { message: message });
					reject();
				}
			}));
		}

		/** @type {ModuleConstructors} */
		const importedModules = new Map();
		const results = await Promise.allSettled(promises);

		for (const result of results)
			if (result.status == 'fulfilled')
				importedModules.set(result.value.name, result.value.constructor);

		return importedModules;
	}

	/**
		Initializes modules.

		@param {ModuleConstructors} modules
		Modules to initialize.

		@return
		Successfully initialized modules.
	*/
	static async #initializeModules(modules)
	{
		/** @type {Promise<{ name: string, module: Module }>[]} */
		const promises = [];

		for (const [name, constructor] of modules)
			promises.push(new Promise((resolve, reject) =>
			{
				try
				{
					const module = new constructor();

					if (module instanceof Module)
					{
						Console.ok(`Module '${name}' has been successfully initialized.`);
						resolve({ name: name, module: module });
					}
					else
					{
						Console.error(`Module '${name}' is not a Module derived class.`);
						reject();
					}
				}
				catch (message)
				{
					Console.error(`Initializing module '${name}' failed.`, { message: message });
					reject();
				}
			}));

		/** @type {Modules} */
		const initializedModules = new Map();
		const results = await Promise.allSettled(promises);

		for (const result of results)
			if (result.status == 'fulfilled')
				initializedModules.set(result.value.name, result.value.module);

		return initializedModules;
	}

	/**
		Loads modules.

		@param {Modules} modules
		Modules to load.

		@return
		Successfully loaded modules.
	*/
	static async #loadModules(modules)
	{
		/** @type {Promise<{ name: string, module: Module }>[]} */
		const promises = [];

		for (const [name, module] of modules)
			promises.push(new Promise(async (resolve, reject) =>
			{
				try
				{
					await module.load.run();

					Console.ok(`Module '${name}' has been successfully loaded.`);
					resolve({ name: name, module: module });
				}
				catch (message)
				{
					Console.error(`Loading module '${name}' failed.`, { message: message });
					reject();
				}
			}));

		/** @type {Modules} */
		const loadedModules = new Map();
		const results = await Promise.allSettled(promises);

		for (const result of results)
			if (result.status == 'fulfilled')
				loadedModules.set(result.value.name, result.value.module);

		return loadedModules;
	}

	/**
		Unloads modules.

		@param {Modules} modules
		Modules to unload.

		@return
		Successfully unloaded modules.
	*/
	static async #unloadModules(modules)
	{
		/** @type {Promise<{ name: string, module: Module }>[]} */
		const promises = [];

		for (const [name, module] of modules)
			promises.push(new Promise(async (resolve, reject) =>
			{
				try
				{
					await module.unload.run();

					Console.ok(`Module '${name}' has been successfully unloaded.`);
					resolve({ name: name, module: module });
				}
				catch (message)
				{
					Console.error(`Unloading module '${name}' failed.`, { message: message });
					reject();
				}
			}));

		/** @type {Modules} */
		const unloadedModules = new Map();
		const results = await Promise.allSettled(promises);

		for (const result of results)
			if (result.status == 'fulfilled')
				unloadedModules.set(result.value.name, result.value.module);

		return unloadedModules;
	}

	/**
		Starts modules.

		@param {Modules} modules
		Modules to start.

		@return
		Successfully started modules.
	*/
	static async #startModules(modules)
	{
		/** @type {Promise<{ name: string, module: Module }>[]} */
		const promises = [];

		for (const [name, module] of modules)
			promises.push(new Promise(async (resolve, reject) =>
			{
				try
				{
					await module.start.run();

					Console.ok(`Module '${name}' has been successfully started.`);
					resolve({ name: name, module: module });
				}
				catch (message)
				{
					Console.error(`Starting module '${name}' failed.`, { message: message });
					reject();
				}
			}));

		/** @type {Modules} */
		const startedModules = new Map();
		const results = await Promise.allSettled(promises);

		for (const result of results)
			if (result.status == 'fulfilled')
				startedModules.set(result.value.name, result.value.module);

		return startedModules;
	}

	/**
		Stops modules.

		@param {Modules} modules
		Modules to stop.

		@return
		Successfully stopped modules.
	*/
	static async #stopModules(modules)
	{
		/** @type {Promise<{ name: string, module: Module }>[]} */
		const promises = [];

		for (const [name, module] of modules)
			promises.push(new Promise(async (resolve, reject) =>
			{
				try
				{
					await module.stop.run();

					Console.ok(`Module '${name}' has been successfully stopped.`);
					resolve({ name: name, module: module });
				}
				catch (message)
				{
					Console.error(`Stopping module '${name}' failed.`, { message: message });
					reject();
				}
			}));

		/** @type {Modules} */
		const stoppedModules = new Map();
		const results = await Promise.allSettled(promises);

		for (const result of results)
			if (result.status == 'fulfilled')
				stoppedModules.set(result.value.name, result.value.module);

		return stoppedModules;
	}

	/**
		Creates a Net server.

		If `server.http.redirectToHTTPS` is set:
		- Redirects all requests to the https.

		Otherwise:
		- Requests are handled by the {@link HTTP `HTTP`} class.
	*/
	static #createNetServer()
	{
		Console.title('Net');
		Console.info('Creating Net server.');

		try
		{
			if (Application.#NetServer !== null)
				throw 'Net server is already created.';

			Application.#NetServer = net.createServer(socket =>
			{
				socket.once('data', buffer =>
				{
					socket.pause();

					const proxy = (() =>
					{
						const firstByte = buffer[0];

						if (firstByte == 22)
							return Application.#HTTPSServer;

						if (firstByte !== undefined && firstByte > 32 && firstByte < 127)
							return Application.#HTTPServer;

						return null;
					})();

					if (proxy)
					{
						socket.unshift(buffer);
						Application.#NetSockets.push(socket);
						socket.on('close', () => void Application.#NetSockets.splice(Application.#NetSockets.indexOf(socket), 1));
						proxy.emit('connection', socket);
					}

					process.nextTick(() => socket.resume());
				});
			});

			Console.ok('Net server has been successfully created.');
			Console.log('Net server proxies both HTTP and HTTPS requests.');
		}
		catch (message)
		{
			Console.fatal('Creating Net server failed.', { message });
		}
	}

	/**
		Creates an HTTP server.

		If `server.http.redirectToHTTPS` is set:
		- Redirects all requests to the https.

		Otherwise:
		- Requests are handled by the {@link HTTP `HTTP`} class.
	*/
	static #createHTTPServer()
	{
		Console.title('HTTP');
		Console.info('Creating HTTP server.');

		try
		{
			if (Application.#HTTPServer !== null)
				throw 'HTTP server is already created.';

			if (server.http.redirectToHTTPS)
				Application.#HTTPServer = http.createServer((request, response) =>
				{
					try
					{
						response.setHeader('App', app.name);
						response.setHeader('Content-Length', 0);
						response.setHeader('Location', `https://${server.https.host}:${server.https.port}${request.url}`);
						response.writeHead(301);
						response.end();
					}
					catch (message)
					{
						Console.error('Handling HTTP request failed.', { request, response, message });
					}
				});
			else
			{
				Application.#HTTPServer = http.createServer(async (request, response) =>
				{
					try
					{
						if (request.url === undefined)
							throw 'Request URL is empty';

						await HTTP.request.run(request, response);
					}
					catch (message)
					{
						Console.error('Handling HTTP request failed.', { request, response, message });
					}
				});
			}

			Console.ok('HTTP server has been successfully created.');

			if (server.http.redirectToHTTPS)
				Console.log('HTTP server redirects requests to the HTTPS server.');
			else
			{
				Console.warn('HTTP server handles requests without TLS.');
				Console.log('Consider disabling the HTTP server or redirecting insecure requests to the HTTPS server.');
			}
		}
		catch (message)
		{
			Console.fatal('Creating HTTP server failed.', { message });
		}
	}

	/**
		Creates an HTTPS server.
		- Requests are handled by the {@link HTTP `HTTP`} class.
	*/
	static #createHTTPSServer()
	{
		Console.title('HTTPS');
		Console.info('Creating HTTPS server.');

		try
		{
			if (Application.#HTTPSServer !== null)
				throw 'HTTPS server is already created.';

			Application.#HTTPSServer = https.createServer
			(
				{
					cert: fs.readFileSync(fs.realpathSync('./modules' + server.https.cert)),
					key: fs.readFileSync(fs.realpathSync('./modules' + server.https.key)),
				},

				async (request, response) =>
				{
					try
					{
						if (request.url === undefined)
							throw 'Request URL is empty';

						await HTTP.request.run(request, response);
					}
					catch (message)
					{
						Console.error('Handling HTTPS request failed.', { request, response, message });
					}
				}
			);

			Console.ok('HTTPS server has been successfully created.');
		}
		catch (message)
		{
			Console.fatal('Creating HTTPS server failed.', { message });
		}
	}

	/**
		Creates a WS server.
		- Requests are handled by the {@link ServerSocket `Socket`} class.
	*/
	static #createWSServer()
	{
		Console.title('WS');
		Console.info('Creating WS server.');

		try
		{
			if (Application.#WSServer !== null)
				throw 'WS server is already created.';

			if (Application.#HTTPServer === null)
				throw 'HTTP server is not created.';

			Application.#WSServer = new ws.WebSocketServer({ server: Application.#HTTPServer });
			Application.#WSServer.on('connection', (socket, request) =>
			{
				try
				{
					Application.#WebSockets.push(socket);
					socket.on('close', () => void Application.#WebSockets.splice(Application.#WebSockets.indexOf(socket), 1));
					socket.on('message', message =>
					{
						try
						{
							ServerSocket.message.run(message, socket, request);
						}
						catch (message)
						{
							Console.error('Handling socket message failed.', { socket, request, message });
						}
					});
				}
				catch (message)
				{
					Console.error('Handling WS connection failed.', { socket, request, message });
				}
			});

			Console.ok('WS server has been successfully created.');
		}
		catch (message)
		{
			Console.fatal('Creating WS server failed.', { message });
		}
	}

	/**
		Creates a WSS server.
		- Requests are handled by the {@link ServerSocket `Socket`} class.
	*/
	static #createWSSServer()
	{
		Console.title('WSS');
		Console.info('Creating WSS server.');

		try
		{
			if (Application.#WSSServer !== null)
				throw 'WSS server is already created.';

			if (Application.#HTTPSServer === null)
				throw 'HTTPS server is not created.';

			Application.#WSSServer = new ws.WebSocketServer({ server: Application.#HTTPSServer });
			Application.#WSSServer.on('connection', (socket, request) =>
			{
				try
				{
					Application.#WebSocketsSecure.push(socket);
					socket.on('close', () => void Application.#WebSocketsSecure.splice(Application.#WebSocketsSecure.indexOf(socket), 1));
					socket.on('message', message =>
					{
						try
						{
							ServerSocket.message.run(message, socket, request);
						}
						catch (message)
						{
							Console.error('Handling secure socket message failed.', { socket, request, message });
						}
					});
				}
				catch (message)
				{
					Console.error('Handling WSS connection failed.', { socket, request, message });
				}
			});

			Console.ok('WSS server has been successfully created.');
		}
		catch (message)
		{
			Console.fatal('Creating WSS server failed.', { message });
		}
	}

	/** Opens the Net server. */
	static async #openNetServer()
	{
		Console.nl();
		Console.info('Opening Net server.');

		try
		{
			if (Application.#NetServer === null)
				throw 'Net server is not created.';

			if (Application.#NetServer.listening)
				throw 'Net server is already opened.';

			if (Application.#NetServer !== null)
				await util.promisify(Application.#NetServer.listen).bind(Application.#NetServer, server.http.port, server.http.host)();

			Console.ok('Net server has been successfully opened.');
			Console.log(`Net server is listening at ${server.http.host}:${server.http.port}.`);
		}
		catch (message)
		{
			Console.fatal('Opening Net server failed.', { message: message });
		}
	}

	/** Opens the HTTP server. */
	static async #openHTTPServer()
	{
		Console.nl();
		Console.info('Opening HTTP server.');

		try
		{
			if (Application.#HTTPServer === null)
				throw 'HTTP server is not created.';

			if (Application.#HTTPServer.listening)
				throw 'HTTP server is already opened.';

			if (Application.#HTTPServer !== null)
				await util.promisify(Application.#HTTPServer.listen).bind(Application.#HTTPServer, server.http.port, server.http.host)();

			Console.ok('HTTP server has been successfully opened.');
			Console.log(`HTTP server is listening at ${server.http.host}:${server.http.port}.`);
		}
		catch (message)
		{
			Console.fatal('Opening HTTP server failed.', { message: message });
		}
	}

	/** Opens the HTTPS server. */
	static async #openHTTPSServer()
	{
		Console.nl();
		Console.info('Opening HTTPS server.');

		try
		{
			if (Application.#HTTPSServer === null)
				throw 'HTTPS server is not created.';

			if (Application.#HTTPSServer.listening)
				throw 'HTTPS server is already opened.';

			if (Application.#HTTPSServer !== null)
				await util.promisify(Application.#HTTPSServer.listen).bind(Application.#HTTPSServer, server.https.port, server.https.host)();

			Console.ok('HTTPS server has been successfully opened.');
			Console.log(`HTTPS server is listening at ${server.https.host}:${server.https.port}.`);
		}
		catch (message)
		{
			Console.fatal('Opening HTTPS server failed.', { message: message });
		}
	}

	/** Closes the Net server. */
	static async #closeNetServer()
	{
		Console.nl();
		Console.info('Closing Net server.');

		try
		{
			if (Application.#NetServer === null)
				throw 'Net server is not created.';

			if (!Application.#NetServer.listening)
				throw 'Net server is not opened.';

			for (const socket of Application.#NetSockets)
				socket.destroy();

			await util.promisify(Application.#NetServer.close).bind(Application.#NetServer)();

			Console.ok('Net server has been successfully closed.');
		}
		catch (message)
		{
			Console.error('Closing Net server failed.', { message });
		}
	}

	/** Closes the HTTP server. */
	static async #closeHTTPServer()
	{
		Console.nl();
		Console.info('Closing HTTP server.');

		try
		{
			if (Application.#HTTPServer === null)
				throw 'HTTP server is not created.';

			if (!Application.#HTTPServer.listening)
				throw 'HTTP server is not opened.';

			Application.#HTTPServer.closeAllConnections();
			await util.promisify(Application.#HTTPServer.close).bind(Application.#HTTPServer)();

			Console.ok('HTTP server has been successfully closed.');
		}
		catch (message)
		{
			Console.error('Closing HTTP server failed.', { message });
		}
	}

	/** Closes the HTTPS server. */
	static async #closeHTTPSServer()
	{
		Console.nl();
		Console.info('Closing HTTPS server.');

		try
		{
			if (Application.#HTTPSServer === null)
				throw 'HTTPS server is not created.';

			if (!Application.#HTTPSServer.listening)
				throw 'HTTPS server is not opened.';

			Application.#HTTPSServer.closeAllConnections();
			await util.promisify(Application.#HTTPSServer.close).bind(Application.#HTTPSServer)();

			Console.ok('HTTPS server has been successfully closed.');
		}
		catch (message)
		{
			Console.error('Closing HTTPS server failed.', { message });
		}
	}

	/** Closes the WS server. */
	static async #closeWSServer()
	{
		Console.nl();
		Console.info('Closing WS server.');

		try
		{
			if (Application.#WSServer === null)
				throw 'WS server is not created.';

			for (const socket of Application.#WebSockets)
				socket.terminate();

			await util.promisify(Application.#WSServer.close).bind(Application.#WSServer)();
			Application.#WSServer = null;

			Console.ok('WS server has been successfully closed.');
		}
		catch (message)
		{
			Console.error('Closing WS server failed.', { message });
		}
	}

	/** Closes the WSS server. */
	static async #closeWSSServer()
	{
		Console.nl();
		Console.info('Closing WSS server.');

		try
		{
			if (Application.#WSSServer === null)
				throw 'WSS server is not created.';

			for (const socket of Application.#WebSocketsSecure)
				socket.terminate();

			await util.promisify(Application.#WSSServer.close).bind(Application.#WSSServer)();
			Application.#WSSServer = null;

			Console.ok('WSS server has been successfully closed.');
		}
		catch (message)
		{
			Console.error('Closing WSS server failed.', { message });
		}
	}
}