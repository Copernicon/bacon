import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
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

	const user = await Permissions.getUserByToken(token);

	if (user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	const select = await SQL.select('SELECT id, first_name, nick_name, last_name, logo FROM users WHERE searchable = 1 AND active = 1 AND banned = 0');

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	if (select === false)
		return JSON.stringify({ success: true, users: [] });

	const users = [];

	for (const entry of Object.values(select))
		users.push({ id: entry.id, first_name: entry.first_name, nick_name: entry.nick_name, last_name: entry.last_name, logo: entry.logo });

	return JSON.stringify({ success: true, users });
};