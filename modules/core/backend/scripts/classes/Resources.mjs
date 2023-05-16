import { JSDOM } from 'jsdom';
import app from '/core/shared/data/app.json' assert { type: 'json' };

/**

	@typedef {Map.<string, {
		text: string?,
		entries: MenuEntry[],
		permissions: import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[],
	}>} MenuGroups

	`menu-group` inside `body > nav`.

	Key:
	- Menu group name used for reference, *eg* `main`.

	Values:
	- `text` — Text to display for this menu group, *eg* `Main`.
	- `entries` — List of menu entries inside this menu group.
	- `permissions` - List of permissions that end-user must have all to get this resource.

*//**

	@typedef {{
		name: string,
		text: string,
		target: string?,
		icon: string?,
		permissions: import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[],
	}} MenuEntry

	`menu-entry` inside `body > nav > menu-group`.

	Properties:
	- `id` — Button id, *eg* `main`.
	- `icon` — Path to icon, *eg* `icons/main.svg`.
	- `hidden` — If button should be initially `[hidden]`.
	- `title` — Button title, *eg* `Main` xor `null` for no title.
	- `goto` — Short path of page to goto on click, *eg* `core/main`.

*/
export {};

const document = new JSDOM().window.document;

/** Resources for end-users. */
export default class Resources
{
	/**
		@type {{
			url: string,
			permissions: import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[],
		}[]}
	*/
	static #styles = [];

	/**
		@type {{
			url: string,
			permissions: import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[],
		}[]}
	*/
	static #scripts = [];

	/**
		@type {{
			html: string,
			permissions: import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[],
		}[]}
	*/
	static #headHTML = [];

	/**
		@type {{
			html: string,
			permissions: import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[],
		}[]}
	*/
	static #bodyHTML = [];

	/** @type {MenuGroups} */
	static #menuGroups = new Map();

	/** @type {HTMLButtonElement[]} */
	static #headerButtons = [];

	/**
		Add a cascading stylesheet for end-users.

		@param {string} url CSS URL, *eg* `/core/frontend/styles/main.css`.
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static addStyle(url, permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		Resources.#styles.push({ url, permissions: $permissions });
	}

	/**
		Add a javascript module for end-users.

		@param {string} url Javascript URL, *eg* `/core/frontend/scripts/main.mjs`.
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static addScript(url, permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		Resources.#scripts.push({ url, permissions: $permissions });
	}

	/**
		Add `head` {@link html `html`} for end-users.

		@param {string} html Plain HTML, *eg* `<meta charset="utf-8">`.
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static addHeadHTML(html, permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		Resources.#headHTML.push({ html, permissions: $permissions });
	}

	/**
		Add `body` {@link html `html`} for end-users.

		@param {string} html Plain HTML.
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static addBodyHTML(html, permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		Resources.#bodyHTML.push({ html, permissions: $permissions });
	}

	/**
		Add a header button for end-users.

		@param {{
			id: string,
			icon: string,
			hidden: boolean,
			title?: string,
			goto?: string,
		}} data

		Properties:
		- `id` — Button id, *eg* `main`.
		- `icon` — Path to icon, *eg* `icons/main.svg`.
		- `hidden` — If button should be initially `[hidden]`.
		- `title` — Button title, *eg* `Main` xor `null` for no title.
		- `goto` — Short path of page to goto on click, *eg* `core/main`.
	*/
	static addHeaderButton(data)
	{
		const button = document.createElement('button');

		button.setAttribute('id', data.id);

		const img = document.createElement('img');
		img.classList.add('icon');
		img.setAttribute('src', data.icon);
		img.setAttribute('width', '24');
		img.setAttribute('height', '24');
		button.append(img);

		if (data.hidden)
			button.setAttribute('hidden', '');
		else
			button.setAttribute('tabindex', '2');

		if (data.title !== undefined)
			button.setAttribute('title', data.title);

		if (data.goto !== undefined)
			button.setAttribute('data-goto', data.goto);

		Resources.#headerButtons.push(button);
	}

	/**
		Add a menu group for end-users.

		@param {{
			name: string,
			text?: string,
			permissions?: (
					import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
				|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			),
		}} data

		Properties:
		- `name` — Menu group name used for reference, *eg* `main`.
		- `text` — Text to display for this menu group, *eg* `Main`.
		- `permissions` — List of permissions that end-user must have all to get this resource.
	*/
	static addMenuGroup(data)
	{
		const permissions = (() =>
		{
			if (data.permissions === undefined)
				data.permissions = [];

			if (Array.isArray(data.permissions))
				return data.permissions;

			return [data.permissions];
		})();

		Resources.#menuGroups.set(data.name,
		{
			text: data.text ?? null,
			entries: [],
			permissions: permissions,
		});
	}

	/**
		Add a menu entry for end-users.

		@param {{
			group: string,
			name: string,
			text: string,
			target?: string,
			icon?: string,
			permissions?: (
					import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
				|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			),
		}} data

		Properties:
		- `group` — Name of the menu group to add the entry to, *eg* `main`.
		- `name` — Menu entry name used for reference, *eg* `dashboard`.
		- `text` — Text to display for this menu entry, *eg* `Dashboard`.
		- `target` — Page to load on entry click (*eg* `main`) xor `null` for no target.
		- `icon` — Path to icon (*eg* `icons/main.svg`) xor `null` for no icon.
		- `permissions` — List of permissions that end-user must have all to get this resource.
	*/
	static addMenuEntry(data)
	{
		const permissions = (() =>
		{
			if (data.permissions === undefined)
				data.permissions = [];

			if (Array.isArray(data.permissions))
				return data.permissions;

			return [data.permissions];
		})();

		const menuGroup = Resources.#menuGroups.get(data.group);

		if (menuGroup === undefined)
			return;

		menuGroup.entries.push(
		{
			name: data.name,
			text: data.text,
			target: data.target ?? null,
			icon: data.icon ?? null,
			permissions: permissions,
		});
	}

	/**
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static getStyles(permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		let html = '';

		for (const entry of Resources.#styles)
		{
			if (!entry.permissions.every(entry =>
				$permissions.some(permission =>
						permission.module == entry.module
					&&	permission.name == entry.name
				)
			))
				continue;

			html += `<link rel="preload" href="${entry.url}" as="style" onload="this.rel='stylesheet'">`;
		}

		return html;
	}

	/**
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static getScripts(permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		let html = '';

		for (const entry of Resources.#scripts)
		{
			if (!entry.permissions.every(entry =>
				$permissions.some(permission =>
						permission.module == entry.module
					&&	permission.name == entry.name
				)
			))
				continue;

			html += `<script type="module" src="${entry.url}" async></script>`;
		}

		return html;
	}

	/**
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static getHeadHTML(permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		let html = '';

		for (const entry of Resources.#headHTML)
		{
			if (!entry.permissions.every(entry =>
				$permissions.some(permission =>
						permission.module == entry.module
					&&	permission.name == entry.name
				)
			))
				continue;

			html += entry.html;
		}

		return html;
	}

	/**
		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static getBodyHTML(permissions = null)
	{
		const $permissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		let html = '';

		for (const entry of Resources.#bodyHTML)
		{
			if (!entry.permissions.every(entry =>
				$permissions.some(permission =>
						permission.module == entry.module
					&&	permission.name == entry.name
				)
			))
				continue;

			html += entry.html;
		}

		return html;
	}

	static getAside()
	{
		const aside = document.createElement('aside');
		const icon = document.createElement('app-icon');
		const img = document.createElement('img');

		switch (app.type)
		{
			case 'dev':

				img.setAttribute('src', '/core/frontend/icons/dev.svg');
				img.setAttribute('title', 'Wersja developerska');
				break;

			case 'test':

				img.setAttribute('src', '/core/frontend/icons/preview.svg');
				img.setAttribute('title', 'Wersja testowa');
				break;

			case 'pro':
			default:

				img.setAttribute('src', '/core/frontend/icons/bacon.png');
				img.setAttribute('width', '24');
				img.setAttribute('height', '24');
				img.setAttribute('title', 'Wersja publiczna');
		}

		const name = document.createElement('app-name');
		name.append(app.name);

		icon.append(img);
		aside.append(icon);
		aside.append(name);

		return aside.outerHTML;
	}

	static getHeader()
	{
		const header = document.createElement('header');

		for (const button of Resources.#headerButtons)
			header.append(button);

		return header.outerHTML;
	}

	/**
		Get menu entries for a user with given {@link permissions `permissions`}.

		@param {
				import('/core/backend/scripts/interfaces/Permissions.mjs').Permission
			|	import('/core/backend/scripts/interfaces/Permissions.mjs').Permission[]
			|	null
		} permissions
	*/
	static getMenu(permissions = null)
	{
		const userPermissions = (() =>
		{
			if (permissions === null)
				permissions = [];

			if (Array.isArray(permissions))
				return permissions;

			return [permissions];
		})();

		const menu = document.createElement('nav');

		for (const [menuGroupName, menuGroup] of Resources.#menuGroups)
		{
			if (!menuGroup.permissions.every(entry =>
				userPermissions.some(permission =>
						permission.module == entry.module
					&&	permission.name == entry.name
				)
			))
				continue;

			const menuGroupElement = document.createElement('menu-group');
			menuGroupElement.setAttribute('data-name', menuGroupName);

			if (menuGroup.text !== null)
			{
				const menuHeaderElement = document.createElement('menu-header');
				menuHeaderElement.append(menuGroup.text);
				menuGroupElement.append(menuHeaderElement);
			}

			for (const menuEntry of menuGroup.entries)
			{
				if (!menuEntry.permissions.every(entry =>
					userPermissions.some(permission =>
							permission.module == entry.module
						&&	permission.name == entry.name
					)
				))
					continue;

				const menuEntryElement = document.createElement('menu-entry');
				menuEntryElement.setAttribute('data-name', menuEntry.name);

				if (menuEntry.target !== null)
					menuEntryElement.setAttribute('data-goto', menuEntry.target);

				menuEntryElement.setAttribute('tabindex', '1');

				if (menuEntry.icon !== null)
				{
					const img = document.createElement('img');
					img.setAttribute('class', 'icon');
					img.setAttribute('width', '24px');
					img.setAttribute('height', '24px');
					img.setAttribute('src', menuEntry.icon);
					menuEntryElement.append(img);
				}

				const span = document.createElement('span');
				span.append(menuEntry.text);
				menuEntryElement.append(span);

				menuGroupElement.append(menuEntryElement);
			}

			if (menuGroupElement.childNodes.length == Number(menuGroup.text !== null))
				continue;

			menu.append(menuGroupElement);
		}

		return menu.outerHTML;
	}

	/** Gets the `main` element to be placed in the end-user `body`. */
	static getMain()
	{
		return document.createElement('main').outerHTML;
	}
}