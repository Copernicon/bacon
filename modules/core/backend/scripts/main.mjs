import fs from 'node:fs';
import Module from '/core/backend/scripts/bases/Module.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import Resources from '/core/backend/scripts/classes/Resources.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import app from '/core/shared/data/app.json' assert { type: 'json' };

export default class Core extends Module
{
	constructor()
	{
		super();

		this.load.imp(Core.#load);
		this.start.imp(Core.#start);
		this.stop.pro(() => true);
	}

	static async #load()
	{
		await Core.#importSQL();
		await Core.#loadBackendFeats();
	}

	static async #loadBackendFeats()
	{
		await import('/core/backend/scripts/feats/Pong.mjs');
	}

	static #start()
	{
		Core.#addHeadHTML();
		Core.#addStyles();
		Core.#addScripts();
		Core.#addBodyHTML();
		Core.#addHeaderButtons();
		Core.#addMenu();
	}

	static #addHeadHTML()
	{
		Resources.addHeadHTML('<meta charset="utf-8">');
		Resources.addHeadHTML('<meta name="color-scheme" content="dark">');
		Resources.addHeadHTML(`<title>${app.name}</title>`);
	}

	static #addStyles()
	{
		Resources.addStyle('/core/frontend/styles/app/cards.css');
		Resources.addStyle('/core/frontend/styles/app/person.css');
		Resources.addStyle('/core/frontend/styles/app/variables.css');
		Resources.addStyle('/core/frontend/styles/ext/github-dark.css');
		Resources.addStyle('/core/frontend/styles/std/aside.css');
		Resources.addStyle('/core/frontend/styles/std/buttons.css');
		Resources.addStyle('/core/frontend/styles/std/code.css');
		Resources.addStyle('/core/frontend/styles/std/elements.css');
		Resources.addStyle('/core/frontend/styles/std/fonts.css');
		Resources.addStyle('/core/frontend/styles/std/form.css');
		Resources.addStyle('/core/frontend/styles/std/header.css');
		Resources.addStyle('/core/frontend/styles/std/headings.css');
		Resources.addStyle('/core/frontend/styles/std/main.css');
		Resources.addStyle('/core/frontend/styles/std/nav.css');
		Resources.addStyle('/core/frontend/styles/std/root.css');
		Resources.addStyle('/core/frontend/styles/std/utils.css');
	}

	static #addScripts()
	{
		Resources.addScript('/core/frontend/scripts/main.mjs');
		Resources.addScript('/core/frontend/scripts/feats/CheckBox.mjs');
		Resources.addScript('/core/frontend/scripts/feats/ClickOnEnter.mjs');
		Resources.addScript('/core/frontend/scripts/feats/ClientSocketManager.mjs');
		Resources.addScript('/core/frontend/scripts/feats/EllipsisTitle.mjs');
		Resources.addScript('/core/frontend/scripts/feats/Forms.mjs');
		Resources.addScript('/core/frontend/scripts/feats/GotoLinks.mjs');
		Resources.addScript('/core/frontend/scripts/feats/Header.mjs');
		Resources.addScript('/core/frontend/scripts/feats/HighlightCode.mjs');
		Resources.addScript('/core/frontend/scripts/feats/HookAutofill.mjs');
		Resources.addScript('/core/frontend/scripts/feats/ImageInput.mjs');
		Resources.addScript('/core/frontend/scripts/feats/InlineSVG.mjs');
		Resources.addScript('/core/frontend/scripts/feats/LinkBodyScripts.mjs');
		Resources.addScript('/core/frontend/scripts/feats/LoadPageOnURLChange.mjs');
		Resources.addScript('/core/frontend/scripts/feats/Login.mjs');
		Resources.addScript('/core/frontend/scripts/feats/Menu.mjs');
		Resources.addScript('/core/frontend/scripts/feats/Projects.mjs');
		Resources.addScript('/core/frontend/scripts/feats/ShowAndHide.mjs');
		Resources.addScript('/core/frontend/scripts/feats/User.mjs');
	}

	static #addBodyHTML() {}
	static #addHeaderButtons()
	{
		Resources.addHeaderButton({ id: 'nav-open-menu', icon: '/core/frontend/icons/menu.svg', hidden: false, title: 'Pokaż Menu' });
		Resources.addHeaderButton({ id: 'nav-close-menu', icon: '/core/frontend/icons/menu-open.svg', hidden: true, title: 'Zamknij Menu' });
		Resources.addHeaderButton({ id: 'nav-login', icon: '/core/frontend/icons/login.svg', hidden: false, title: 'Zaloguj się', goto: 'core/login' });
		Resources.addHeaderButton({ id: 'nav-logout', icon: '/core/frontend/icons/logout.svg', hidden: true, title: 'Wyloguj się', goto: 'core/logout' });
		Resources.addHeaderButton({ id: 'nav-user', icon: '/core/frontend/icons/user.svg', hidden: true, title: 'Profil użytkownika' });
		Resources.addHeaderButton({ id: 'nav-project', icon: '/core/frontend/icons/projects.svg', hidden: true, title: 'Profil projektu' });
	}

	static #addMenu()
	{
		Resources.addMenuGroup({ name: 'menu' });
		Resources.addMenuEntry({ group: 'menu', name: 'hide', text: 'Ukryj menu', icon: '/core/frontend/icons/menu-open.svg' });

		Resources.addMenuGroup({ name: 'users', text: 'Konto użytkownika' });
		Resources.addMenuEntry(
		{
			group: 'users',
			name: 'register',
			text: 'Rejestracja',
			target: 'core/register',
			icon: '/core/frontend/icons/register.svg'
		});

		Resources.addMenuEntry(
		{
			group: 'users',
			name: 'login',
			text: 'Logowanie',
			target: 'core/login',
			icon: '/core/frontend/icons/login.svg'
		});

		Resources.addMenuEntry(
		{
			group: 'users',
			name: 'logout',
			text: 'Wyloguj',
			target: 'core/logout',
			icon: '/core/frontend/icons/logout.svg',
			permissions: {module: 'core', name: 'session'}
		});

		Resources.addMenuGroup({ name: 'info', text: 'Informacje' });
		Resources.addMenuEntry(
		{
			group: 'info',
			name: 'main',
			text: 'Panel główny',
			target: 'core/main',
			icon: '/core/frontend/icons/dashboard.svg'
		});

		Resources.addMenuEntry(
		{
			group: 'info',
			name: 'credits',
			text: 'Wyrazy uznania',
			target: 'core/credits',
			icon: '/core/frontend/icons/attribution.svg'
		});

		Resources.addMenuGroup({ name: 'forms', text: 'Formularze' });
		Resources.addMenuEntry(
		{
			group: 'forms',
			name: 'form',
			text: 'Formularz',
			target: 'core/form',
			icon: '/core/frontend/icons/post-add.svg',
			permissions: {module: 'core', name: 'session'}
		});
	}

	// @ts-ignore
	// eslint-disable-next-line no-unused-private-class-members
	static async #reset()
	{
		await Core.#dropData();
		await Core.#importSQL();
	}

	static async #importSQL()
	{
		const modulesPath = fs.realpathSync('./modules');

		for (const path of
		[
			'/core/backend/data/sql/create tables.sql',
			'/core/backend/data/sql/create events.sql',
			'/core/backend/data/sql/insert data.sql',
		])
		{
			const file = noexcept(fs.readFileSync)(modulesPath + path)?.toString();

			if (!file)
			{
				console.error(`Reading '${path}' failed.`);
				return;
			}

			const queries = file.split(';\n');

			for (const query of queries)
				await SQL.query(query);
		}
	}

	static async #dropData()
	{
		const modulesPath = fs.realpathSync('./modules');

		for (const path of
		[
			'/core/backend/data/sql/drop events.sql',
			'/core/backend/data/sql/drop tables.sql',
		])
		{
			const file = noexcept(fs.readFileSync)(modulesPath + path)?.toString();

			if (!file)
			{
				console.error(`Reading '${path}' failed.`);
				return;
			}

			const queries = file.split(';\n');

			for (const query of queries)
				await SQL.query(query);
		}
	}
}