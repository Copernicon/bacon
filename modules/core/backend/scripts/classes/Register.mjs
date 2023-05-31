import auth from '/core/backend/data/auth.json' assert { type: 'json' };

/**

	@typedef {{
		name: string,
		logo?: string,
		target: string,
	}} RegisterMethod

	Related types:
	- {@link Register `Register`}

*/
export {};

/** Registration manager. */
export default class Register
{
	/** @type {RegisterMethod[]} */
	static #methods = [];

	static get methods()
	{
		return Register.#methods;
	}

	/** Adds a registration method. */
	static addMethod(/** @type {RegisterMethod} */ method)
	{
		if (auth.methods.email.register)
			Register.#methods.push(method);
	}
}