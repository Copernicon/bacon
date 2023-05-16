import Login from '/core/frontend/scripts/feats/Login.mjs';
import Projects from '/core/frontend/scripts/feats/Projects.mjs';
import User from '/core/frontend/scripts/feats/User.mjs';

/** The header (`body > header`) manager. */
export default class Header
{
	static
	{
		Login.login.post(Header.#showUsername);
		Login.login.post(Header.#hideLoginButton);
		Login.login.post(Header.#showLogoutButton);

		Login.logout.post(Header.#removeUsername);
		Login.logout.post(Header.#showLoginButton);
		Login.logout.post(Header.#hideLogoutButton);

		Login.restore.post(Header.#showUsername);
		Login.restore.post(Header.#hideLoginButton);
		Login.restore.post(Header.#showLogoutButton);

		Projects.set.post(Header.#showProjectName);
		Projects.unset.post(Header.#removeProjectName);
		Projects.validate.post(Header.#updateProjectName);
	}

	/** Shows {@link User.displayName `User.displayName`} in the header. */
	static #showUsername()
	{
		if (User.displayName === null)
			return;

		const button = document.getElementById('nav-user');

		if (button === null)
			return;

		button.replaceChildren();

		const img = document.createElement('img');
		img.classList.add('icon');
		img.setAttribute('src', '/core/frontend/icons/user.svg');
		img.setAttribute('width', '24');
		img.setAttribute('height', '24');
		button.append(img);

		const span = document.createElement('span');
		span.append(User.displayName);
		button.append(span);

		button.removeAttribute('hidden');
		button.setAttribute('tabindex', '2');
	}

	/** Removes {@link User.displayName `User.displayName`} from the header. */
	static #removeUsername()
	{
		const button = document.body.querySelector('#nav-user');

		if (button === null)
			return;

		button.setAttribute('hidden', '');
		button.removeAttribute('tabindex');
		button.replaceChildren();
	}

	/** Shows the login button. */
	static #showLoginButton()
	{
		const button = document.getElementById('nav-login');

		if (button === null)
			return;

		button.removeAttribute('hidden');
		button.setAttribute('tabindex', '2');
	}

	/** Hides the login button. */
	static #hideLoginButton()
	{
		const button = document.getElementById('nav-login');

		if (button === null)
			return;

		button.setAttribute('hidden', '');
		button.removeAttribute('tabindex');
	}

	/** Shows the logout button. */
	static #showLogoutButton()
	{
		const button = document.getElementById('nav-logout');

		if (button === null)
			return;

		button.removeAttribute('hidden');
		button.setAttribute('tabindex', '2');
	}

	/** Hides the logout button. */
	static #hideLogoutButton()
	{
		const button = document.getElementById('nav-logout');

		if (button === null)
			return;

		button.setAttribute('hidden', '');
		button.removeAttribute('tabindex');
	}

	/** Updates the active project name on the header. */
	static #updateProjectName()
	{
		if
		(
				Projects.id === null
			||	Projects.projectName === null
			||	Projects.logo === null
		)
		{
			Header.#removeProjectName();
			return;
		}

		Header.#showProjectName({ id: Projects.id, name: Projects.projectName, logo: Projects.logo });
	}

	/** Shows the active project name on the header. */
	static #showProjectName(/** @type {import('/core/frontend/scripts/feats/Projects.mjs').Project} */ project)
	{
		const button = document.getElementById('nav-project');

		if (button === null)
			return;

		button.replaceChildren();

		const img = document.createElement('img');
		img.classList.add('icon');
		img.setAttribute('src', project.logo ?? '/core/frontend/icons/projects.svg');
		img.setAttribute('width', '24');
		img.setAttribute('height', '24');
		button.append(img);

		const span = document.createElement('span');
		span.append(project.name);
		button.append(span);

		button.removeAttribute('hidden');
		button.setAttribute('tabindex', '2');
	}

	/** Removes the active project name from the header. */
	static #removeProjectName()
	{
		const button = document.body.querySelector('#nav-project');

		if (button === null)
			return;

		button.setAttribute('hidden', '');
		button.removeAttribute('tabindex');
		button.replaceChildren();
	}
}