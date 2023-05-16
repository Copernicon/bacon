import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const user = Number(data.user);
	const code = String(data.code);

	// validate user data
	{
		if (!Number.isInteger(user) || user < 0)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy identyfikator użytkownika.' });

		if (code.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy kod aktywacyjny.' });
	}

	const select = await SQL.select('SELECT code, expiration FROM activations WHERE user = :id LIMIT 1', { id: user });

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	if (select === false)
		return JSON.stringify(
		{
			success: false,
			code: 400,
			message:
					`Brak użytkownika o id <mark>${user}</mark> oczekującego aktywacji.`
				+	' Możliwe, że kod aktywacyjny wygasł lub podano nieprawidłowy numer użytkownika.'
		});

	if (select[0]?.code != code)
		return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy kod aktywacyjny.' });

	const expiration = new Date(`${select[0]?.expiration}Z`);

	if (new Date() > expiration)
		return JSON.stringify({ success: false, code: 410, message: `Kod aktywacyjny wygasł <code>${select[0]?.expiration}</code>.` });

	const success = await SQL.transaction(
	[
		{
			statement: 'UPDATE users SET active = 1 WHERE id = :id',
			params: { id: user }
		},
		{
			statement: 'DELETE FROM activations WHERE user = :id',
			params: { id: user }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target) VALUES (:module, :event, :id, :id)',
			params: { module: 'core', event: 'user_activate', id: user }
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się aktywować konta.' });

	return JSON.stringify({ success: true, message: 'Konto zostało aktywowane pomyślnie.' });
};