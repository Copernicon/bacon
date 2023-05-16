import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';

/**
	Moves module scripts from `body` to `head`.
	- Adds the `data-moved` attribute to them.
	- Removes them post {@link Navigation.goto `Navigation.goto`}.

	@remarks
	Adds the iteration query string to allow re–executing scripts.
*/
export default class LinkBodyScripts
{
	/** Re–executing script iteration. */
	static #iteration = 0;

	static
	{
		Navigation.goto.post(LinkBodyScripts.#removeMovedScripts);
		Navigation.goto.post(LinkBodyScripts.#moveScripts);
	}

	/** Moves module scripts from `body` to `head`. */
	static #moveScripts()
	{
		const scripts = document.body.querySelectorAll('script[src][type=module]');

		for (const script of scripts)
		{
			const headScript = document.createElement('script');
			headScript.setAttribute('type', 'module');
			headScript.setAttribute('async', '');
			headScript.setAttribute('src', `${script.getAttribute('src')}?iteration=${LinkBodyScripts.#iteration++}`);
			headScript.setAttribute('data-moved', '');
			document.head.append(headScript);
		}
	}

	/** Removes module scripts from `head` that were moved from the `body`. */
	static #removeMovedScripts()
	{
		const scripts = document.head.querySelectorAll('script[data-moved]');

		for (const script of scripts)
			script.remove();
	}
}