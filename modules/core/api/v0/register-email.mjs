import bcrypt from 'bcryptjs';
import cryptoRandomString from 'crypto-random-string';
import Mail from '/core/backend/scripts/interfaces/Mail.mjs';
import Uploads from '/core/backend/scripts/interfaces/Uploads.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import app from '/core/shared/data/app.json' assert { type: 'json' };
import auth from '/core/backend/data/auth.json' assert { type: 'json' };
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	if (!auth.methods.email.register)
		return JSON.stringify({ success: false, code: 503, message: 'Rejestracja za pomocą e-maila jest obecnie wyłączona.' });

	const data = noexcept(JSON.parse)(json);
	const login = String(data.login).toLowerCase();
	const email = String(data.email).toLowerCase();
	const password = String(data.password);
	const firstName = String(data.first_name) || null;
	const nickName = String(data.nick_name) || null;
	const lastName = String(data.last_name) || null;
	const phone = String(data.phone).replaceAll(/[^+\d]/gu, '') || null;
	let logo = String(data.logo) || null;
	const extension = String(data.logo_extension) || null;
	const searchable = Number(data.searchable);

	// validate user data
	{
		if (!login.match(/^(?:[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+)*){3,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy login.' });

		if (!email.match(/.@./u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy adres e-mail.' });

		if (email.length > 128)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi adres e-mail.' });

		if (password.length < 16)
			return JSON.stringify({ success: false, code: 400, message: 'Za krótkie hasło.' });

		if (password.length > 128)
			return JSON.stringify({ success: false, code: 400, message: 'Za długie hasło.' });

		if (typeof firstName == 'string' && !firstName.match(/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe imię.' });

		if (typeof nickName == 'string' && !nickName.match(/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowa ksywka.' });

		if (typeof lastName == 'string' && !lastName.match(/^(?:[\p{L}\p{N}]+(?:[ -]?[\p{L}\p{N}]+)*){1,64}$/u))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe nazwisko.' });

		if (typeof phone == 'string' && (!phone.match(/^(?:\+[1-9])?\d+$/u) || phone.length > 32))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy numer telefonu.' });

		if (![0, 1].includes(searchable))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowa wartość pola zgody na wyszukiwanie.' });

		if (logo !== null)
		{
			if (extension === null)
				return JSON.stringify({ success: false, code: 400, message: 'Brak rozszerzenia.' });

			if (!Object.keys(server.uploadImgExtensions).includes(extension))
				return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe rozszerzenie.' });

			const maxSize = server.maxUploadSize * 1024 ** 2;

			if (logo.length > maxSize)
				return JSON.stringify({ success: false, code: 400, message: `Plik z logo za duży. Maksymalny rozmiar: ${maxSize} MiB).` });
		}
	}

	if (await SQL.select('SELECT NULL FROM users WHERE login = ? LIMIT 1', [login]))
		return JSON.stringify({ success: false, code: 406, message: 'Login zajęty.'});

	if (await SQL.select('SELECT NULL FROM users WHERE email = ? LIMIT 1', [email]))
		return JSON.stringify({ success: false, code: 406, message: 'E-mail zajęty.'});

	if (logo !== null && extension !== null)
		logo = Uploads.upload(logo, extension);

	// ~ .25s on ~3 GHz Intel Core i7
	const salt = bcrypt.genSaltSync(12);
	const hash = bcrypt.hashSync(password, salt);
	const insert = await SQL.insert
	(
			'INSERT INTO users (login, email, password, first_name, nick_name, last_name, phone, searchable, logo)'
		+	' VALUES (:login, :email, :hash, :first_name, :nick_name, :last_name, :phone, :searchable, :logo)',
		{
			login, email, hash, first_name: firstName, nick_name: nickName, last_name: lastName, phone, searchable, logo,
		}
	);

	if (insert === null)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się dodać użytkownika do bazy danych.'});

	const user = insert.id;
	const code = cryptoRandomString({ length: server.tokenSize, type: 'alphanumeric' });

	const success = await SQL.transaction(
	[
		{
			statement: 'INSERT INTO activations (user, code, expiration) VALUES (:user, :code, now() + interval 1 hour)',
			params: { user, code }
		},
		{
			statement: 'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
			params: { module: 'core', event: 'user_register', user, data: JSON.stringify({ type: 'email' })}
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się zarejestrować.' });

	const [link, address] = (() =>
	{
		const httpLink = server.http.enabled ? `http://${server.http.host}:${server.http.port}/core/activate?user=${user}&code=${code}` : null;
		const httpsLink = server.https.enabled ? `https://${server.https.host}:${server.https.port}/core/activate?user=${user}&code=${code}` : null;

		if
		(
				server.http.enabled
			&&	server.https.enabled
			&&	!server.http.redirectToHTTPS
		)
		{
			return [
					`Link aktywacyjny (HTTP): <a href="${httpLink}">Aktywuj konto</a>. <br>`
				+	`Link aktywacyjny (HTTPS): <a href="${httpsLink}">Aktywuj konto</a>.`,
					`Adres (HTTP): ${httpLink}\n\t`
				+	`Adres (HTTPS): ${httpsLink}`
			];
		}

		const link = httpsLink ?? httpLink;

		return [`Link aktywacyjny: <a href="${link}">Aktywuj konto</a>.`, `Adres: ${link}`];
	})();

	// send user activation code via email
	{
		const success = await Mail.send(
		{
			recipient: email,
			subject: `[${app.name}] Aktywacja konta`,
			html: link,
			text: `Dane do aktywacji konta:\n\n\tAdres: ${address}\n\tID: ${user}\n\tKod: ${code}`
		});

		await SQL.query
		(
			'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
			{ module: 'core', event: 'mail_send', user, data: JSON.stringify({ type: 'user_activation', success: success })}
		);

		if (!success)
		{
			await SQL.transaction(
			[
				{
					statement: 'DELETE FROM users WHERE id = :user',
					params: { user }
				},
				{
					statement: 'INSERT INTO logs (module, event, user, target, data) VALUES (:module, :event, :user, :user, :data)',
					params: { module: 'core', event: 'user_remove', user, data: JSON.stringify({ reason: 'Sending an e-mail with activation code failed.' })}
				},
			]);

			return JSON.stringify(
			{
				success: false,
				message: 'Nie udało się wysłać maila z kodem aktywacyjnym. Zarejestruj się, proszę, ponownie. Może użyjesz innego adresu e-mail?'
			});
		}
	}

	return JSON.stringify(
	{
		success: true,
		message: 'Zarejestrowano pomyślnie. Atywuj swoje konto w ciągu godziny. Link aktywacyjny znajdziesz w mailu. Sprawdź też spam.'
	});
};