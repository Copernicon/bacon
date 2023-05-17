import Cookies from '/core/frontend/scripts/interfaces/Cookies.mjs';

/**
	Hooks *image inputs¹*.
	- Sets the `accept` attribute of *image inputs¹*.
	- Sets validity when uploaded image is too big.
	- Shows an image preview of uploaded images.
	- Shows information about an uploaded file size.
	- Shows information about the maximum file size.

	1. `input[type="file"][data-accept="image"]`
*/
export default class ImageInput
{
	/**
		The desired `accept` attribute of *image inputs¹*.
		1. `input[type="file"][data-accept="image"]`

		@type {string?}
	*/
	static #accept = null;

	/**
		The maximum upload size of *image inputs¹*.
		1. `input[type="file"][data-accept="image"]`

		@type {number?}
	*/
	static #maxUploadSize = null;

	static
	{
		ImageInput.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						ImageInput.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
    }

	/**
		Hooks all *image inputs¹* not outside {@link element `element`}.
		1. `input[type="file"][data-accept="image"]`
	*/
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = 'input[type="file"][data-accept="image"]:not([accept])';

		if
		(
				element instanceof HTMLInputElement
			&&	element.matches(selector)
		)
			ImageInput.#hook(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLInputElement)
				ImageInput.#hook(element);
	}

	/** Hooks {@link input `input`}. */
	static #hook(/** @type {HTMLInputElement} */ input)
	{
		(async () =>
		{
			if (ImageInput.#accept === null)
				await ImageInput.#getRestrictions();

			if (ImageInput.#accept === null)
				return;

			input.setAttribute('accept', ImageInput.#accept);

			if (ImageInput.#maxUploadSize !== null)
			{
				const warning = document.createElement('small');

				warning.append(`Maksymalny rozmiar pliku: ${ImageInput.#maxUploadSize} MiB`);
				warning.classList.add('input-warning');

				input.parentElement?.after(warning);
			}

			input.addEventListener('change', () => void ImageInput.#postImageChange(input));
		})();
	}

	/**
		Gets *image inputs¹* restrictions and stores them.
		1. `input[type="file"][data-accept="image"]`
	*/
	static async #getRestrictions()
	{
		const token = Cookies.get('core/session/token');

		if (token === null)
			return;

		const json = await (async () =>
		{
			const path = '/core/api/v0/get-image-upload-restrictions';

			try
			{
				return await (await fetch(path, { method: 'POST', body: JSON.stringify({})})).json();
			}
			catch (message)
			{
				console.error(`POST '${path}' failed.`, message);
				return null;
			}
		})();

		if (!json?.success)
			return;

		/** @type {string[]} */
		const extensions = json.extensions;

		ImageInput.#accept = extensions.map(extension => `.${extension}`).join(',');
		ImageInput.#maxUploadSize = Number(json['max-upload-size']);
	}

	/**
		Hooks *image inputs¹* change.
		1. `input[type="file"][data-accept="image"]`
	*/
	static #postImageChange(/** @type {HTMLInputElement} */ input)
	{
		input.setCustomValidity('');
		input.nextElementSibling?.remove();

		{
			const info = input.parentElement?.nextElementSibling;

			if (info?.classList.contains('info'))
				info.remove();
		}

		if
		(
				!input.files
			||	!input.files.length
			||	!input.files[0]
		)
			return;

		const info = document.createElement('small');

		info.classList.add('info');
		info.append(`Rozmiar pliku: ${Math.round(input.files[0].size / 1024 ** 2 * 100) / 100} MiB`);
		input.parentElement?.after(info);

		if
		(
				ImageInput.#maxUploadSize !== null
			&&	input.files[0].size > ImageInput.#maxUploadSize * 1024 ** 2
		)
		{
			input.setCustomValidity(`Plik jest za duży (maksymalny rozmiar: ${ImageInput.#maxUploadSize} MiB)`);
			info.classList.add('input-error');

			return;
		}

		const src = URL.createObjectURL(input.files[0]);
		const img = document.createElement('img');

		img.setAttribute('src', src);
		input.after(img);

		info.classList.add('input-success');
	}
}