import Forms from '/core/frontend/scripts/feats/Forms.mjs';

/**
	Updates the {@link Forms `Forms`} focus on the input autofill.
	- Sets the `data-autofill-hooked` attribute to autofilled inputs.

	@note
	The input autofill triggers the `input` event, but it's delayed until a first user trusted event.
	It seems possible, however, to check for the `input:autofill` to catch the input autofill before.
*/
export default class HookAutofill
{
	static
	{
		HookAutofill.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						HookAutofill.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
    }

	/** Hooks all inputs not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = 'input:not([data-autofill-hooked])';

		if
		(
				element instanceof HTMLInputElement
			&&	element.matches(selector)
		)
			HookAutofill.#hook(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLInputElement)
				HookAutofill.#hook(element);
	}

	/** Hooks {@link input `input`}. */
	static #hook(/** @type {HTMLInputElement} */ input)
	{
		// The input autofill seems to happen in about one second after the input creation.
		for (let delay = 100; delay <= 6400; delay <<= 1)
			setTimeout(() =>
			{
				if (!input.matches(':not([data-autofill-hooked]):autofill'))
					return;

				input.setAttribute('data-autofill-hooked', '');
				Forms.updateFocus();
			}, delay);
	}
}