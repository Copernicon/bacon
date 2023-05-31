import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';

/**
	Makes links with the `data-goto` attribute to navigate to a new page on click ¹.
	- The page path is the `data-goto` attribute.
	- Sets the `data-goto-hooked` attribute to affected links.

	1. Except if they have any of the following classes: `disabled`, `active`.

	@note
	- Local links (without `://`) are handled with the {@link Navigation.goto `Navigation.goto`}.
	- External links are handled by setting the `document.location.href`.
*/
export default class GotoLinks
{
	static
	{
		GotoLinks.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						GotoLinks.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
	}

	/** Hooks all links with the `data-goto` attribute not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = '[data-goto]:not([data-goto-hooked])';

		if (element.matches(selector))
			GotoLinks.#hook(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLElement)
				GotoLinks.#hook(element);
	}

	/** Hooks the link {@link element `element`}. */
	static #hook(/** @type {HTMLElement} */ element)
	{
		element.addEventListener('click', () =>
		{
			for (const className of ['disabled', 'active'])
				if (element.classList.contains(className))
					return;

			const path = String(element.getAttribute('data-goto'));

			if (path.includes('://'))
			{
				document.location.href = path;
				return;
			}

			Navigation.goto.run({ path });
		});

		element.setAttribute('data-goto-hooked', '');
	}
}