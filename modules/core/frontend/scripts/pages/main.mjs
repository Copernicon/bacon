(async () =>
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

	section.append(p);
	p.append(span);
	main.replaceWith(section);
})();