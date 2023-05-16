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
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });
	}

	const select = await SQL.select('SELECT user, expiration FROM sessions WHERE token = :token LIMIT 1', { token });

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	if (select === false)
		return JSON.stringify({ success: true, valid: false });

	const user = Number(select[0]?.user);
	const expiration = new Date(`${select[0]?.expiration}Z`);

	if (new Date() > expiration)
		return JSON.stringify({ success: true, valid: false });

	return JSON.stringify({ success: true, valid: true, user, expiration });
};