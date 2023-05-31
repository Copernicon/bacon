import auth from '/core/backend/data/auth.json' assert { type: 'json' };

/**

	@typedef {{
		name: string,
		logo?: string,
		target: string,
	}} LoginMethod

	Related types:
	- {@link Login `Login`}

*/
export {};

/** Login manager. */
export default class Login
{
	/** @type {LoginMethod[]} */
	static #methods = [];

	static get methods()
	{
		return Login.#methods;
	}

	/** Adds a login method. */
	static addMethod(/** @type {LoginMethod} */ method)
	{
		if (auth.methods.email.login)
			Login.#methods.push(method);
	}
}