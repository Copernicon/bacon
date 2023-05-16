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

	const success = await SQL.transaction(
	[
		{
			statement: 'DELETE FROM sessions WHERE user = :user',
			params: { user: user }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target) VALUES (:module, :event, :user, :user)',
			params: { module: 'core', event: 'user_logout', user: user }
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się usunąć żetonu uwierzytelniającego.' });

	return JSON.stringify({ success: true });
};