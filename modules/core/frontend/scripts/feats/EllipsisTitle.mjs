/**
	Sets a `title` to all overflowed elements with `text-overflow: ellipsis`.
	- Element's `title` shall equal element's `textContent`.
	- Element's `title` shall be removed upon overflow loose.
*/
export default class EllipsisTitle
{
	static
	{
		EllipsisTitle.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						EllipsisTitle.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
	}

	/** Hooks all elements with `text-overflow: ellipsis` not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		if (getComputedStyle(element).textOverflow == 'ellipsis')
			EllipsisTitle.#hook(element);

		const elements = element.querySelectorAll('*');

		for (const element of elements)
			if
			(
					element instanceof HTMLElement
				&&	getComputedStyle(element).textOverflow == 'ellipsis'
			)
				EllipsisTitle.#hook(element);
	}

	/** Hooks {@link element `element`}. */
	static #hook(/** @type {HTMLElement} */ element)
	{
		EllipsisTitle.updateTitle(element);

		new ResizeObserver(entries =>
		{
			for (const entry of entries)
				if (entry.target instanceof HTMLElement)
					EllipsisTitle.updateTitle(entry.target);
		}).observe(element);
	}

	/** Updates {@link element `element`}'s `title`. */
	static updateTitle(/** @type {HTMLElement} */ element)
	{
		if (element.scrollWidth > element.offsetWidth && element.textContent)
			element.setAttribute('title', element.textContent);
		else
			element.removeAttribute('title');
	}
}