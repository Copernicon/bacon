import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import Google from '/sign-with-google/backend/scripts/interfaces/Google.mjs';
import auth from '/sign-with-google/backend/data/auth.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	if (!auth.methods.google.register)
		return JSON.stringify({ success: false, code: 503, message: 'Rejestracja za pomocą Google jest obecnie wyłączona.' });

	const data = noexcept(JSON.parse)(json);
	const code = String(data.code);
	const googleUser = await Google.validateCode(code);

	if (!googleUser)
		return JSON.stringify({ success: false, code: 400, message: 'Walidacja kodu uwierzytelniającego nieudana.' });

	const login = String(data.login).toLowerCase();
	const email = String(googleUser.email).substring(0, 128);
	const firstName = String(googleUser.first_name).replaceAll(/[^\p{L}\p{N} -]/gu, '').replaceAll(/([ -]){2,}/gu, '$1').substring(0, 64) || null;
	const nickName = String(data.nick_name) || null;
	const lastName = String(googleUser.last_name).replaceAll(/[^\p{L}\p{N} -]/gu, '').replaceAll(/([ -]){2,}/gu, '$1').substring(0, 64) || null;
	const phone = String(data.phone).replaceAll(/[^+\d]/gu, '') || null;
	const logo = String(googleUser.logo).substring(0, 192) || null;
	const searchable = Number(data.searchable);
	const googleUserID = String(googleUser.id);

	// validate user data
	{
		if (!login.match(/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy login.' });

		if (typeof nickName == 'string' && !nickName.match(/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowa ksywka.' });

		if (typeof phone == 'string' && (!phone.match(/^(?:\+[1-9])?\d+$/u) || phone.length > 32))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy numer telefonu.' });

		if (![0, 1].includes(searchable))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowa wartość pola zgody na wyszukiwanie.' });
	}

	if (await SQL.select('SELECT NULL FROM users WHERE login = ? LIMIT 1', [login]))
		return JSON.stringify({ success: false, code: 406, message: 'Login zajęty.'});

	if (await SQL.select('SELECT NULL FROM users WHERE email = ? LIMIT 1', [email]))
		return JSON.stringify({ success: false, code: 406, message: 'E-mail zajęty.'});

	const insert = await SQL.insert
	(
			'INSERT INTO users (login, email, first_name, nick_name, last_name, phone, searchable, logo, active)'
		+	' VALUES (:login, :email, :first_name, :nick_name, :last_name, :phone, :searchable, :logo, :active)',
		{
			login, email, first_name: firstName, nick_name: nickName, last_name: lastName, phone, logo, searchable, active: 1
		}
	);

	if (insert === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się dodać użytkownika do bazy danych.'});

	const user = insert.id;
	const success = await SQL.transaction(
	[
		{
			statement: 'INSERT INTO auth_google (user, id) VALUES (:user, :id)',
			params: { user, id: googleUserID }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target) VALUES (:module, :event, :user, :user)',
			params: { module: 'core', event: 'user_register', user }
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się zarejestrować.' });

	return JSON.stringify(
	{
		success: true,
		message: 'Zarejestrowano pomyślnie.'
	});
};