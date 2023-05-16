export default class CheckBox
{
	static
	{
		CheckBox.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						CheckBox.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
	}

	/** Hooks all check boxes not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = 'input[type="checkbox"]:not([data-checkbox-hooked])';

		if
		(
				element.matches(selector)
			&&	element instanceof HTMLInputElement
		)
			CheckBox.#hook(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLInputElement)
				CheckBox.#hook(element);
	}

	/** Hooks the check box {@link element `element`}. */
	static #hook(/** @type {HTMLInputElement} */ element)
	{
		if (!element.parentElement?.classList.contains('multiselect'))
			element.setAttribute('value', element.getAttribute('value') == '1' ? '1' : '0');

		element.addEventListener('click', () =>
		{
			element.setAttribute('value', element.getAttribute('value') == '1' ? '0' : '1');

			if (element.hasAttribute('data-required'))
				CheckBox.#postCheckChange(element);
		});

		CheckBox.#postCheckChange(element);

		element.setAttribute('tabindex', '0');
		element.setAttribute('data-checkbox-hooked', '');
	}

	static #postCheckChange(/** @type {HTMLInputElement} */ input)
	{
		if (input.value == '1')
			input.setCustomValidity('');
		else
			input.setCustomValidity(input?.getAttribute('data-required') ?? '');
	}
}