export default class TextareaLimit
{
	static
	{
		TextareaLimit.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						TextareaLimit.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
    }

	/** Hooks all textareas not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = 'textarea:not([data-textarea-limit-hooked])';

		if
		(
				element instanceof HTMLTextAreaElement
			&&	element.matches(selector)
		)
			TextareaLimit.#hook(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLTextAreaElement)
				TextareaLimit.#hook(element);
	}

	/** Hooks {@link textarea `textarea`}. */
	static #hook(/** @type {HTMLTextAreaElement} */ textarea)
	{
		textarea.setAttribute('data-textarea-limit-hooked', '');
		new ResizeObserver(() =>
		{
			if (textarea.clientWidth == 0)
			{
				textarea.removeEventListener('change', updateFunction);
				textarea.removeEventListener('keydown', updateFunction);
				textarea.removeEventListener('keyup', updateFunction);
				small.hidden = true;
			}
			else
			{
				textarea.addEventListener('change', updateFunction);
				textarea.addEventListener('keydown', updateFunction);
				textarea.addEventListener('keyup', updateFunction);
				small.hidden = false;
			}
		}).observe(textarea);

		const small = document.createElement('small');
		small.classList.add('input-info');
		small.style.marginTop = 'calc(-.5 * var(--app-margin))';
		small.style.alignSelf = 'flex-end';
		small.append('Limit znaków: ' + textarea.maxLength);
		textarea.parentElement?.after(small);

		const updateFunction = () =>
		{
			if (textarea.textLength == 0)
			{
				small.replaceChildren('Limit znaków: ' + String(textarea.maxLength));
				small.classList.remove('input-info');
				small.classList.remove('input-error');
				small.classList.add('input-success');
				return;
			}

			const lengthLeft = textarea.maxLength - textarea.textLength;

			if (lengthLeft < 0)
			{
				small.replaceChildren('Pozostało znaków: ' + String(lengthLeft));
				small.classList.remove('input-success');
				small.classList.remove('input-info');
				small.classList.add('input-error');
				return;
			}

			small.replaceChildren('Pozostało znaków: ' + String(lengthLeft));
			small.classList.remove('input-info');
			small.classList.remove('input-error');
			small.classList.add('input-success');
		};

		if (textarea.clientWidth == 0)
		{
			small.hidden = true;
			return;
		}

		textarea.addEventListener('change', updateFunction);
		textarea.addEventListener('keydown', updateFunction);
		textarea.addEventListener('keyup', updateFunction);
	}
}