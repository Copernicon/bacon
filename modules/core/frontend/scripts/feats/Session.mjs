import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import Cookies from '/core/frontend/scripts/interfaces/Cookies.mjs';
import Login from '/core/frontend/scripts/feats/Login.mjs';

/** The user session manager. */
export default class Session
{
	/**
		The user session's token if the user is logged in xor `null` otherwise.
		@type {string?}
	*/
	static #token = null;

	/**
		The user session's expiration time if the user is logged in xor `null` otherwise.
		@type {Date?}
	*/
	static #expiration = null;

	/**
		The timeout for extending a session if the user is logged in xor `null` otherwise.
		@type {NodeJS.Timeout?}
	*/
	static #timeout = null;

	/** Gets the user session's token if the user is logged in xor `null` otherwise. */
	static get token() { return Session.#token; }

	/** Gets the user session's expiration time if the user is logged in xor `null` otherwise. */
	static get expiration() { return Session.#expiration; }

	/**
		Validates the user session.

		Related event:
		- {@link extend `extend`}

		@type {HookableEvent<[]>}
	*/
	static validate = new HookableEvent();

	/**
		Extends the user session.
		- Schedules re-extending it.

		Related event:
		- {@link validate `validate`}

		@type {HookableEvent<[]>}
	*/
	static extend = new HookableEvent();

	static
	{
		Session.#load();

		Session.validate.imp(Session.#validate);
		Session.validate.post(() => void Session.validate.pro(() => true));
		Session.extend.imp(Session.#extend);

		Login.login.imp(Session.#store);
		Login.login.imp(Session.#scheduleExtension);
		Login.logout.imp(Session.#remove);
		Login.logout.imp(Session.#cancelExtension);
	}

	/** Loads the session data from the {@link sessionStorage `sessionStorage`} to the {@link Session `Session`} members. */
	static #load()
	{
		Session.#token = Cookies.get('core/session/token');
	}

	/** Stores the session data in both {@link Session `Session`} members and the {@link sessionStorage `sessionStorage`}. */
	static #store(/** @type {import('/core/frontend/scripts/feats/Login.mjs').LoginData} */ data)
	{
		Session.#token = data.token;
		Session.#expiration = data.expiration;

		Cookies.set('core/session/token', data.token);
	}

	/** Removes the session data from both {@link Session `Session`} members and the {@link sessionStorage `sessionStorage`}. */
	static #remove()
	{
		Session.#token = null;
		Session.#expiration = null;

		Cookies.remove('core/session/token');
	}

	/** The implementation of the {@link validate `validate`} event. */
	static async #validate()
	{
		if (Session.#token === null)
			return;

		const path = '/core/api/v0/validate-session';
		const file = await fetch(path, { method: 'POST', body: JSON.stringify({ token: Session.#token })}).catch(message => void console.error(message));
		const json = await file?.json().catch(message => void console.error(message));

		if (!json?.valid)
			return;

		Session.#expiration = new Date(json.expiration);
		await Login.restore.run();
		Session.#scheduleExtension();
	}

	/** The implementation of the {@link extend `extend`} event. */
	static async #extend()
	{
		if (Session.#token === null)
			return;

		const path = '/core/api/v0/extend-session';
		const file = await fetch(path, { method: 'POST', body: JSON.stringify({ token: Session.#token })}).catch(message => void console.error(message));
		const json = await file?.json().catch(message => void console.error(`POST '${path}' failed.`, message));

		if (!json?.success)
		{
			await Login.logout.run();
			return;
		}

		Session.#token = json.token;
		Session.#expiration = new Date(json.expiration);
		Cookies.set('core/session/token', json.token);
		Session.#scheduleExtension();
	}

	/**
		Schedules a session extension.
		- Extension time: 30 minutes before the session expiration time.
	*/
	static #scheduleExtension()
	{
		if (Session.#expiration === null)
			return;

		const delay = Number(Session.#expiration) - Date.now() - 1000 * 60 * 30;

		if (delay < 0)
			return;

		Session.#cancelExtension();
		Session.#timeout = setTimeout(() => void Session.extend.run(), delay);
	}

	/** Cancels a session extension. */
	static #cancelExtension()
	{
		if (Session.#timeout)
			clearTimeout(Session.#timeout);
	}
}