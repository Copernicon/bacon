/**
	Highlights the code in all `code` elements that either:
	- directly descends from the `pre` element
	- have a class that begins with the `language-`

	Dependencies:
	- `/core/frontend/scripts/ext/highlight.js`
	- `/core/frontend/scripts/ext/highlightjs-line-numbers.js`
*/
export default class HighlightCode
{
	static #dependenciesToLoad =
	[
		{
			src: '/core/frontend/scripts/ext/highlight.min.js',
			function: 'hljs.highlightElement'
		},
		{
			src: '/core/frontend/scripts/ext/highlightjs-line-numbers.min.js',
			function: 'hljs.lineNumbersBlock'
		}
	];

	/** @type {((element: HTMLElement) => void)[]} */
	static #loadedDependencies = [];

	static
	{
		HighlightCode.#loadNextDependency();
	}

	// Loads dependencies one by one ∵ highlightjs-line-numbers.js depends on highlight.js.
	static #loadNextDependency()
	{
		const library = HighlightCode.#dependenciesToLoad.shift();

		if (library === undefined)
		{
			HighlightCode.#postDependenciesLoad();
			return;
		}

		const script = document.createElement('script');

		script.setAttribute('src', library.src);
		script.setAttribute('async', '');
		script.addEventListener('load', () =>
		{
			HighlightCode.#loadedDependencies.push(eval(library.function));
			HighlightCode.#loadNextDependency();
		});

		document.head.append(script);
	}

	static #postDependenciesLoad()
	{
		HighlightCode.#highlightRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						HighlightCode.#highlightRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
	}

	/**
		Highlights the code in `code` elements not outside {@link element `element`} that either:
		- directly descends from the `pre` element
		- have a class that begins with the `language-`
	*/
	static #highlightRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = 'pre > code, code[class^=language-], code[class*= language-]';

		if (element.matches(selector))
			HighlightCode.#highlight(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLElement)
				HighlightCode.#highlight(element);
	}

	/** Highlights the code in {@link element `element`}. */
	static #highlight(/** @type {HTMLElement} */ element)
	{
		for (const dependency of HighlightCode.#loadedDependencies)
			dependency(element);
	}
}