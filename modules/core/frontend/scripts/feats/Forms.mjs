import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import Cookies from '/core/frontend/scripts/interfaces/Cookies.mjs';
import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';

/**
	@typedef {{ id: string, json: Object.<string, *> }} FormsResponse
	A form submit response.

	Properties:
	- `id` — The submitted form id, *eg* `core/login`.
	- `json` — The JSON object with a response.

	Related event:
	- {@link Forms.response `Forms.response`}
*/
export {};

/**
	 Hooks all forms with the following attributes: `action`, `method` and `id`.

		- Submit shall make a {@link fetch `fetch`} query instead with a JSON string.
			- Adds the `success` class to the form on successfull query.
		- Serializes files to data URLs, and if a file has an extension:
			- Adds the field `${key}_extension` with the extension as value.
		- The query result shall be shown in the related `output`, if available.
			- The related output's `for` attribute equals the form's `id` attribute.

	Class `data-restricted` on the form indicates it's action is restricted.

		- In that case, if the user is logged in, the following field shall be added:
			- `token`: session token
*/
export default class Forms
{
	/**
		The form submit response.
		@type {HookableEvent<[FormsResponse]>}
	*/
	static response = new HookableEvent();

	static
	{
		Navigation.goto.post(Forms.#queryFill);
		Navigation.goto.post(Forms.#submitQueryFilledForms);
		Navigation.goto.post(Forms.updateFocus);

		Forms.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						Forms.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
	}

	/**
		Updates the focus to the first element that is xeither a not `:autofill`ed and not *query-filled¹*
		input xor a submit button, that is neither `[hidden]`, `:disabled`, `[readonly]` nor inside a `[hidden]` form, if any.
		Otherwise, if the active element is an autofilled input, blurs it.

		1. Mapped from query params using `name`s.
	*/
	static updateFocus()
	{
		const inputRestrictions = ':not(:autofill):not([data-query-filled])';
		const commonRestrictions = ':not(:is(:valid, :disabled, [readonly], :has(:checked:not(:disabled))))';
		const element = document.body.querySelector
		(
			`form:not([hidden]) :is(input${inputRestrictions}, select, textarea, button[type="submit"])${commonRestrictions}`
		);

		if (element instanceof HTMLElement)
		{
			element.focus();
			return;
		}

		if
		(
				document.activeElement instanceof HTMLInputElement
			&&	document.activeElement.matches('input:autofill')
		)
			document.activeElement.blur();
	}

	/** Hooks all forms with the following attributes: `action`, `method` and `id` not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = 'form[action][method][id]';

		if
		(
				element instanceof HTMLFormElement
			&&	element.matches(selector)
		)
			Forms.#hook(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLFormElement)
				Forms.#hook(element);
	}

	/** Hooks {@link form `form`}. */
	static #hook(/** @type {HTMLFormElement} */ form)
	{
		const action = form.getAttribute('action');
		const method = form.getAttribute('method');
		const id = form.getAttribute('id');

		if
		(
				action === null
			||	method === null
			||	id === null
		)
			return;

		const output = document.body.querySelector(`output[for="${id}"]`);

		if (!(output instanceof HTMLOutputElement))
			return;

		form.addEventListener('submit', async event =>
		{
			event.preventDefault();

			/** @type {Object.<string, *>} */
			const object = {};

			form.classList.remove('success');
			form.querySelectorAll('[name]').forEach(e =>
			{
				if
				(
						!(e instanceof HTMLInputElement)
					&&	!(e instanceof HTMLSelectElement)
					&&	!(e instanceof HTMLTextAreaElement)
				)
					return;

				const key = e.name;
				const value = e.value;
				const keys = [key.match(/(?<key>^[^[]*)/u), ...key.matchAll(/\[(?<key>[^\]]+)\]/gu)].map(value => value?.groups?.key ?? '');

				/** @type {*} */
				let element = object;

				for (const key of keys)
				{
					if (typeof element[key] != 'object')
						element[key] = {};

					element = element[key];
				}

				void value;
				const index = keys.map(value => '[\'' + value + '\']').join('');
				const newValue = key.match(/\[\]$/u) ? `(Array.isArray(object${index}) ? [...object${index}, value] : [value])` : 'value';

				eval(`object${index} = ${newValue}`);
			});

			/** @type {Object.<string, *>} */
			const files = Object.fromEntries(new FormData(form).entries());
			await Forms.#serializeFiles(files);

			for (const [key, value] of Object.entries(files))
				object[key] = value;

			if (form.hasAttribute('data-restricted'))
			{
				const token = Cookies.get('core/session/token');

				if
				(
						token === null
					&&	output instanceof HTMLOutputElement
				)
				{
					Forms.#showError(output, 'Zapytanie wymaga autoryzacji. Zaloguj się.');
					return;
				}

				object.token = token;
			}

			if (form.hasAttribute('data-projected'))
			{
				const project = Cookies.get('core/project/id');

				if
				(
						project === null
					&&	output instanceof HTMLOutputElement
				)
				{
					Forms.#showError(output, 'Zapytanie wymaga wybrania aktywnego projektu. Wybierz aktywny projekt.');
					return;
				}

				object.project = project;
			}

			const data = JSON.stringify(object);
			const response = await fetch(action, { method: method, body: data }).catch(() => {});
			const code = `<code>${method} ${action}: ${response?.status} ${response?.statusText}</code>`;
			const successMessage = `Zapytanie powiodło się. ${code}`;
			const errorMessage = `Zapytanie nie powiodło się. ${code}`;

			if (!response)
			{
				console.error(`Fetching '${action}' failed.`, response);
				Forms.#showError(output, errorMessage);
				return;
			}

			const json = await response.json().catch(() => {});

			if (json?.constructor !== Object)
			{
				console.error(`Fetched '${action}' is invalid.`, response);
				Forms.#showError(output, json.message ?? errorMessage);
				return;
			}

			if (!response.ok || !json.success)
			{
				Forms.#showError(output, json.message ?? errorMessage);
				return;
			}

			Forms.#showSuccess(output, json.message ?? successMessage);
			form.classList.add('success');

			Forms.response.run({ id: id, json: json });
		});
	}

	/**
		Maps query params to inputs, using `name`s.
		- Adds the `data-query-filled` attribute to affected inputs.
	*/
	static #queryFill()
	{
		if (location.search.length == 0)
			return;

		const search = new URLSearchParams(location.search);

		for (const [key, value] of search)
		{
			const element = document.body.querySelector(`input[name="${key}"]:not([data-query-filled])`);

			if (!(element instanceof HTMLInputElement))
				continue;

			element.value = value;
			element.setAttribute('data-query-filled', '');
		}
	}

	/**
		Serializes files to data URLs, and if a file has an extension:
		- Adds the field `${key}_extension` with the extension as value.
		Otherwise, removes the entry, leaving only files and extensions.
	*/
	static async #serializeFiles(/** @type {Object.<string, *>} */ object)
	{
		for (const [key, value] of Object.entries(object))
		{
			if
			(
					!(value instanceof File)
				||	value.size == 0
			)
			{
				delete object[key];
				continue;
			}

			const extension = value.name.match(/\.(?<extension>[^.]+)$/u)?.groups?.extension;

			if (extension)
				object[`${key}_extension`] = extension;

			const file = await new Promise(resolve =>
			{
				const fileReader = new FileReader();

				fileReader.onload = () => resolve(fileReader.result);
				fileReader.readAsDataURL(value);
			});

			object[key] = file;
		}
	}

	/**
		Submits all forms with all inputs¹ *query-filled²*³.

		1. Except inputs that are either `[hidden]`, `:disabled` or `[readonly]`.
		2. Mapped from query params using `name`s ※ {@link #queryFill `queryFill`}.
		3. Forms with no *query-filled²* inputs won't be submitted.
	*/
	static #submitQueryFilledForms()
	{
		const inputs = document.body.querySelectorAll('input[data-query-filled]');

		/** @type {HTMLFormElement[]} */
		const forms = [];

		for (const input of inputs)
			if
			(
					input instanceof HTMLInputElement
				&&	input.form instanceof HTMLFormElement
			)
				forms.push(input.form);

		for (const form of forms)
		{
			const inputs = form.querySelectorAll('input:not(:is([hidden], :disabled, [readonly], [data-query-filled]))');

			if (inputs.length == 0)
				form.requestSubmit();
		}
	}

	/** Shows the error {@link message `message`} on {@link output `output`}. */
	static #showError(/** @type {HTMLOutputElement} */ output, /** @type {string} */ message)
	{
		output.classList.remove('green');
		output.classList.add('red');
		output.innerHTML = message;
		output.removeAttribute('hidden');
		output.scrollIntoView();
	}

	/** Shows the success {@link message `message`} on {@link output `output`}. */
	static #showSuccess(/** @type {HTMLOutputElement} */ output, /** @type {string} */ message)
	{
		output.classList.remove('red');
		output.classList.add('green');
		output.innerHTML = message;
		output.removeAttribute('hidden');
		output.scrollIntoView();
	}
}