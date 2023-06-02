(async () =>
{
	const login = document.body.querySelector('#login > output');

	if (!(login instanceof HTMLElement))
		return;

	const json = await (async () =>
	{
		const path = '/core/api/v0/login';

		try
		{
			return await (await fetch(path, { method: 'POST', body: JSON.stringify({ action: 'get methods' })})).json();
		}
		catch (message)
		{
			console.error(`POST '${path}' failed.`, message);
			return null;
		}
	})();

	if (!json?.success)
	{
		login.setAttribute('class', 'red');
		login.replaceChildren('Błąd pobierania metod logowania.');

		return;
	}

	if (!json.methods.length)
	{
		login.removeAttribute('class');
		login.replaceChildren('Brak możliwości logowania.');

		return;
	}

	const cards = document.createElement('app-cards');

	for (const method of json.methods)
	{
		const img = document.createElement('img');
		img.setAttribute('src', method.logo ?? '/core/frontend/icons/login.svg');
		img.classList.add('icon');

		const title = document.createElement('app-card-title');
		title.append(method.name);

		const card = document.createElement('app-card');
		card.setAttribute('data-goto', method.pages.login);
		card.append(img, title);

		cards.append(card);
	}

	login.replaceWith(cards);
})();