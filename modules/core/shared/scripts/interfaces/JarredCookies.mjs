/**
	The jarred cookies interface.

	References:
	- [[MDN] Glossary / Cookie](developer.mozilla.org/en-US/docs/Glossary/Cookie)
	- [[MDN] HTTP / Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
	- [[MDN] `document.cookie`](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
*/
export default class JarredCookies
{
	/**
		Gets a cookie from {@link jar `jar`} by {@link name `name`}.

		@param {string} name
		The name of a cookie to get.

		@param {string} jar
		The jar to get a cookie from.

		@return
		A cookie xor `null` if it was not found.
	*/
	static get(name, jar)
	{
		const value = jar.match(new RegExp(`(?:^|; ?)${name}=(?<value>[^;]*)`, 'u'))?.groups?.value;
		return value ?? null;
	}

	/**
		Gets all cookies from {@link jar `jar`}.

		@param {string} jar
		The jar to get cookies from.
	*/
	static getAll(jar)
	{
		/** @type {Object.<string, string>} */
		const cookies = {};

		for (const cookie of jar.split(/; ?/u))
		{
			const [name, value] = cookie.split('=');

			if
			(
					name === undefined
				||	value === undefined
			)
				continue;

			cookies[name] = value;
		}

		return cookies;
	}
}