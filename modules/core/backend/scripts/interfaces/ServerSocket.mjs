import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import JarredCookies from '/core/shared/scripts/interfaces/JarredCookies.mjs';
import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

/**

	@typedef {import('ws').RawData} Message
	A raw {@link WebSocket `WebSocket`} message.

	Related event:
	- {@link ServerSocket.message `ServerSocket.message`}

	Related class:
	- {@link ServerSocket `ServerSocket`}

*//**

	@typedef {import('ws').WebSocket} WebSocket
	A web socket from [`ws`](https://npmjs.com/package/ws) package.

	Related event:
	- {@link ServerSocket.message `ServerSocket.message`}

	Related class:
	- {@link ServerSocket `ServerSocket`}

*//**

	@typedef {import('node:http').IncomingMessage} Request
	A raw {@link WebSocket `WebSocket`} request.

	Related event:
	- {@link ServerSocket.message `ServerSocket.message`}

	Related class:
	- {@link ServerSocket `ServerSocket`}

*//**

	@typedef {{
		user: number,
		id: string,
		data?: object
	}} ServerSocketMessage
	A server web socket message.

	Properties:
	- `user` — The user id.
	- `id` — The message id, *eg* `hello`.
	- `data` — The message data, a {@link JSON.stringify `JSON.stringify`}–able object.

	Related events:
	- {@link ServerSocket.send `ServerSocket.send`}
	- {@link ServerSocket.receive `ServerSocket.receive`}

	Related class:
	- {@link ServerSocket `ServerSocket`}

*/
export {};

/** The server web socket interface. */
export default class ServerSocket
{
	/** @type {Map<number, WebSocket>} */
	static #sockets = new Map();

	/**
		Receives a raw web socket message.
		@type {HookableEvent<[Message, WebSocket, Request]>}
	*/
	static message = new HookableEvent();

	/**
		Sends a web socket message.
		@type {HookableEvent<[ServerSocketMessage]>}
	*/
	static send = new HookableEvent();

	/**
		Receives a web socket message.
		@type {HookableEvent<[ServerSocketMessage]>}
	*/
	static receive = new HookableEvent();

	static
	{
		ServerSocket.message.imp(ServerSocket.#message);
		ServerSocket.send.imp(ServerSocket.#send);
	}

	/** The implementation of the {@link message `message`} event. */
	static async #message(/** @type {Message} */ data, /** @type {WebSocket} */ socket, /** @type {Request} */ request)
	{
		if (request.headers.cookie === undefined)
		{
			socket.close(4401, 'Unauthorized: Missing \'core/session/token\' cookie.');
			return;
		}

		const token = JarredCookies.get('core/session/token', request.headers.cookie);

		if (token === null)
		{
			socket.close(4401, 'Unauthorized: Missing \'core/session/token\' cookie.');
			return;
		}

		if (token.length != server.tokenSize)
		{
			socket.close(4401, 'Unauthorized: Invalid session token.');
			return;
		}

		const user = await Permissions.getUserByToken(token);

		if (user === null)
		{
			socket.close(4403, 'Forbidden: Authorization failed.');
			return;
		}

		try
		{
			const message = JSON.parse(String(data));

			if (typeof message?.id != 'string')
			{
				socket.close(1002, 'Malformed frame: Invalid message id type.');
				return;
			}

			if (message?.data !== undefined && message?.data?.constructor !== Object)
			{
				socket.close(1002, 'Malformed frame: Invalid message data type.');
				return;
			}

			if (!ServerSocket.#sockets.has(user))
			{
				ServerSocket.#sockets.set(user, socket);
				socket.on('close', () => void ServerSocket.#sockets.delete(user));
			}

			ServerSocket.receive.run({ user, ...message });
		}
		catch (message)
		{
			socket.close(1002, `Malformed frame: ${message}.`);
		}
	}

	/** The implementation of the {@link send `send`} event. */
	static #send(/** @type {ServerSocketMessage} */ message)
	{
		const socket = ServerSocket.#sockets.get(message.user);

		if (!socket)
			return;

		try
		{
			/** @type {{ id: string; data?: object }} */
			const object = { id: message.id };

			if (message.data !== undefined)
				object.data = message.data;

			socket.send(JSON.stringify(object));
		}
		catch (message)
		{
			console.error(message);
		}
	}
}