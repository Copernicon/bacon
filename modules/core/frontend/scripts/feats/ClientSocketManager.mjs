import ClientSocket from '/core/frontend/scripts/interfaces/ClientSocket.mjs';
import Login from '/core/frontend/scripts/feats/Login.mjs';

/**
	The client web socket manager.

	Keeps the socket connection open.
	- Sends pings post client socket opens.
	- Sends pings `Ping.#interval` seconds post pongs.
*/
export default class ClientSocketManager
{
	/**
		Ping – pong interval (in seconds).

		@constant
	*/
	static #pingPongInterval = 60;

	/**
		Interval of reopening a web socket connection (in seconds).

		@constant
	*/
	static #reopenInterval = 60;

	/** @type {NodeJS.Timeout} */
	static #pingPongTimeout;

	/** @type {NodeJS.Timeout} */
	static #reopenTimeout;

	static
	{
		ClientSocket.receive.imp(ClientSocketManager.#receive);
		ClientSocket.open.post(ClientSocketManager.#postOpen);
		ClientSocket.close.post(ClientSocketManager.#postClose);

		Login.login.post(() => void ClientSocket.open.run());
		Login.logout.post(() => void ClientSocket.close.run(new CloseEvent('close', { code: 1000, reason: 'logout', wasClean: true, })));
		Login.restore.post(() => void ClientSocket.open.run());
	}

	/** The implementation of the {@link ClientSocket.receive `ClientSocket.receive`} event. */
	static #receive(/** @type {import('/core/frontend/scripts/interfaces/ClientSocket.mjs').ClientSocketMessage} */ message)
	{
		if (message.id != 'pong')
			return;

		if (ClientSocketManager.#pingPongTimeout)
			clearTimeout(ClientSocketManager.#pingPongTimeout);

		ClientSocketManager.#pingPongTimeout = setTimeout(() => void ClientSocket.send.run({ id: 'ping' }), ClientSocketManager.#pingPongInterval * 1e3);
	}

	/** The post–handler of the {@link ClientSocket.open `ClientSocket.open`} event. */
	static #postOpen()
	{
		ClientSocket.send.run({ id: 'ping' });
	}

	/** The post–handler of the {@link ClientSocket.close `ClientSocket.close`} event. */
	static #postClose(/** @type {CloseEvent} */ closeEvent)
	{
		if (closeEvent.code != 1000)
			console.error('[Socket] Connection closed.', { code: closeEvent.code, reason: closeEvent.reason });

		if (ClientSocketManager.#reopenTimeout)
			clearTimeout(ClientSocketManager.#reopenTimeout);

		ClientSocketManager.#reopenTimeout = setTimeout(() => void ClientSocket.open.run(), ClientSocketManager.#reopenInterval * 1e3);
	}
}