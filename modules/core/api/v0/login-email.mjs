import bcrypt from 'bcryptjs';
import cryptoRandomString from 'crypto-random-string';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import auth from '/core/backend/data/auth.json' assert { type: 'json' };
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	if (!auth.methods.email.login)
		return JSON.stringify({ success: false, code: 503, message: 'Logowanie za pomocą e-maila jest obecnie wyłączone.' });

	const data = noexcept(JSON.parse)(json);
	const login = String(data.login).toLowerCase();
	const password = String(data.password);

	// validate user data
	{
		if (!login.match(/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy login.' });

		if (password.length < 16)
			return JSON.stringify({ success: false, code: 400, message: 'Za krótkie hasło.' });

		if (password.length > 128)
			return JSON.stringify({ success: false, code: 400, message: 'Za długie hasło.' });
	}

	const select = await SQL.select
	(
		'SELECT active, banned, id, password, first_name, nick_name, last_name, logo FROM users WHERE login = :login LIMIT 1',
		{ login: login }
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
			statement: 'INSERT INTO logs (module, event, user, target) VALUES (:module, :event, :user, :user)',
			params: { module: 'core', event: 'user_login', user: user }
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
};