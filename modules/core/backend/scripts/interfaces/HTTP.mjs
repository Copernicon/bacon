import fs from 'node:fs';
import { Buffer } from 'node:buffer';
import etag from 'etag';
import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import JarredCookies from '/core/shared/scripts/interfaces/JarredCookies.mjs';
import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import Resources from '/core/backend/scripts/classes/Resources.mjs';
import Location from '/core/shared/scripts/structs/Location.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import app from '/core/shared/data/app.json' assert { type: 'json' };
import server from '/core/backend/data/server.json' assert { type: 'json' };

/**
	@typedef {import('node:http').IncomingMessage} Request
	{@link https `node:http`} request.

*//**

	@typedef {import('node:http').ServerResponse<Request> & { req: Request; }} Response
	{@link https `node:http`} response.

*/
export {};

/** Checks if a file or directory specified by {@link path `path`} is accessible. */
const access = (/** @type {fs.PathLike} */ path, /** @type {number | undefined} */ mode) => noexcept(fs.accessSync)(path, mode) !== null;

/**
	Handles HTTP {@link request `request`}s.

	Related data files:
	- {@link app `/core/shared/data/app.json`}
	- {@link server `/core/backend/data/server.json`}
*/
export default class HTTP
{
	/**
		End-user HTTP request.
		@type {HookableEvent<[Request, Response]>}
	*/
	static request = new HookableEvent();

	static
	{
		HTTP.request.pro(HTTP.#redirectIndexToRoot);
		HTTP.request.pro(HTTP.#disallowExtendedApiRequests);
		HTTP.request.pro(HTTP.#handleRootRequest);
		HTTP.request.pro(HTTP.#handleUploadsRequest);
		HTTP.request.pen(HTTP.#setFaviconLocation);
		HTTP.request.pen(HTTP.#setApiExtension);
		HTTP.request.imp(HTTP.#handleRequest);
	}

	/** Sends HTTP response. */
	static #sendResponse
	(
		/** @type {Response} */ response,
		/** @type {number} */ statusCode,
		/** @type {string} */ contentType,
		/** @type {Buffer | string} */ data
	)
	{
		response.setHeader('Content-Type', contentType);
		response.setHeader('Content-Length', data instanceof Buffer ? data.byteLength : Buffer.byteLength(data, 'utf8'));
		response.writeHead(statusCode);
		response.write(data);
		response.end();
	}

	/** Redirects `index` and `/index.*` to the root location, *ie* `/`. */
	static #redirectIndexToRoot(/** @type {Request}*/ request, /** @type {Response} */ response)
	{
		if (!request.url?.match(/^\/index(?:\.[\p{L}\p{N}_-]+)?(?:\?[^#]*)?$/u))
			return false;

		response.setHeader('App', app.name);
		response.setHeader('Content-Length', 0);
		response.setHeader('Location', '/');
		response.writeHead(301);
		response.end();

		return true;
	}

	/** Disallows API requests with extended filename. */
	static #disallowExtendedApiRequests(/** @type {Request}*/ request, /** @type {Response} */ response)
	{
		if (!request.url)
			return false;

		const location = Location.fromString(request.url);

		if
		(
				location?.layer != 'api'
			||	location.filename.extension === null
		)
			return false;

		response.setHeader('App', app.name);
		HTTP.#sendResponse(response, 400, 'application/json', JSON.stringify({ success: false, message: 'API requests cannot have an extension.' }));

		return true;
	}

	/** Handles a request to the root location. */
	static #handleRootRequest(/** @type {Request}*/ request, /** @type {Response} */ response)
	{
		if
		(
				request.url != '/'
			&&	!request.url?.match(/^(?:\/[\p{L}\p{N}]+(?:[._-]?[\p{L}\p{N}]+)*){2}(?:\?[^#]*)?$/u)
		)
			return false;

		if (request.method != 'GET')
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 405, 'application/json', JSON.stringify(
			{
				success: false,
				message: 'Static resources can be accessed with \'GET\' method only.'
			}));

			return true;
		}

		const head =
		(
				'<head>'
			+	Resources.getHeadHTML()
			+	Resources.getScripts()
			+	Resources.getStyles()
			+	'</head>'
		);

		const body =
		(
				'<body>'
			+	Resources.getBodyHTML()
			+	Resources.getAside()
			+	Resources.getHeader()
			+	Resources.getMenu()
			+	Resources.getMain()
			+	'</body>'
		);

		const html = `<!DOCTYPE html><html lang="pl">${head}${body}`;

		response.setHeader('App', app.name);
		response.setHeader('Cache-Control', 'no-cache');
		response.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
		response.setHeader('ETag', etag(html));
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Allow-Credentials', 'true');

		HTTP.#sendResponse(response, 200, 'text/html', html);
		return true;
	}

	/** Handles a request to the uploaded file. */
	static async #handleUploadsRequest(/** @type {Request}*/ request, /** @type {Response} */ response)
	{
		const extension = request.url?.match(/^\/uploads\/\d{4}\/\d{2}\/.{64}\.(?<extension>.*)$/u)?.groups?.extension;

		if (extension === undefined)
			return false;

		if (request.method != 'GET')
		{
			response.setHeader('App', app.name);
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.setHeader('Access-Control-Allow-Credentials', 'true');
			HTTP.#sendResponse(response, 405, 'application/json', JSON.stringify(
			{
				success: false,
				message: 'Static resources can be accessed with \'GET\' method only.'
			}));

			return true;
		}

		/** @type {string | undefined} */// @ts-ignore
		const contentType = server.uploadImgExtensions[extension];

		if (contentType === undefined)
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 415, 'application/json', JSON.stringify({ success: false, message: `Unsupported extension '${extension}'.` }));

			return true;
		}

		const path = `${fs.realpathSync('.')}/${request.url}`;

		if (!access(path, fs.constants.R_OK))
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 404, 'application/json', JSON.stringify({ success: false, message: `File '${request.url}' not found.` }));

			return true;
		}

		const permissions = await HTTP.#hasAllPermissions(request, path);

		if (permissions === null)
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 500, 'application/json', JSON.stringify({ success: false, message: 'Checking permissions failed.' }));

			return true;
		}

		if (permissions === false)
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 401, 'application/json', JSON.stringify({ success: false, message: 'Authentication required.' }));

			return true;
		}

		if (permissions !== true)
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 403, 'application/json', JSON.stringify(
			{
				success: false,
				message: 'Missing permissions.',
				missing: permissions,
			}));

			return true;
		}

		const data = noexcept(fs.readFileSync)(path);

		if (!data)
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 503, 'application/json', JSON.stringify({ success: false, message: `Reading '${request.url}' failed.` }));

			return true;
		}

		response.setHeader('App', app.name);
		response.setHeader('Cache-Control', 'private, immutable, max-age=31536000');
		response.setHeader('Content-Length', Buffer.byteLength(data, 'utf8'));

		HTTP.#sendResponse(response, 200, contentType, data);
		return true;
	}

	/** Sets a real location for favicon requests. */
	static #setFaviconLocation(/** @type {Request} */ request)
	{
		if (request.url == '/favicon.ico')
			request.url = '/core/frontend/icons/favicon.ico';
	}

	/** Sets an extension for API requests. */
	static #setApiExtension(/** @type {Request} */ request)
	{
		if (!request.url)
			return;

		const location = Location.fromString(request.url);

		if (location?.layer != 'api')
			return;

		location.filename.extension = 'mjs';
		request.url = location.toString();
	}

	static async #handleRequest(/** @type {Request}*/ request, /** @type {Response} */ response)
	{
		response.setHeader('App', app.name);

		if (!request.url)
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 400, 'application/json', JSON.stringify({ success: false, message: 'URL not found.' }));
			return;
		}

		const location = Location.fromString(request.url);

		if (location === null)
		{
			response.setHeader('App', app.name);
			HTTP.#sendResponse(response, 400, 'application/json', JSON.stringify({ success: false, message: `URL '${request.url}' is invalid.` }));
			return;
		}

		if (location.layer == 'backend')
		{
			HTTP.#sendResponse(response, 403, 'application/json', JSON.stringify({ success: false, message: 'Backend layer is forbidden for end-users.' }));
			return;
		}

		if (location.filename.extension === null)
		{
			HTTP.#sendResponse(response, 400, 'application/json', JSON.stringify({ success: false, message: 'Extension not found.' }));
			return;
		}

		/** @type {string | undefined} */// @ts-ignore
		const contentType = server.extensions[location.filename.extension];

		if (contentType === undefined)
		{
			const extension = `.${location.filename.extension}`;
			HTTP.#sendResponse(response, 415, 'application/json', JSON.stringify({ success: false, message: `Unsupported extension '${extension}'.` }));
			return;
		}

		const modulePath = `${fs.realpathSync('./modules')}/${location.module}`;

		if (!access(modulePath, fs.constants.R_OK))
		{
			HTTP.#sendResponse(response, 404, 'application/json', JSON.stringify({ success: false, message: `Module '${location.module}' not found.` }));
			return;
		}

		const path = `${modulePath}/${location.layer}${location.path}/${location.filename.stem}.${location.filename.extension}`;

		if (!access(path, fs.constants.R_OK))
		{
			HTTP.#sendResponse(response, 404, 'application/json', JSON.stringify({ success: false, message: `File '${request.url}' not found.` }));
			return;
		}

		const permissions = await HTTP.#hasAllPermissions(request, path);

		if (permissions === null)
		{
			HTTP.#sendResponse(response, 500, 'application/json', JSON.stringify({ success: false, message: 'Checking permissions failed.' }));
			return;
		}

		if (permissions === false)
		{
			HTTP.#sendResponse(response, 401, 'application/json', JSON.stringify({ success: false, message: 'Authentication required.' }));
			return;
		}

		if (permissions !== true)
		{
			HTTP.#sendResponse(response, 403, 'application/json', JSON.stringify(
			{
				success: false,
				message: 'Missing permissions.',
				missing: permissions,
			}));

			return;
		}

		if (location.layer == 'api')
		{
			if (request.method != 'POST')
			{
				HTTP.#sendResponse(response, 405, 'application/json', JSON.stringify({ success: false, message: 'Invalid method.' }));
				return;
			}

			const file = await import(`/${path}`).catch(() => {});

			if (typeof file != 'object')
			{
				HTTP.#sendResponse(response, 500, 'application/json', JSON.stringify({ success: false, message: `Importing '${request.url}' failed.` }));
				return;
			}

			if (typeof file.default != 'function')
			{
				HTTP.#sendResponse(response, 500, 'application/json', JSON.stringify(
				{
					success: false,
					message: `Module '${request.url}' has no default export function.`
				}));

				return;
			}

			/** @type {*[]} */
			const chunks = [];

			request.on('data', chunk => void chunks.push(chunk));
			request.on('end', async () =>
			{
				const body = Buffer.concat(chunks).toString();
				const json = noexcept(JSON.parse)(body);

				if (json?.constructor !== Object)
				{
					HTTP.#sendResponse(response, 400, 'application/json', JSON.stringify({ success: false, message: 'Invalid API request.' }));
					return;
				}

				const data = await noexcept(file.default)(body);

				if (typeof data != 'string')
					return;

				const apiResponse = noexcept(JSON.parse)(data);

				if (apiResponse?.constructor !== Object)
				{
					HTTP.#sendResponse(response, 500, 'application/json', JSON.stringify({ success: false, message: 'API request failed.' }));
					return;
				}

				response.setHeader('Cache-Control', 'max-age=0');
				HTTP.#sendResponse(response, apiResponse.success ? 200 : apiResponse.code ?? 500, 'application/json', data);
			});

			return;
		}

		if (request.method != 'GET')
		{
			HTTP.#sendResponse(response, 405, 'application/json', JSON.stringify(
			{
				success: false,
				message: 'Static resources can be accessed with \'GET\' method only.'
			}));
			return;
		}

		const stats = noexcept(fs.statSync)(path);

		if (!stats)
		{
			HTTP.#sendResponse(response, 503, 'application/json', JSON.stringify({ success: false, message: `Stating '${request.url}' failed.` }));
			return;
		}

		const mtime = stats.mtime.toUTCString();

		if (mtime == request.headers['if-modified-since'])
		{
			response.writeHead(304);
			response.end();
			return;
		}

		const data = noexcept(fs.readFileSync)(path);

		if (!data)
		{
			HTTP.#sendResponse(response, 503, 'application/json', JSON.stringify({ success: false, message: `Reading '${request.url}' failed.` }));
			return;
		}

		const eTag = etag(data);

		if (eTag == request.headers['if-none-match'])
		{
			response.writeHead(304);
			response.end();
			return;
		}

		response.setHeader('Cache-Control', 'no-cache');
		response.setHeader('Last-Modified', mtime);
		response.setHeader('ETag', eTag);

		HTTP.#sendResponse(response, 200, contentType, data);
	}

	/**
		Checks if user has all permissions required to access a file specified by {@link path `path`}.

		@note
		All permissions but `system` in `core` module also requires the `session` permission in `core` module, which requires
		user to be logged in and the `/core/session/token` cookie is taken from the {@link request `request`} header.

		@return {Promise<boolean|import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]|null>}
		If user is logged in and has all required permissions:
		- `true`

		If user is not logged in:
		- `false`

		If user is logged in and hasn't all required permissions:
		- `Permission[]` — missing permissions

		If it's unknown ∵ an error occured:
		- `null`
	*/
	static async #hasAllPermissions(/** @type {Request}*/ request, /** @type {string} */ path)
	{
		const data = noexcept(fs.readFileSync)(`${path}.perms`);

		if (data === null)
			return true;

		/** @type {import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]} */
		const permissionsToCheck = [];

		/** @type {import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]} */
		const missingPermissions = [];

		/** Indicates if user is required to be logged in. */
		let sessionRequired = false;

		for (const line of data.toString().split('\n'))
			switch (line)
			{
				case 'core/system':

					missingPermissions.push({ module: 'core', name: 'system' });
					break;

				default:

					const [module, name] = line.split('/');

					if (module === undefined || name === undefined)
						break;

					permissionsToCheck.push({ module, name });

				case 'core/session':

					sessionRequired = true;
					break;
			}

		if (sessionRequired)
		{
			if (request.headers.cookie === undefined)
				return false;

			const token = JarredCookies.get('core/session/token', request.headers.cookie);

			if (token?.length != server.tokenSize)
				return false;

			const user = await Permissions.getUserByToken(token);

			if (user === null)
				return false;

			const project = JarredCookies.get('core/project/id', request.headers.cookie);

			if (permissionsToCheck.length)
			{
				const permissions = await Permissions.hasAllPermissions(user, project ? Number(project) : null, permissionsToCheck);

				if (permissions === null)
					return null;

				if (permissions !== true)
					return { ...missingPermissions, ...permissions };
			}
		}

		return true;
	}
}