import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';
import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';
import ClientSocket from '/core/frontend/scripts/interfaces/ClientSocket.mjs';
import Login from '/core/frontend/scripts/feats/Login.mjs';
import Projects from '/core/frontend/scripts/feats/Projects.mjs';
import Session from '/core/frontend/scripts/feats/Session.mjs';

/**
	The menu (`main > nav`) manager.

	@remarks
	The initial menu is returned to the end-user by the `Resources` class, then the menu content is updated by…

	TODO

	Related class:
	- [`/core/backend/scripts/classes/Resources.mjs`](/modules/core/backend/scripts/classes/Resources.mjs)
*/
export default class Menu
{
	/**
		Shows the menu.
		@type {HookableEvent<[]>}
	*/
	static show = new HookableEvent();

	/**
		Hides the menu.
		@type {HookableEvent<[]>}
	*/
	static hide = new HookableEvent();

	/**
		Updates the menu.
		@type {HookableEvent<[]>}
	*/
	static update = new HookableEvent();

	/** Hooks buttons that show or hide the menu. */
	static hookButtons()
	{
		document.getElementById('nav-open-menu')?.addEventListener('click', () => Menu.show.run());
		document.getElementById('nav-close-menu')?.addEventListener('click', () => Menu.hide.run());
		document.body.querySelector('menu-group[data-name="menu"] > menu-entry[data-name="hide"]')?.addEventListener('click', () => Menu.hide.run());
	}

	static
	{
		Menu.show.imp(Menu.#show);
		Menu.hide.imp(Menu.#hide);
		Menu.update.imp(Menu.#update);

		Navigation.goto.pre(Menu.#updateLoadingEntry);
		Navigation.goto.post(Menu.#updateActiveEntry);
		Navigation.goto.post(() => void (document.body.offsetWidth < 720 && Menu.hide.run()));

		Login.login.post(() => Menu.update.run());
		Login.login.post(Menu.#sessionate);
		Login.logout.post(() => Menu.update.run());
		Login.logout.post(Menu.#unsessionate);
		Login.restore.post(() => Menu.update.run());
		Login.restore.post(Menu.#sessionate);

		Menu.hookButtons();

		if (Login.logged)
			Menu.#sessionate();
		else
			Menu.#unsessionate();

		ClientSocket.receive.imp(Menu.#receiveMessage);
	}

	/** The implementation of the {@link show `show`} event. */
	static #show()
	{
		const openMenuButton = document.getElementById('nav-open-menu');
		const closeMenuButton = document.getElementById('nav-close-menu');

		if (openMenuButton instanceof HTMLElement)
		{
			openMenuButton.setAttribute('hidden', '');
			openMenuButton.removeAttribute('tabindex');
		}

		if (closeMenuButton instanceof HTMLElement)
		{
			closeMenuButton.removeAttribute('hidden');
			closeMenuButton.setAttribute('tabindex', '2');
		}

		document.body.setAttribute('data-menu-visible', '');

		for (const element of document.body.querySelectorAll('menu-entry:not(.active)'))
			element.setAttribute('tabindex', '1');
	}

	/** The implementation of the {@link hide `hide`} event. */
	static #hide()
	{
		const openMenuButton = document.getElementById('nav-open-menu');
		const closeMenuButton = document.getElementById('nav-close-menu');

		if (openMenuButton instanceof HTMLElement)
		{
			openMenuButton.removeAttribute('hidden');
			openMenuButton.setAttribute('tabindex', '2');
		}

		if (closeMenuButton instanceof HTMLElement)
		{
			closeMenuButton.setAttribute('hidden', '');
			closeMenuButton.removeAttribute('tabindex');
		}

		document.body.removeAttribute('data-menu-visible');

		for (const element of document.body.querySelectorAll('menu-entry[tabindex]'))
			element.removeAttribute('tabindex');
	}

	/** Updates the menu. */
	static async #update()
	{
		const menu = document.body.querySelector('nav');

		if (!menu)
			return;

		const path = '/core/api/v0/menu';
		const file = await fetch(path, { method: 'POST', body: JSON.stringify(
		{
			token: Session.token ?? '',
			project: Projects.id ?? 0
		})}).catch(message => void console.error(message));
		const json = await file?.json().catch(message => void console.error(message));

		if (!json?.success)
			return;

		menu.outerHTML = json.menu;
	}

	/**
		- Shows entries for logged in user.
		- Hides entries for not logged in user.
	*/
	static #sessionate()
	{
		const register = document.body.querySelector('nav [data-goto="core/register"]');
		const login = document.body.querySelector('nav [data-goto="core/login"]');
		const logout = document.body.querySelector('nav [data-goto="core/logout"]');

		if (register instanceof HTMLElement)
		{
			register.setAttribute('hidden', '');
			register.removeAttribute('tabindex');
		}

		if (login instanceof HTMLElement)
		{
			login.setAttribute('hidden', '');
			login.removeAttribute('tabindex');
		}

		if (logout instanceof HTMLElement)
		{
			logout.removeAttribute('hidden');
			logout.setAttribute('tabindex', '1');
		}
	}

	/**
		- Hides entries for logged in user.
		- Shows entries for not logged in user.
	*/
	static #unsessionate()
	{
		const register = document.body.querySelector('nav [data-goto="core/register"]');
		const login = document.body.querySelector('nav [data-goto="core/login"]');
		const logout = document.body.querySelector('nav [data-goto="core/logout"]');

		if (register instanceof HTMLElement)
		{
			register.removeAttribute('hidden');
			register.setAttribute('tabindex', '1');
		}

		if (login instanceof HTMLElement)
		{
			login.removeAttribute('hidden');
			login.setAttribute('tabindex', '1');
		}

		if (logout instanceof HTMLElement)
		{
			logout.setAttribute('hidden', '');
			logout.removeAttribute('tabindex');
		}
	}

	/** Updates the loading entry indicator. */
	static #updateLoadingEntry(/** @type {import('/core/frontend/scripts/interfaces/Navigation.mjs').Page} */ page)
	{
		for (const loadingIndicator of document.querySelectorAll('menu-entry > div[data-loading]'))
			loadingIndicator.remove();

		for (const element of document.querySelectorAll(`menu-entry[data-goto="${page.path.replace(/\?.*$/u, '')}"]`))
		{
			const div = document.createElement('div');
			div.style.width = '100%';
			div.style.alignItems = 'flex-end';
			div.setAttribute('data-loading', '');

			const span = document.createElement('div');
			span.classList.add('loading');

			div.append(span);
			element.append(div);
		}
	}

	/** Updates the active entry indicator. */
	static #updateActiveEntry(/** @type {import('/core/frontend/scripts/interfaces/Navigation.mjs').Page} */ page)
	{
		for (const loadingIndicator of document.querySelectorAll('menu-entry > div[data-loading]'))
			loadingIndicator.remove();

		for (const activeMenuEntry of document.querySelectorAll('menu-entry.active'))
		{
			activeMenuEntry.classList.remove('active');
			activeMenuEntry.setAttribute('tabindex', '1');
		}

		for (const element of document.querySelectorAll(`menu-entry[data-goto="${page.path.replace(/\?.*$/u, '')}"]`))
		{
			element.classList.add('active');
			element.removeAttribute('tabindex');
		}
	}

	static #receiveMessage(/** @type {import('/core/frontend/scripts/interfaces/ClientSocket.mjs').ClientSocketMessage} */ message)
	{
		const menu = document.body.querySelector('nav');

		if
		(
				message.id != 'update menu'
			||	typeof message.data != 'string'
			||	menu === null
		)
			return;

		menu.outerHTML = message.data;
	}
}