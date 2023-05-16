import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';

/**

	@typedef {{
		id: string,
		data?: object
	}} ClientSocketMessage
	A client web socket message.

	Properties:
	- `id` — The message id, *eg* `ping`.
	- `data` — The message data — a {@link JSON.stringify `JSON.stringify`}–able object.

	Related events:
	- {@link ClientSocket.send `ClientSocket.send`}
	- {@link ClientSocket.receive `ClientSocket.receive`}

	Related class:
	- {@link ClientSocket `ClientSocket`}

*/
export {};

/** The client web socket interface. */
export default class ClientSocket
{
	/** @type {WebSocket} */
	static #socket;

	/**
		Opens a web socket connection.
		@type {HookableEvent<[]>}
	*/
	static open = new HookableEvent();

	/**
		Closes a web socket connection.
		@type {HookableEvent<[CloseEvent]>}
	*/
	static close = new HookableEvent();

	/**
		Sends a web socket message to the server.
		@type {HookableEvent<[ClientSocketMessage]>}
	*/
	static send = new HookableEvent();

	/**
		Receives a web socket message from the server.
		@type {HookableEvent<[ClientSocketMessage]>}
	*/
	static receive = new HookableEvent();

	static
	{
		ClientSocket.open.imp(ClientSocket.#open);
		ClientSocket.close.imp(ClientSocket.#close);
		ClientSocket.send.imp(ClientSocket.#send);
	}

	/** Opens a web socket connection. */
	static async #open()
	{
		ClientSocket.#socket = await new Promise(resolve =>
		{
			const protocol = document.location.protocol == 'https:' ? 'wss' : 'ws';
			const socket = new WebSocket(`${protocol}://${document.location.host}`);

			socket.onopen = () => resolve(socket);
		});

		ClientSocket.#socket.onmessage = event => void ClientSocket.#receive(event?.data);
		ClientSocket.#socket.onclose = closeEvent => void ClientSocket.close.run(closeEvent);
	}

	/** The implementation of the {@link close `close`} event. */
	static #close(/** @type {CloseEvent} */ closeEvent)
	{
		switch (ClientSocket.#socket.readyState)
		{
			case WebSocket.CLOSING:
			case WebSocket.CLOSED:

				return;
		}

		ClientSocket.#socket.close(closeEvent.code, closeEvent.reason);
	}

	/** The implementation of the {@link send `send`} event. */
	static #send(/** @type {ClientSocketMessage} */ message)
	{
		ClientSocket.#socket.send(JSON.stringify(message));
	}

	/** Handles a web socket message. */
	static #receive(/** @type {*} */ data)
	{
		if (typeof data != 'string')
		{
			console.error('[Socket] Invalid data received.');
			return;
		}

		try
		{
			const message = JSON.parse(data);

			if (typeof message?.id != 'string')
				throw 'Invalid message id type';

			if (message?.data === undefined)
			{
				ClientSocket.receive.run({ id: message.id });
				return;
			}

			if (message?.data?.constructor !== Object)
				throw 'Invalid message data type';

			ClientSocket.receive.run({ id: message.id, data: message.data });
		}
		catch (message)
		{
			console.error('[Socket] Invalid data received.', message);
		}
	}
}