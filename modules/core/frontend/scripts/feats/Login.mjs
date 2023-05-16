import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';
import Forms from '/core/frontend/scripts/feats/Forms.mjs';

/**
	@typedef {{
		token: string,
		expiration: Date,
		user: number,
		login: string,
		firstName: string?,
		nickName: string?,
		lastName: string?,
	}} LoginData
	A user login data.

	Properties:
	- `token` — The session token, proof of a user authentication.
	- `expiration` — The session expiration time.
	- `user` — The user identifier, unique across all users.
	- `login` — The user login, unique across all users.
	- `firstName` — The user's first name.
	- `nickName` — The user's nick name.
	- `lastName` — The user's last name.

	Related event:
	- {@link Login.login `Login.login`}
*/
export {};

/** The user login manager. */
export default class Login
{
	/** Indicates if the user is logged in. */
	static #logged = false;

	/** Checks if the user is logged in. */
	static get logged() { return Login.#logged; }

	/**
		Logins the user.
		@type {HookableEvent<[LoginData]>}
	*/
	static login = new HookableEvent();

	/**
		Logouts the user.
		@type {HookableEvent<[]>}
	*/
	static logout = new HookableEvent();

	/**
		Restores a valid session for the user that is still logged in after a page reload.
		@type {HookableEvent<[]>}
	*/
	static restore = new HookableEvent();

	static
	{
		Login.login.imp(() => void (Login.#logged = true));
		Login.login.post(() => void Navigation.goto.run({ path: 'core/main' }));
		Login.logout.imp(() => void (Login.#logged = false));
		Login.logout.post(() => void Navigation.goto.run({ path: 'core/main' }));
		Login.restore.imp(() => void (Login.#logged = true));
		Login.restore.post(() => void Login.restore.pro(() => true));

		Forms.response.post(Login.#postFormResponse);
	}

	static #postFormResponse(/** @type {import('/core/frontend/scripts/feats/Forms.mjs').FormsResponse} */ response)
	{
		switch (response.id)
		{
			case 'core/login':

				if (typeof response.json.token != 'string')
					return;

				Login.login.run({
					token: response.json.token,
					expiration: new Date(response.json.expiration),
					user: response.json.user,
					login: response.json.login,
					firstName: response.json.first_name ?? null,
					nickName: response.json.nick_name ?? null,
					lastName: response.json.last_name ?? null,
				});

				break;

			case 'core/logout':

				Login.logout.run();
				break;
		}
	}
}