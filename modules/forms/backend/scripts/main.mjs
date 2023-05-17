import fs from 'node:fs';
import Module from '/core/backend/scripts/bases/Module.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import Resources from '/core/backend/scripts/classes/Resources.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';

export default class Forms extends Module
{
	constructor()
	{
		super();

		this.load.imp(Forms.#load);
		this.start.imp(Forms.#start);
		this.stop.pro(() => true);
	}

	static async #load()
	{
		await Forms.#importSQL();
	}

	static #start()
	{
		Forms.#addMenu();
	}

	static #addMenu()
	{
		Resources.addMenuGroup({ name: 'forms', text: 'Formularze' });
		Resources.addMenuEntry(
		{
			group: 'forms',
			name: 'form',
			text: 'Formularz',
			target: 'forms/form',
			icon: '/core/frontend/icons/post-add.svg',
			permissions: {module: 'core', name: 'session'}
		});
	}

	// @ts-ignore
	// eslint-disable-next-line no-unused-private-class-members
	static async #reset()
	{
		await Forms.#dropData();
		await Forms.#importSQL();
	}

	static async #importSQL()
	{
		const modulesPath = fs.realpathSync('./modules');

		for (const path of
		[
			'/forms/backend/data/sql/create tables.sql',
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
			'/forms/backend/data/sql/drop tables.sql',
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