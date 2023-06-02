import bcrypt from 'bcryptjs';
import cryptoRandomString from 'crypto-random-string';
import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import auth from '/core/backend/data/auth.json' assert { type: 'json' };
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

			return checkavAvailability(data);

		case 'add login method':

			return addLoginMethod(data);

		case 'remove login method':

			return removeLoginMethod(data);
	}

	return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe zapytanie.' });
};

async function login(/** @type {Object.<string, *>} */ data)
{
	if (!auth.methods.email.login)
		return JSON.stringify({ success: false, code: 503, message: 'Logowanie za pomocą hasła jest obecnie wyłączone.' });

	const login = String(data.login).toLowerCase() || null;
	const email = String(data.email).toLowerCase() || null;
	const password = String(data.password);

	// validate user data
	{
		if (login !== null && !login.match(/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy login.' });

		if (email !== null && !email.match(/.@./u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy adres e-mail.' });

		if (email !== null && email.length > 128)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi adres e-mail.' });

		if (login === null && email === null)
			return JSON.stringify({ success: false, code: 400, message: 'Brak zarówno hasła, jak i adresu e-mail.' });

		if (password.length < 16)
			return JSON.stringify({ success: false, code: 400, message: 'Za krótkie hasło.' });

		if (password.length > 128)
			return JSON.stringify({ success: false, code: 400, message: 'Za długie hasło.' });
	}

	/** @type {string} */
	let credential = '';

	/** @type {string[]} */
	const array = [];

	if (login === null && email !== null)
	{
		credential = 'email';
		array.push(email);
	}
	else
	if (login !== null)
	{
		credential = 'login';
		array.push(login);
	}

	const select = await SQL.select
	(
		`SELECT active, banned, id, password, first_name, nick_name, last_name, logo FROM users WHERE ${credential} = ? LIMIT 1`,
		array
	);

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	if (select === false)
		return JSON.stringify({ success: false, code: 403, message: 'Nieprawidłowy login.' });

	if (select[0]?.banned == 1)
		return JSON.stringify({ success: false, code: 403, message: 'Konto zbanowane.' });

	if (select[0]?.active != 1)
		return JSON.stringify({ success: false, code: 403, message: 'Konto nieaktywne.' });

	const hash = String(select[0]?.password);
	const valid = bcrypt.compareSync(password, hash);

	if (!valid)
		return JSON.stringify({ success: false, code: 403, message: 'Nieprawidłowe hasło.' });

	const user = Number(select[0]?.id);
	const token = cryptoRandomString({ length: server.tokenSize, type: 'alphanumeric' });
	const expiration = new Date(Date.now() + 1000 * 60 ** 2);

	const success = await SQL.transaction(
	[
		{
			statement:
				'INSERT INTO sessions (user, token, expiration) VALUES (:user, :token, :expiration)'
			+	' ON DUPLICATE KEY UPDATE token = :token, expiration = :expiration',
			params: { user: user, token: token, expiration: expiration.toISOString().replace('T', ' ').slice(0, -5) }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
			params: { module: 'core', event: 'user_login', user, data: JSON.stringify({ type: 'password' })}
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się zalogować.' });

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

async function checkavAvailability(/** @type {Object.<string, *>} */ data)
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

	const select = await SQL.select('SELECT NULL FROM users WHERE id = :user AND password IS NOT NULL LIMIT 1', { user: user });

	if (select === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Błąd pobierania danych.' });

	return JSON.stringify({ success: true, status: select !== false });
}

async function addLoginMethod(/** @type {Object.<string, *>} */ data)
{
	if (!auth.methods.email.register)
		return JSON.stringify({ success: false, code: 503, message: 'Dodawanie metody logowania za pomocą hasła jest obecnie wyłączone.' });

	const token = String(data.token);

	// validate user token
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });
	}

	const user = await Permissions.getUserByToken(token);

	if (user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	if (await SQL.select('SELECT NULL FROM users WHERE id = :user AND password IS NOT NULL LIMIT 1', { user: user }))
		return JSON.stringify({ success: false, code: 400, message: 'To konto już może logować się za pomocą hasła.' });

	const password = String(data.password);

	// validate user data
	{
		if (password.length < 16)
			return JSON.stringify({ success: false, code: 400, message: 'Za krótkie hasło.' });

		if (password.length > 128)
			return JSON.stringify({ success: false, code: 400, message: 'Za długie hasło.' });
	}

	// ~ .25s on ~3 GHz Intel Core i7
	const salt = bcrypt.genSaltSync(12);
	const hash = bcrypt.hashSync(password, salt);
	const success = await SQL.transaction(
	[
		{
			statement: 'UPDATE users SET password = :hash WHERE id = :user',
			params: { hash, user }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
			params: { module: 'core', event: 'add_login_method', user, data: JSON.stringify({ method: 'password' })}
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
			statement: 'UPDATE users SET password = NULL WHERE id = :user',
			params: { user }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
			params: { module: 'core', event: 'remove_login_method', user, data: JSON.stringify({ method: 'password' })}
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się usunąć metody logowania.' });

	return JSON.stringify({ success: true, message: 'Pomyślnie usunięto metodę logowania.' });
}