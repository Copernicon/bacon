import cryptoRandomString from 'crypto-random-string';
import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import Google from '/sign-with-google/backend/scripts/interfaces/Google.mjs';
import auth from '/sign-with-google/backend/data/auth.json' assert { type: 'json' };
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const action = String(data.action);

	switch (action)
	{
		case 'login':

			return login(data);

		case 'check availability':

			return checkAvailability(data);

		case 'add login method':

			return addLoginMethod(data);

		case 'remove login method':

			return removeLoginMethod(data);
	}

	return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe zapytanie.' });
};

async function login(/** @type {Object.<string, *>} */ data)
{
	if (!auth.methods.google.login)
		return JSON.stringify({ success: false, code: 503, message: 'Logowanie za pomocą Google jest obecnie wyłączone.' });

	const code = String(data.code);
	const googleUser = await Google.validateCode(code, 'login');

	if (!googleUser)
		return JSON.stringify({ success: false, code: 400, message: 'Walidacja kodu uwierzytelniającego nieudana.' });

	const googleUserID = String(googleUser.id).substring(0, 128);
	const select = await SQL.select
	(
		`
			WITH $users ($user) AS (SELECT user FROM auth_google WHERE id = :google_user_id)
			SELECT active, banned, id, login, first_name, nick_name, last_name, logo FROM users, $users WHERE id = $user LIMIT 1
		`,
		{ google_user_id: googleUserID }
	);

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	if (select === false)
		return JSON.stringify({ success: false, code: 403, message: 'Nieprawidłowy kod uwierzytelniający.' });

	if (select[0]?.banned == 1)
		return JSON.stringify({ success: false, code: 403, message: 'Konto zbanowane.' });

	if (select[0]?.active != 1)
		return JSON.stringify({ success: false, code: 403, message: 'Konto nieaktywne.' });

	const user = Number(select[0]?.id);
	const token = cryptoRandomString({ length: server.tokenSize, type: 'alphanumeric' });
	const expiration = new Date(Date.now() + 1000 * 60 ** 2);

	const success = await SQL.transaction(
	[
		{
			statement:
			(
					'INSERT INTO sessions (user, token, expiration) VALUES (:user, :token, :expiration)'
				+	' ON DUPLICATE KEY UPDATE token = :token, expiration = :expiration'
			),
			params: { user: user, token: token, expiration: expiration.toISOString().replace('T', ' ').slice(0, -5) }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
			params: { module: 'core', event: 'user_login', user, data: JSON.stringify({ type: 'google' })}
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się zalogować.' });

	const login = select[0]?.login;
	const firstName = select[0]?.first_name;
	const nickName = select[0]?.nick_name;
	const lastName = select[0]?.last_name;
	const logo = select[0]?.logo;

	return JSON.stringify(
	{
		success: true,
		token: token,
		expiration: expiration,
		user: user,
		login: login,
		first_name: firstName,
		nick_name: nickName,
		last_name: lastName,
		logo: logo,
		message: 'Zalogowano pomyślnie.'
	});
}

async function checkAvailability(/** @type {Object.<string, *>} */ data)
{
	const token = String(data.token);

	// validate user token
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });
	}

	const user = await Permissions.getUserByToken(token);

	if (user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	const select = await SQL.select('SELECT NULL FROM auth_google WHERE user = :user LIMIT 1', { user: user });

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	return JSON.stringify({ success: true, status: select !== false });
}

async function addLoginMethod(/** @type {Object.<string, *>} */ data)
{
	if (!auth.methods.google.register)
		return JSON.stringify({ success: false, code: 503, message: 'Dodawanie metody logowania za pomocą Google jest obecnie wyłączone.' });

	const token = String(data.token);

	// validate user token
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });
	}

	const user = await Permissions.getUserByToken(token);

	if (user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	if (await SQL.select('SELECT NULL FROM auth_google WHERE user = :user LIMIT 1', { user: user }))
		return JSON.stringify({ success: false, code: 400, message: 'To konto już może logować się za pomocą Google.' });

	const code = String(data.code);
	const googleUser = await Google.validateCode(code, 'add');

	if (!googleUser)
		return JSON.stringify({ success: false, code: 400, message: 'Walidacja kodu uwierzytelniającego nieudana.' });

	const googleUserID = String(googleUser.id).substring(0, 128);
	const success = await SQL.transaction(
	[
		{
			statement: 'INSERT INTO auth_google VALUES(:user, :id)',
			params: { user, id: googleUserID }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
			params: { module: 'core', event: 'add_login_method', user, data: JSON.stringify({ method: 'google' })}
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się dodać metody logowania.' });

	return JSON.stringify({ success: true, message: 'Pomyślnie dodano metodę logowania.' });
}

async function removeLoginMethod(/** @type {Object.<string, *>} */ data)
{
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
			statement: 'DELETE FROM auth_google WHERE user = :user',
			params: { user }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target) VALUES (:module, :event, :user, :data)',
			params: { module: 'core', event: 'remove_login_method', user, data: JSON.stringify({ method: 'google' })}
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się usunąć metody logowania.' });

	return JSON.stringify({ success: true, message: 'Pomyślnie usunięto metodę logowania.' });
}