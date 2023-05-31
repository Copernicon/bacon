/**
	Makes elements with `data-show` attribute to show its targets¹ on click.
	- Add the `data-show-hooked` to hooked elements that shows others.

	Makes elements with `data-hide` attribute to hide its targets¹ on click.
	- Add the `data-show-hooked` to hooked elements that hides others.

	1. Targets are alements with `id` or `data-id` attribute on a target list².
	2. The target list is made from the `data-show` attribute split by the `|`.
*/
export default class ShowAndHide
{
	static
	{
		ShowAndHide.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						ShowAndHide.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
    }

	/** Hooks all elements not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const showSelector = '[data-show]:not([data-show-hooked])';
		const hideSelector = '[data-hide]:not([data-hide-hooked])';

		if (element.matches(showSelector))
			ShowAndHide.#hookShow(element);

		if (element.matches(hideSelector))
			ShowAndHide.#hookHide(element);

		{
			const elements = element.querySelectorAll(showSelector);

			for (const element of elements)
				if (element instanceof HTMLElement)
					ShowAndHide.#hookShow(element);
		}
		{
			const elements = element.querySelectorAll(hideSelector);

			for (const element of elements)
				if (element instanceof HTMLElement)
					ShowAndHide.#hookHide(element);
		}
	}

	/** Hooks an element to show its targets on click. */
	static #hookShow(/** @type {HTMLElement} */ element)
	{
		const targetsString = element.getAttribute('data-show');

		if (targetsString === null)
			return;

		const targetIDs = targetsString.split('|');

		element.addEventListener('click', () =>
		{
			for (const targetID of targetIDs)
			{
				const targetElements = document.body.querySelectorAll(`[data-id="${targetID}"], [id="${targetID}"]`);

				for (const targetElement of targetElements)
					targetElement.removeAttribute('hidden');
			}
		});

		element.setAttribute('data-show-hooked', '');
	}

	/** Hooks an element to hide its targets on click. */
	static #hookHide(/** @type {HTMLElement} */ element)
	{
		const targetsString = element.getAttribute('data-hide');

		if (targetsString === null)
			return;

		const targetIDs = targetsString.split('|');

		element.addEventListener('click', () =>
		{
			for (const targetID of targetIDs)
			{
				const targetElements = document.body.querySelectorAll(`[data-id="${targetID}"], [id="${targetID}"]`);

				for (const targetElement of targetElements)
					targetElement.setAttribute('hidden', '');
			}
		});

		element.setAttribute('data-hide-hooked', '');
	}
}