import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import Location from '/core/shared/scripts/structs/Location.mjs';

/**

	@typedef {{ path: string }} Page
	A page to load.

	Properties:
	- `path` — Stringified parts of the {@link Location `Location`}: module and stem, separated by a comma character (U+002C, `,`),
		optionally followed by a question mark character (U+003F, `?`) and query params, *eg* `core/main`.

		Value:
		<br>

		```js
		/^(?<module>[\p{L}\p{N}]+(?:[._-]?[\p{L}\p{N}]+)*)\/(?<stem>[\p{L}\p{N}]+(?:[._-]?[\p{L}\p{N}]+)*?)(?:\?(?<params>)[^#]*)?$/u
		```
		<br>

	Related event:
	- {@link Navigation.goto `Navigation.goto`}

*/
export {};

/** The page navigator. */
export default class Navigation
{
	/** @type {AbortController} */
	static #abortController;

	/**
	 	Gets the hash.

	 	@return
		The hash (without the leading `#`) xor `null`.

	 	@remarks
		The hash is a fragment identifier of the URL — the ID on the page that the URL is
	 	trying to target, eg `about` in https://example.com/main.html#about.
	*/
	static get hash() { return location.hash == '' ? null : decodeURIComponent(location.hash.slice(1)); }

	/**
		Navigates to a page.
		- Fetches the page and replaces the `body > main` content.

		@type {HookableEvent<[Page]>}
	*/
	static goto = new HookableEvent();

	static
	{
		Navigation.goto.imp(Navigation.#loadPageToMain);
		Navigation.goto.imp(Navigation.#executeScripts);
		Navigation.goto.post(Navigation.#updateAddress);
		Navigation.goto.post(Navigation.#scrollIntoHash);
	}

	static async #loadPageToMain(/** @type {Page} */ page)
	{
		Navigation.#abortController?.abort();
		Navigation.#abortController = new AbortController();

		const location = Location.fromShortString(page.path);
		const path = location === null ? page.path : location.toString();
		const response = await fetch(path,
		{
			method: 'GET',
			signal: Navigation.#abortController.signal,
		}).catch(message => void console.error(message));

		if (!response?.ok)
		{
			console.error(`Fetching '${page.path.replace(/\?.*$/u, '')}' failed.`);
			return;
		}

		const text = await response.text().catch(message => void console.error(message));

		if (text === undefined)
		{
			console.error(`Retrieving text from the response of '${page.path.replace(/\?.*$/u, '')}' failed.`);
			return;
		}

		const main = document.body.querySelector('main');

		if (main === null)
			return;

		main.innerHTML = text;
	}

	static #executeScripts()
	{
		const scripts = document.querySelectorAll('main > script');

		for (const script of scripts)
			eval(script.innerHTML);
	}

	static #updateAddress(/** @type {Page} */ page)
	{
		if (location.pathname.substring(1) + location.search == page.path)
			return;

		const path = '/' + page.path.replace(/\?.*$/u, '');
		history.pushState({}, document.title, path);
	}

	static #scrollIntoHash()
	{
		if (!Navigation.hash)
			return;

		const hash = document.getElementById(Navigation.hash);

		if (!hash)
			return;

		hash.scrollIntoView();
	}
}