import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import Cookies from '/core/frontend/scripts/interfaces/Cookies.mjs';
import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';
import Login from '/core/frontend/scripts/feats/Login.mjs';
import Session from '/core/frontend/scripts/feats/Session.mjs';

/**

	@typedef {{
		id: number,
		name: string,
		logo: string?
	}} Project
	A project.

	Properties:
	- `id` — The project id.
	- `name` — The project name.
	- `logo` — The project logo.

*/
export {};

/**
	Makes elements with the `data-set-project` attribute to set user active project on click.
	- Sets the `data-set-project-hooked` attribute to affected elements.
*/
export default class Projects
{
	/**
		The current project id.

		@type {number?}
	*/
	static #id = null;

	/**
		The current project name.

		@type {string?}
	*/
	static #name = null;

	/**
		The current project logo.

		@type {string?}
	*/
	static #logo = null;

	/** Gets the current project id. */
	static get id() { return Projects.#id; }

	/** Gets the current project name. */
	static get projectName() { return Projects.#name; }

	/** Gets the current project logo. */
	static get logo() { return Projects.#logo; }

	/**
		Validates the user project.

		@type {HookableEvent<[]>}
	*/
	static validate = new HookableEvent();

	/**
		Sets the current project.

		@type {HookableEvent<[Project]>}
	*/
	static set = new HookableEvent();

	/**
		Unsets a current project.

		@type {HookableEvent<[]>}
	*/
	static unset = new HookableEvent();

	static
	{
		Projects.#load();

		Projects.validate.imp(Projects.#validate);
		Projects.set.imp(Projects.#store);
		Projects.set.post(() => void Navigation.goto.run({ path: 'core/main' }));
		Projects.unset.imp(Projects.#remove);

		Login.login.post(() => void Projects.validate.run());
		Login.logout.post(() => void Projects.unset.run());
		Login.restore.post(() => void Projects.validate.run());

		Projects.#hookRecursively(document.body);

		new MutationObserver(mutations =>
		{
			for (const mutation of mutations)
				for (const node of mutation.addedNodes)
					if (node instanceof HTMLElement)
						Projects.#hookRecursively(node);
		}).observe(document.body, { childList: true, subtree: true });
	}

	/** The implementation of the {@link validate `validate`} event. */
	static async #validate()
	{
		if (Projects.#id === null)
			return;

		const path = '/core/api/v0/validate-project';
		const file = await fetch(path, { method: 'POST', body: JSON.stringify(
		{
			token: Session.token,
			project: Projects.#id
		})}).catch(message => void console.error(message));
		const json = await file?.json().catch(message => void console.error(message));

		if (!json?.valid)
			return;

		Projects.#name = json.name;
		Projects.#logo = json.logo;
	}

	/** Hooks all elements with the `data-set-project` attribute not outside {@link element `element`}. */
	static #hookRecursively(/** @type {HTMLElement} */ element)
	{
		const selector = '[data-set-project]:not([data-set-project-hooked])';

		if (element.matches(selector))
			Projects.#hook(element);

		const elements = element.querySelectorAll(selector);

		for (const element of elements)
			if (element instanceof HTMLElement)
				Projects.#hook(element);
	}

	/** Hooks the {@link element `element`}. */
	static #hook(/** @type {HTMLElement} */ element)
	{
		if (element.getAttribute('data-set-project-hooked'))
			return;

		const id = element.getAttribute('data-set-project');
		const name = element.querySelector('app-card-title')?.innerHTML;
		const logo = element.querySelector(':is(img[src])')?.getAttribute('src') ?? element.querySelector(':is(svg[data-src])')?.getAttribute('data-src');

		if
		(
				id === null
			||	name === undefined
			||	!logo
		)
			return;

		element.addEventListener('click', () => void Projects.set.run({ id: Number(id), name, logo }));
		element.setAttribute('data-set-project-hooked', '');
	}

	/** Loads the current project id from the {@link Cookies `Cookies`}. */
	static #load()
	{
		const id = Cookies.get('core/project/id');
		Projects.#id = typeof id == 'string' ? Number(id) : null;
	}

	/** Stores the current project id in both {@link Projects `Project`} members and the {@link Cookies `Cookies`}. */
	static #store(/** @type {Project} */ data)
	{
		Projects.#id = data.id;
		Projects.#name = data.name;

		Cookies.set('core/project/id', String(data.id), true);
	}

	/** Removes the current project id from both {@link Projects `Project`} members and the {@link Cookies `Cookies`}. */
	static #remove()
	{
		Projects.#id = null;
		Projects.#name = null;

		Cookies.remove('core/project/id');
	}
}