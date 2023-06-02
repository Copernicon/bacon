import User from '/core/frontend/scripts/feats/User.mjs';
import Session from '/core/frontend/scripts/feats/Session.mjs';

if (Session.token === null)
	showGuestPanel();
else
	showUserPanel();

function showGuestPanel()
{
	const main = document.body.querySelector('#main');

	if (!(main instanceof HTMLElement))
		return;

	const section = document.createElement('section');
	const p = document.createElement('p');
	const span = document.createElement('span');

	for (const data of
	[
		{ name: 'Rejestracja', target: 'core/register', icon: '/core/frontend/icons/register.svg' },
		{ name: 'Logowanie', target: 'core/login', icon: '/core/frontend/icons/login.svg' }
	])
	{
		const button = document.createElement('button');
		button.setAttribute('data-goto', data.target);

		const img = document.createElement('img');
		img.setAttribute('src', data.icon);
		img.setAttribute('width', '24');
		img.setAttribute('height', '24');
		img.classList.add('icon');

		button.append(img);
		button.append(data.name);
		span.append(button);
	}

	p.append(span);
	section.append(p);
	main.replaceWith(section);
}

async function showUserPanel()
{
	const main = document.body.querySelector('#main');

	if (!(main instanceof HTMLElement))
		return;

	/** @type {HTMLElement[]} */
	const sections = [];
	const profile = getProfile();

	if (profile === null)
	{
		main.setAttribute('class', 'red');
		main.replaceChildren('Błąd pobierania danych z serwera.');
		return;
	}

	sections.push(profile);

	const loginMethods = await getLoginMethods();

	if (loginMethods === null)
	{
		main.setAttribute('class', 'red');
		main.replaceChildren('Błąd pobierania danych z serwera.');
		return;
	}

	sections.push(loginMethods);
	main.replaceWith(...sections);
}

function getProfile()
{
	const section = document.createElement('section');
	{
		const h1 = document.createElement('h1');
		h1.append('Profil');
		section.append(h1);
	}
	{
		const p = document.createElement('p');
		const span = document.createElement('span');
		span.append(`Witaj, ${User.displayName}.`);
		p.append(span);
		section.append(p);
	}

	const table = document.createElement('table');
	const tbody = document.createElement('tbody');
	const tr = document.createElement('tr');

	{
		const td = document.createElement('td');
		td.append('Twój identyfikator użytkownika');
		tr.append(td);
	}
	{
		const td = document.createElement('td');
		const code = document.createElement('code');
		code.append(String(User.user));
		td.append(code);
		tr.append(td);
	}

	tbody.append(tr);
	table.append(tbody);

	section.append(table);
	return section;
}

async function getLoginMethods()
{
	const section = document.createElement('section');
	{
		const h1 = document.createElement('h1');
		h1.append('Metody Logowania');
		section.append(h1);
	}
	{
		const p = document.createElement('p');
		const span = document.createElement('span');
		span.append('Lista metod logowania:');
		p.append(span);
		section.append(p);
	}

	/** @type {import('/core/backend/scripts/classes/Login.mjs').LoginMethod[]?} */
	const methods = await (async () => {
		const path = '/core/api/v0/login';
		const file = await fetch(path, { method: 'POST', body: JSON.stringify(
		{
			token: Session.token,
			action: 'get methods'
		})}).catch(message => void console.error(message));
		const json = await file?.json().catch(message => void console.error(message));
		return json?.methods ?? null;
	})();

	if (methods === null)
	{
		const main = document.body.querySelector('#main');

		main?.setAttribute('class', 'red');
		main?.replaceChildren('Błąd pobierania danych z serwera.');

		return null;
	}

	const table = document.createElement('table');
	const thead = document.createElement('thead');
	const tbody = document.createElement('tbody');
	const tr = document.createElement('tr');

	{
		const td = document.createElement('td');
		td.append('');
		tr.append(td);
	}
	{
		const td = document.createElement('td');
		td.append('Metoda');
		tr.append(td);
	}
	{
		const td = document.createElement('td');
		td.append('Dostęp');
		tr.append(td);
	}
	{
		const td = document.createElement('td');
		td.append('Opcje');
		tr.append(td);
	}

	thead.append(tr);
	table.append(thead);

	for (const method of methods)
	{
		/** Indicates if the login {@link method `method`} is available to a user. */
		const isLoginMethodAvailable = await (async () => {
			const file = await fetch(method.API, { method: 'POST', body: JSON.stringify({
				action: 'check availability',
				token: Session.token
			})}).catch(message => void console.error(message));
			const json = await file?.json().catch(message => void console.error(message));
			return json?.status === true;
		})();

		const tr = document.createElement('tr');

		{
			const td = document.createElement('td');
			const img = document.createElement('img');
			img.setAttribute('src', method.logo ?? '/core/frontend/icons/login.svg');
			img.setAttribute('width', '16px');
			img.setAttribute('height', '16px');
			img.classList.add('icon');
			td.append(img);
			tr.append(td);
		}
		{
			const td = document.createElement('td');
			td.append(method.name);
			tr.append(td);
		}
		{
			const td = document.createElement('td');
			{
				const span = document.createElement('span');
				span.append(isLoginMethodAvailable ? 'Tak' : 'Nie');
				span.classList.add(isLoginMethodAvailable ? 'green' : 'red');
				td.append(span);
			}

			tr.append(td);
		}
		{
			const td = document.createElement('td');
			const a = document.createElement('a');
			let url = isLoginMethodAvailable ? method.pages.remove : method.pages.add;

			if (!url.includes('://'))
				url = '/' + url;

			a.setAttribute('href', url);
			a.append((isLoginMethodAvailable ? 'Usuń' : 'Dodaj') + ' metodę logowania');
			td.append(a);
			tr.append(td);
		}

		tbody.append(tr);
	}

	table.append(tbody);
	section.append(table);

	return section;
}