(async () =>
{
	const registration = document.body.querySelector('#register > output');

	if (!(registration instanceof HTMLElement))
		return;

	const json = await (async () =>
	{
		const path = '/core/api/v0/register';

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
		registration.setAttribute('class', 'red');
		registration.replaceChildren('Błąd pobierania metod rejestracji.');

		return;
	}

	if (!json.methods.length)
	{
		registration.removeAttribute('class');
		registration.replaceChildren('Brak możliwości rejestracji.');

		return;
	}

	const cards = document.createElement('app-cards');

	for (const method of json.methods)
	{
		const img = document.createElement('img');
		img.setAttribute('src', method.logo ?? '/core/frontend/icons/register.svg');
		img.classList.add('icon');

		const title = document.createElement('app-card-title');
		title.append(method.name);

		const card = document.createElement('app-card');
		card.setAttribute('data-goto', method.target);
		card.append(img, title);

		cards.append(card);
	}

	registration.replaceWith(cards);
})();