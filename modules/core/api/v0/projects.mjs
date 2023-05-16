import fs from 'node:fs';
import cryptoRandomString from 'crypto-random-string';
import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import Projects from '/core/backend/scripts/interfaces/Projects.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const token = String(data.token);

	// validate user token
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });
	}

	data.user = await Permissions.getUserByToken(token);

	if (data.user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	const action = String(data.action);

	switch (action)
	{
		case 'list all':

			return await listAll(data);

		case 'list mine':

			return await listMine(data);

		case 'list available':

			return await listAvailable(data);

		case 'add':

			return await add(data);

		case 'remove':

			return await remove(data);
	}

	return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe zapytanie.' });
};

async function listAll(/** @type {Object.<string, *>} */ data)
{
	{
		const validation = await Permissions.hasGlobalPermission(data.user, 'core', 'projects/list');

		if (validation === null)
			return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd weryfikacji uprawnień.' });

		if (validation === false)
			return JSON.stringify({ success: false, code: 403, message: 'Brak uprawnienia \'projects/list\' w module \'core\'.' });
	}

	const projects = await Projects.getAllProjects();

	if (projects === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	return JSON.stringify({ success: true, projects });
}

async function listMine(/** @type {Object.<string, *>} */ data)
{
	const projects = await Projects.getUserProjects(data.user);

	if (projects === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	return JSON.stringify({ success: true, projects });
}

async function listAvailable(/** @type {Object.<string, *>} */ data)
{
	const projects = await Projects.getAvailableProjects(data.user);

	if (projects === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	return JSON.stringify({ success: true, projects });
}

async function add(/** @type {Object.<string, *>} */ data)
{
	{
		const validation = await Permissions.hasGlobalPermission(data.user, 'core', 'projects/add');

		if (validation === null)
			return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd weryfikacji uprawnień.' });

		if (validation === false)
			return JSON.stringify({ success: false, code: 403, message: 'Brak uprawnienia \'projects/add\' w module \'core\'.' });
	}

	const name = String(data.name);
	const logo = String(data.logo).length == 0 ? null : String(data.logo);
	const extension = String(data.logo_extension).length == 0 ? null : String(data.logo_extension);

	/** @type {string?} */
	let logoPath = null;

	{
		if (name.length < 3 || name.length > 128)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowa nazwa.' });

		if ((logo === null) !== (extension === null))
			return JSON.stringify({ success: false, code: 400, message: 'Brak logo albo rozszerzenia.' });

		if (logo !== null)
		{
			if (extension === null)
				return JSON.stringify({ success: false, code: 400, message: 'Brak rozszerzenia.' });

			if (!Object.keys(server.uploadImgExtensions).includes(extension))
				return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe rozszerzenie.' });

			const maxSize = server.maxUploadSize * 1024 ** 2;

			if (logo.length > maxSize)
				return JSON.stringify({ success: false, code: 400, message: `Plik z logo za duży. Maksymalny rozmiar: ${maxSize} MiB).` });

			const date = new Date();
			const year = String(date.getFullYear()).padStart(4, '0');
			const month = String(date.getMonth()).padStart(2, '0');
			const relativePath = `/${year}/${month}`;
			const absolutePath = `${fs.realpathSync('./uploads')}${relativePath}`;

			if (!fs.existsSync(absolutePath))
			{
				const success = noexcept(fs.mkdirSync)(absolutePath, { recursive: true });

				if (success === null)
					return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/Filesystem</mark> Nie udało się utworzyć katalogu na logo.' });
			}

			const stem = cryptoRandomString({ length: server.tokenSize, type: 'alphanumeric' });
			const fileName = `${stem}.${extension}`;
			const filePath = `${absolutePath}/${fileName}`;

			const success = noexcept(fs.writeFileSync)(filePath, logo.replace(/^.*?,/u, ''), 'base64');

			if (success === null)
				return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/Filesystem</mark> Nie udało się zapisać pliku z logo.' });

			logoPath = `/uploads${relativePath}/${fileName}`;
		}
	}

	const success = await SQL.transaction(
	[
		{
			statement: 'INSERT INTO projects (name, logo) VALUES (:name, :logo)',
			params: { name, logo: logoPath }
		},
		{
			statement: 'INSERT INTO logs (module, event, user) VALUES (:module, :event, :user)',
			params: { module: 'core', event: 'projects/add', user: data.user }
		}
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się dodać projektu.' });

	return JSON.stringify({ success: true });
}

async function remove(/** @type {Object.<string, *>} */ data)
{
	{
		const validation = await Permissions.hasGlobalPermission(data.user, 'core', 'projects/remove');

		if (validation === null)
			return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd weryfikacji uprawnień.' });

		if (validation === false)
			return JSON.stringify({ success: false, code: 403, message: 'Brak uprawnienia \'projects/remove\' w module \'core\'.' });
	}

	const id = Number(data.id);

	{
		if (!Number.isInteger(id) || id < 0)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy identyfikator.' });
	}

	const success = await SQL.transaction(
	[
		{
			statement: 'DELETE FROM projects WHERE id = :id',
			params: { id }
		},
		{
			statement: 'INSERT INTO logs (module, event, user) VALUES (:module, :event, :user, :data)',
			params: { module: 'core', event: 'projects/remove', user: data.user, data: JSON.stringify({ id })}
		}
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się usunąć projektu.' });

	return JSON.stringify({ success: true });
}