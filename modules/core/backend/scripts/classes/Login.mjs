/**

	@typedef {{
		name: string,
		logo?: string,
		pages: {
			login: string,
			add: string,
			remove: string,
		}
		API: string,
	}} LoginMethod

	Properties:
	- `name` — A login method name, *eg* `E–mail`.
	- `logo` — A login method logo, *eg* `/core/frontend/icons/email.svg`.
	- `pages.login` — An address to the page that logins a user, *eg* `core/login-email`.
	- `pages.add` — An address to the page that adds the login method to a user, *eg* `core/login-email`.
	- `pages.remove` — An address to the page that removes the login method from a user, *eg* `core/login-email`.
	- `API` — An address to the API endpoint, *eg* `core/login-email`.

	API endpoint script should have the following actions available:
	- `action='login'` that logins the user, used by the `pages.login` page.
	- `action='add login method'` that adds the login method to a user, used by the `pages.add` page.
	- `action='remove login method'` that removes the login method from a user, used by the `pages.remove` page.
	- `action='check availability'` that checks if a user can use the login method.

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
		Login.#methods.push(method);
	}
}