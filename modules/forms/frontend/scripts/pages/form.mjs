import Cookies from '/core/frontend/scripts/interfaces/Cookies.mjs';
import User from '/core/frontend/scripts/feats/User.mjs';

/** @type {Map.<number, { first_name: string?, nick_name: string?, last_name: string? }>} */
const users = new Map();

// fills datalist[id="forms/form/users/datalist"]
(async () =>
{
	const datalist = document.getElementById('forms/form/users/datalist');

	if (datalist === null)
		return;

	const token = Cookies.get('core/session/token');

	if (token === null)
		return;

	const json = await (async () =>
	{
		const path = '/core/api/v0/get-users';

		try
		{
			return await (await fetch(path, { method: 'POST', body: JSON.stringify({ token: token })})).json();
		}
		catch (message)
		{
			console.error(`POST '${path}' failed.`, message);
			return null;
		}
	})();

	if (!json?.success)
		return;

	for (const user of json.users)
	{
		users.set(user.id, { first_name: user.first_name, nick_name: user.nick_name, last_name: user.last_name });

		const option = document.createElement('option');
		const name = (() =>
		{
			/** @type {string[]} */
			const names = [];

			if (typeof user.first_name == 'string')
				names.push(user.first_name);

			if (typeof user.nick_name == 'string')
				names.push(`"${user.nick_name}"`);

			if (typeof user.last_name == 'string')
				names.push(user.last_name);

			names.push(`(ID: ${user.id})`);

			return names.join(' ');
		})();

		option.setAttribute('value', name);
		datalist.append(option);
	}
})();

// container conditional hidding
(() =>
{
	const enablers = document.querySelectorAll('[data-enables]');

	for (const enabler of enablers)
	{
		enabler.addEventListener('change', () =>
		{
			const targetNames = enabler.getAttribute('data-enables');
			const enabledValue = enabler.getAttribute('data-enables-value');
			const enabled =
			(
					(
							enabler instanceof HTMLInputElement
						||	enabler instanceof HTMLSelectElement
					)
				&&	String(enabler.value) == enabledValue
			);

			if (targetNames === null)
				return;

			for (const targetName of targetNames.split(/, ?/u))
			{
				const targetElements = document.querySelectorAll(`[data-enabled="${targetName}"]`);

				for (const targetElement of targetElements)
				{
					const containerName = targetElement.getAttribute('data-contained');
					const containerElement = containerName === null ? null : document.querySelector(`[data-containes="${containerName}"]`);

					if (enabled)
					{
						targetElement.setAttribute('required', '');
						containerElement?.removeAttribute('hidden');
					}
					else
					{
						targetElement.removeAttribute('required');
						containerElement?.setAttribute('hidden', '');
					}
				}
			}
		});
	}
})();

// type_others conditionals
(() => {
	const type = document.getElementById('forms/form/type_others');

	if (type instanceof HTMLSelectElement)
		type.addEventListener('change', () =>
		{
			const elements = document.querySelectorAll('[id="forms/form"] [data-type]');

			for (const element of elements)
			{
				const dataType = element.getAttribute('data-type');

				if (dataType === null)
					continue;

				if (dataType.split('|').includes(type.value))
				{
					element.removeAttribute('hidden');
					element.querySelectorAll('[data-required]').forEach(e => e.setAttribute('required', ''));
				}
				else
				{
					element.setAttribute('hidden', '');
					element.querySelectorAll('[data-required]').forEach(e => e.removeAttribute('required'));
				}
			}
		});
})();

// adds and removes users
(() =>
{
	let cohortID = 0;

	document.getElementById('forms/form/add-user')?.addEventListener('click', event =>
	{
		event.preventDefault();

		const input = document.getElementById('forms/form/user');

		if (!(input instanceof HTMLInputElement))
			return;

		const output = document.getElementById('forms/form/users/div');

		if (!output)
			return;

		const id = (() =>
		{
			const value = input.value;

			if (value === null)
				return null;

			const id = value.match(/\(ID: (?<id>\d+)\)$/u)?.groups?.id ?? null;

			if (id === null)
				return null;

			return Number(id);
		})();

		if (User.user == id)
			return;

		if (document.querySelector(`input[value*="ID: ${id}"]:not([id="forms/form/user"])`))
			return;

		const userData = id === null ? null : (users.get(id) ?? null);
		const span = document.createElement('span');

		const user = document.createElement('input');

		if (userData === null)
			user.setAttribute('name', `plain_cohorts[${cohortID}][name]`);

		user.setAttribute('readonly', '');
		user.setAttribute('tabindex', '-1');

		if (userData !== null)
		{
			user.style.backgroundImage = 'url(/core/frontend/icons/verified.green.80.svg)';
			user.style.backgroundRepeat = 'no-repeat';
			user.style.backgroundPosition = 'right 8px center';
			user.style.backgroundSize = '24px';
			user.style.paddingRight = 'calc(24px + 16px + 8px)';
			user.style.color = 'var(--app-color-green-80)';
			user.style.backgroundColor = 'var(--app-color-green-20)';
		}

		const button = document.createElement('button');
		button.style.width = '42px';
		button.style.minWidth = '0';
		button.style.flexShrink = '0';
		button.setAttribute('title', 'Usuń osobę współprowadzącą');
		button.addEventListener('click', event =>
		{
			event.preventDefault();
			span.remove();
		});

		const img = document.createElement('img');
		img.classList.add('icon');
		img.setAttribute('src', '/core/frontend/icons/user-remove.svg');
		img.setAttribute('width', '24px');
		img.setAttribute('height', '24px');
		button.append(img);

		const mentionInput = document.getElementById('cohort_mention');
		const mentionValue = mentionInput instanceof HTMLSelectElement ? mentionInput.value : null;

		if (userData === null)
		{
			const emailInput = document.getElementById('cohort_email');
			const emailValue = emailInput instanceof HTMLInputElement ? emailInput.value : null;
			const emailOutput = document.createElement('input');
			emailOutput.setAttribute('hidden', '');
			emailOutput.setAttribute('name', `plain_cohorts[${cohortID}][email]`);
			emailOutput.setAttribute('value', emailValue ?? '');
			span.append(emailOutput);

			const phoneInput = document.getElementById('cohort_phone');
			const phoneValue = phoneInput instanceof HTMLInputElement ? phoneInput.value : null;
			const phoneOutput = document.createElement('input');
			phoneOutput.setAttribute('hidden', '');
			phoneOutput.setAttribute('name', `plain_cohorts[${cohortID}][phone]`);
			phoneOutput.setAttribute('value', phoneValue ?? '');
			span.append(phoneOutput);
		}
		else
		{
			const mentionOutput = document.createElement('input');
			mentionOutput.setAttribute('hidden', '');
			mentionOutput.setAttribute('name', `cohorts[${id}][mention]`);
			mentionOutput.setAttribute('value', mentionValue ?? 'imie_pseudonim_nazwisko');
			span.append(mentionOutput);
		}

		const name = (() =>
		{
			if (userData === null)
				return input.value;

			/** @type {string[]} */
			const names = [];

			if
			(
					mentionValue != 'pseudonim'
				&&	typeof userData.first_name == 'string'
			)
				names.push(userData.first_name);

			if
			(
					mentionValue != 'imie_nazwisko'
				&&	typeof userData.nick_name == 'string'
			)
				names.push(mentionValue == 'pseudonim' ? userData.nick_name : `"${userData.nick_name}"`);

			if
			(
					mentionValue != 'pseudonim'
				&&	typeof userData.last_name == 'string'
			)
				names.push(userData.last_name);

			return names.join(' ');
		})();

		user.setAttribute('value', name);

		span.append(user);
		span.append(button);
		output.append(span);

		input.value = '';

		if (userData === null)
			++cohortID;
	});
})();