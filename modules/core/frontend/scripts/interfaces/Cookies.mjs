import JarredCookies from '/core/shared/scripts/interfaces/JarredCookies.mjs';

/**
	The cookies manager.

	References:
	- [[MDN] Glossary / Cookie](developer.mozilla.org/en-US/docs/Glossary/Cookie)
	- [[MDN] HTTP / Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
	- [[MDN] `document.cookie`](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
*/
export default class Cookies
{
	/**
		Gets a cookie by {@link name `name`}.

		@return
		The cookie xor `null` if it was not found.
	*/
	static get(/** @type {string} */ name)
	{
		return JarredCookies.get(name, document.cookie);
	}

	/** Gets all cookies. */
	static getAll()
	{
		return JarredCookies.getAll(document.cookie);
	}

	/**
		Sets a domain-wide¹, strict² cookie.

		1. `path=/`
		2. `samesite=strict`

		@param {string} name
		The cookie name.

		@param {string} value
		The cookie value.

		@param {boolean} persistent
		Indicates if the cookie should be persistent¹ (`true`) or session–bound (`false`, default).

		1. TTL — 4380 days (almost 12 years).
	*/
	static set(name, value, persistent = false)
	{
		if (persistent)
			document.cookie = `${name}=${value};path=/;samesite=strict;max-age=${60 ** 2 * 24 * 365 * 12}`;
		else
			document.cookie = `${name}=${value};path=/;samesite=strict`;
	}

	/**
		Removes a domain-wide¹ cookie by {@link name `name`}.

		1. `path=/`
	*/
	static remove(/** @type {string} */ name)
	{
		document.cookie = `${name}=;path=/;max-age=0`;
	}
}