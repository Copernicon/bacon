import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';
import Menu from '/core/frontend/scripts/feats/Menu.mjs';
import Login from '/core/frontend/scripts/feats/Login.mjs';
import googleData from '/sign-with-google/shared/data/google.json' assert { type: 'json' };

export default class SignWithGoogle
{
	static
	{
		SignWithGoogle.#hookMenuEntry();
		Menu.update.post(() => void SignWithGoogle.#hookMenuEntry());
		Navigation.goto.post(SignWithGoogle.#postGoto);

		Login.login.post(SignWithGoogle.#addSignWithGoogleButton);
		Login.login.post(SignWithGoogle.#sessionate);
		Login.logout.post(SignWithGoogle.#addSignWithGoogleButton);
		Login.logout.post(SignWithGoogle.#unsessionate);
		Login.restore.post(SignWithGoogle.#addSignWithGoogleButton);
		Login.restore.post(SignWithGoogle.#sessionate);
	}

	/** Hooks `menu-entry[data-name="sign-with-google"]` to redirect end–user to the external *Sign with Google* authentication page on click. */
	static #hookMenuEntry()
	{
		const selector = 'body > nav > menu-group[data-name="users"] > menu-entry[data-name="sign-with-google"]:not([data-goto-hooked])';
		const menuEntry = document.querySelector(selector);

		if (menuEntry === null)
			return;

		{
			const div = document.createElement('div');
			div.style.alignItems = 'flex-end';
			div.style.width = '100%';

			const img = document.createElement('img');
			img.setAttribute('src', '/sign-with-google/frontend/icons/double-arrow-right.svg');
			img.setAttribute('width', '24px');
			img.setAttribute('height', '24px');
			img.classList.add('icon');

			div.append(img);
			menuEntry.append(div);
		}

		menuEntry.addEventListener('click', SignWithGoogle.#gotoGoogleSign);
		menuEntry.setAttribute('data-goto-hooked', '');
	}

	static #postGoto(/** @type {import('/core/frontend/scripts/interfaces/Navigation.mjs').Page} */ page)
	{
		if (page.path.replace(/\?.*$/u, '') != 'core/main')
			return;

		SignWithGoogle.#addSignWithGoogleButton();
	}

	/** Adds the *Sign with Google* button on the `core/main` page. */
	static #addSignWithGoogleButton()
	{
		const selector =
		(
				'main span:has(button[data-goto="core/login"])'
			+	':not(:has(button[data-goto="core/login"] + button[data-name="sign-with-google"][data-goto-hooked]))'
		);

		const span = document.body.querySelector(selector);

		if (span === null)
			return;

		const button = document.createElement('button');
		const img = document.createElement('img');
		const imgArrow = document.createElement('img');

		button.addEventListener('click', SignWithGoogle.#gotoGoogleSign);
		button.setAttribute('data-name', 'sign-with-google');

		img.setAttribute('src', '/sign-with-google/frontend/icons/external/google.80.svg');
		img.setAttribute('width', '24px');
		img.setAttribute('height', '24px');
		img.classList.add('icon');

		imgArrow.setAttribute('src', '/sign-with-google/frontend/icons/double-arrow-right.svg');
		imgArrow.setAttribute('width', '24px');
		imgArrow.setAttribute('height', '24px');
		imgArrow.classList.add('icon');

		button.append(img, 'Korzystaj z Google', imgArrow);
		span.append(button);
	}

	/** Redirects the end–user to the external *Sign with Google* authentication page. */
	static #gotoGoogleSign()
	{
		const scopes = [
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile',
		];

		let url = 'https://accounts.google.com/o/oauth2/v2/auth';
		url += `?client_id=${googleData.clientID}`;
		url += `&redirect_uri=${document.location.origin}/sign-with-google/sign`;
		url += `&scope=${scopes.join(' ')}`;
		url += '&include_granted_scopes=true';
		url += '&response_type=code';
		url += '&access_type=offline';
		document.location = url;
	}

	/** Hides *Sign with Google* entry for logged in user. */
	static #sessionate()
	{
		const signWithGoogle = document.body.querySelector('nav [data-name="sign-with-google"]');

		if (signWithGoogle instanceof HTMLElement)
		{
			signWithGoogle.setAttribute('hidden', '');
			signWithGoogle.removeAttribute('tabindex');
		}
	}

	/** Shows *Sign with Google* entry for not logged in user. */
	static #unsessionate()
	{
		const signWithGoogle = document.body.querySelector('nav [data-name="sign-with-google"]');

		if (signWithGoogle instanceof HTMLElement)
		{
			signWithGoogle.removeAttribute('hidden');
			signWithGoogle.setAttribute('tabindex', '1');
		}
	}
}