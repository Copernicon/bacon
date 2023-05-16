import ServerSocket from '/core/backend/scripts/interfaces/ServerSocket.mjs';

/**
	Keeps the socket connection open.
	- Sends pongs post client pings.
*/
export default class Pong
{
	static
	{
		ServerSocket.receive.post(Pong.#postReceive);
	}

	static #postReceive(/** @type {import('/core/backend/scripts/interfaces/ServerSocket.mjs').ServerSocketMessage} */ message)
	{
		if (message.id != 'ping')
			return;

		ServerSocket.send.run({ user: message.user, id: 'pong' });
	}
}