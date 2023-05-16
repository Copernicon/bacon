/**
	Clicks the focused `tabindex`able element on pressing Enter.
	- Sets the `data-enter-hooked` attribute to `tabindex`able elements.
*/
export default class ClickOnEnter
{
	static
	{
		ClickOnEnter.#hookRecursively(document.body);

		// new element(s)
		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						ClickOnEnter.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });

		// existing not hooked element becomes tabindexable
		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				if (mutation instanceof HTMLElement)
					ClickOnEnter.#hookRecursively(mutation);
		}).observe(document.body, { attributes: true, attributeFilter: ['tabindex'] });

		// existing hooked element stops being tabindexable
		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				if
				(
						![null, '-1'].includes(mutation.oldValue)
					&&	mutation.target instanceof HTMLElement
					&&	mutation.target.hasAttribute('data-enter-hooked')
					&&	[null, '-1'].includes(mutation.target.getAttribute('tabindex'))
				)
					ClickOnEnter.#unhook(mutation.target);
		}).observe(document.body, { attributeOldValue: true, attributeFilter: ['tabindex'] });
	}

	/** Hooks all `tabindex`able elements not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = '[tabindex]:not([tabindex="-1"]):not([data-enter-hooked])';

		if
		(
				element instanceof HTMLElement
			&&	element.matches(selector)
		)
		{
			ClickOnEnter.#hook(element);
			return;
		}

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLElement)
				ClickOnEnter.#hook(element);
	}

	/** Hooks {@link element `element`}. */
	static #hook(/** @type {HTMLElement} */ element)
	{
		element.addEventListener('keypress', ClickOnEnter.#postKeypress);
		element.setAttribute('data-enter-hooked', '');
	}

	/** Unhooks {@link element `element`}. */
	static #unhook(/** @type {HTMLElement} */ element)
	{
		element.removeEventListener('keypress', ClickOnEnter.#postKeypress);
		element.removeAttribute('data-enter-hooked');
	}

	/** @this HTMLElement */
	static #postKeypress(/** @type {KeyboardEvent} */ event)
	{
		/** @type {HTMLElement} */// @ts-ignore
		const element = this;

		if (event.key != 'Enter')
			return;

		event.preventDefault();
		element.dispatchEvent(new Event('click'));
	}
}