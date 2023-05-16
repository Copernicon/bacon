import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import Resources from '/core/backend/scripts/classes/Resources.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const token = String(data.token).length == 0 ? null : String(data.token);
	const project = String(data.token).length == 0 ? null : Number(data.project);

	if (token === null)
	{
		const menu = Resources.getMenu();
		return JSON.stringify({ success: true, menu });
	}

	// validate user token
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });

		if (project !== null && (!Number.isInteger(project) || project < 0))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy identyfikator projektu.' });
	}

	const user = await Permissions.getUserByToken(token);

	if (user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	const permissions = await Permissions.getPermissions(user, project);

	if (permissions === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	const menu = Resources.getMenu([...permissions, { module: 'core', name: 'session' }]);

	return JSON.stringify({ success: true, menu });
};