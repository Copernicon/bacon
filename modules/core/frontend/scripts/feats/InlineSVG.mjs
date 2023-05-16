/**
	Inlines all `img` elements with the `svg` extension.
	- Sets the `data-src` attribute to the image URL.
	- Drops all other attributes except: `width`, `height`, `class` and `title`.
*/
export default class InlineSVG
{
	static
	{
		InlineSVG.#inlineRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						InlineSVG.#inlineRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
	}

	/** Inlines all `img` elements with the `svg` extension not outside {@link element `element`}. */
	static #inlineRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = 'img[src$=".svg"]';

		if
		(
				element instanceof HTMLImageElement
			&&	element.matches(selector)
		)
			InlineSVG.#inline(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLImageElement)
				InlineSVG.#inline(element);
	}

	/** Inlines {@link image `image`}. */
	static async #inline(/** @type {HTMLImageElement} */ image)
	{
		const address = image.getAttribute('src');

		if (address === null)
			return;

		const text = await (async () =>
		{
			try
			{
				return await (await fetch(address)).text();
			}
			catch (message)
			{
				console.error(`Fetching SVG icon '${address}' failed.`, message);
				return null;
			}
		})();

		if (text === null)
			return;

		const svg = new DOMParser().parseFromString(text, 'text/html').body.firstElementChild;

		if (!(svg instanceof Element))
			return;

		svg.setAttribute('data-src', address);

		for (const attribute of ['width', 'height', 'class', 'title'])
		{
			const value = image.getAttribute(attribute);

			if (value === null)
				continue;

			svg.setAttribute(attribute, value);
		}

		image.replaceWith(svg);
	}
}