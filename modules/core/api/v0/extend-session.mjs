import cryptoRandomString from 'crypto-random-string';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const token = String(data.token);

	// validate user data
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy token sesji.' });
	}

	const select = await SQL.select('SELECT user, expiration FROM sessions WHERE token = :token LIMIT 1', { token: token });

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	if (select === false)
		return JSON.stringify({ success: false, code: 400, message: 'Sesja nie odnaleziona.' });

	const user = Number(select[0]?.user);
	const expiration = new Date(`${select[0]?.expiratio}Z`);

	if (new Date() > expiration)
		return JSON.stringify({ success: false, code: 400, message: 'Sesja wygasła.' });

	const newToken = cryptoRandomString({ length: server.tokenSize, type: 'alphanumeric' });
	const newExpiration = new Date(Date.now() + 1000 * 60 * 60);

	const success = await SQL.transaction(
	[
		{
			statement: 'UPDATE sessions SET token = :token, expiration = :expiration WHERE user = :user',
			params: { user: user, token: newToken, expiration: newExpiration.toISOString().replace('T', ' ').slice(0, -5) }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target) VALUES (:module, :event, :id, :id)',
			params: { module: 'core', event: 'session_extend', id: user }
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się przedłużyć sesji.' });

	return JSON.stringify({ success: true, token: newToken, expiration: newExpiration });
};