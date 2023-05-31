import Cookies from '/core/frontend/scripts/interfaces/Cookies.mjs';

(async () =>
{
	const projects = document.body.querySelector('#projects > output');

	if (!(projects instanceof HTMLElement))
		return;

	const token = Cookies.get('core/session/token');

	if (token === null)
	{
		projects.setAttribute('class', 'red');
		projects.replaceChildren('Brak żetonu uwierzytelniającego.');

		return;
	}

	const json = await (async () =>
	{
		const path = '/core/api/v0/projects';

		try
		{
			return await (await fetch(path, { method: 'POST', body: JSON.stringify({ token: token, action: 'list available' })})).json();
		}
		catch (message)
		{
			console.error(`POST '${path}' failed.`, message);
			return null;
		}
	})();

	if (!json?.success)
	{
		projects.setAttribute('class', 'red');
		projects.replaceChildren('Błąd pobierania listy projektów.');

		return;
	}

	if (!json.projects.length)
	{
		projects.removeAttribute('class');
		projects.replaceChildren('Brak projektów.');

		return;
	}

	const cards = document.createElement('app-cards');

	for (const project of json.projects)
	{
		const img = document.createElement('img');
		img.setAttribute('src', project.logo ?? '/core/frontend/icons/projects.svg');

		const title = document.createElement('app-card-title');
		title.append(project.name);

		const card = document.createElement('app-card');
		card.setAttribute('data-set-project', project.id);
		card.append(img, title);

		cards.append(card);
	}

	projects.replaceWith(cards);
})();