import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import SQL from '/core/backend/scripts/interfaces/SQL.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const token = String(data.token);

	// validate user token
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });
	}

	const user = await Permissions.getUserByToken(token);

	if (user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	const mention = String(data.mention);
	let cohorts = data.cohorts === undefined ? null : data.cohorts;
	let plain_cohorts = data.plain_cohorts === undefined ? null : data.plain_cohorts;
	const type = String(data.type);
	const type_others = String(data.type_others).length == 0 ? null : String(data.type_others);
	const type_contest = String(data.type_contest).length == 0 ? null : String(data.type_contest);
	const duration = String(data.duration);
	const track = String(data.track);
	const title = String(data.title);
	const full_description = String(data.full_description);
	const system = String(data.system).length == 0 ? null : String(data.system);
	const system_knowledge = ['0', '1'].includes(String(data.system_knowledge)) ? Number(data.system_knowledge) : 0;
	const beginners_friendly = ['0', '1'].includes(String(data.beginners_friendly)) ? Number(data.beginners_friendly) : 0;
	const age = String(data.age).length == 0 ? null : String(data.age);
	const num_players = String(data.num_players).length == 0 ? null : Number(data.num_players);
	const style = String(data.style).length == 0 ? null : String(data.style);
	const style_description = String(data.style_description).length == 0 ? null : String(data.style_description);
	let tech_requirements = data.tech_requirements;
	const tech_requirements_others = String(data.tech_requirements_others).length == 0 ? null : String(data.tech_requirements_others);
	let trigger_list = data.trigger_list;
	let accessability = data.accessability;
	let preference_time = data.preference_time;
	const preferences_additional = String(data.preferences_additional).length == 0 ? null : String(data.preferences_additional);
	const previous_conventions = ['0', '1'].includes(String(data.previous_conventions)) ? Number(data.previous_conventions) : 0;
	const previous_conventions_which = String(data.previous_conventions_which).length == 0 ? null : String(data.previous_conventions_which);
	const experience = String(data.experience);
	const organization = String(data.organization);
	const dis_panel_question = ['0', '1'].includes(String(data.dis_panel_question)) ? Number(data.dis_panel_question) : 0;
	const dis_panel_topics = String(data.dis_panel_topics).length == 0 ? null : String(data.dis_panel_topics);
	const other_remarks = String(data.other_remarks);

	// validate user data
	{
		if (!['imie_nazwisko', 'pseudonim', 'imie_pseudonim_nazwisko'].includes(mention))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ zapisu.' });

		if
		(
				cohorts !== null
			&&	typeof cohorts != 'object'
		)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ współuczestników.' });

		if (cohorts !== null)
		{
			/** @type {*[]} */
			const array = [];

			for (const [key, value] of Object.entries(cohorts))
			{
				if (typeof value != 'object')
					return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ wartości współuczestnika.' });

				const id = Number(key);

				if (!Number.isInteger(id) || id < 0)
					return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy identyfikator współuczestnika.' });

				if (!['imie_nazwisko', 'pseudonim', 'imie_pseudonim_nazwisko'].includes(value.mention))
					return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ zapisu współuczestnika.' });

				array.push({ id, mention: value.mention });
			}

			cohorts = JSON.stringify(array);
		}

		if
		(
				plain_cohorts !== null
			&&	typeof plain_cohorts != 'object'
		)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ współuczestników spoza listy.' });

		if (plain_cohorts !== null)
		{
			/** @type {*[]} */
			const array = [];

			for (const [key, value] of Object.entries(plain_cohorts))
			{
				if (typeof value != 'object')
					return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ wartości współuczestnika spoza listy.' });

				const id = Number(key);

				if (!Number.isInteger(id) || id < 0)
					return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy identyfikator współuczestnika spoza listy.' });

				const name = String(value.name);

				if (name.length > 128)
					return JSON.stringify({ success: false, code: 400, message: 'Za długa nazwa współuczestnika spoza listy.' });

				const email = String(value.email).length == 0 ? null : String(value.email);

				if (email !== null && email.length > 128)
					return JSON.stringify({ success: false, code: 400, message: 'Za długi e-mail współuczestnika spoza listy.' });

				if (email !== null && !email.match(/.@./u))
					return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy e-mail współuczestnika spoza listy.' });

				const phone = String(value.phone).length == 0 ? null : String(value.phone);

				if (phone !== null && phone.length > 32)
					return JSON.stringify({ success: false, code: 400, message: 'Za długi numer telefonu współuczestnika spoza listy.' });

				if (phone !== null && !phone.match(/^(?:\+[1-9])?\d+$/u))
					return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy numer telefonu współuczestnika spoza listy.' });

				array.push({ id, name, email, phone });
			}

			plain_cohorts = JSON.stringify(array);
		}

		if (!['prelekcja', 'konkurs', 'RPG', 'LARP', 'inne'].includes(type))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ atrakcji.' });

		if (type_others !== null && type_others.length > 50)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi opis typu.' });

		if (type_contest !== null && !['indywidualny', 'druzynowy'].includes(type_contest))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy typ konkursu.' });

		if (!['45', '105', '165+'].includes(duration))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy czas trwania atrakcji.' });

		if
		(
			!['literacki', 'popkulturowy', 'popularnonaukowy', 'manga_anime', 'konkursowy', 'gry_planszowe_karciane', 'gry_elektroniczne', 'RPG', 'LARP']
				.includes(track)
		)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy blok programowy.' });

		if (title.length > 50)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi tytuł.' });

		if (full_description.length > 600)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi opis atrakcji.' });

		if (system !== null && system.length > 50)
			return JSON.stringify({ success: false, code: 400, message: 'Za długa nazwa systemu.' });

		if (age !== null && !['*', '12-', '12-18', '18'].includes(age))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy preferowany wiek graczy.' });

		if (num_players !== null && (!Number.isInteger(num_players) || num_players < 0))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowa wartość preferowanej liczby graczy.' });

		if (style !== null && !['zwyciestwo', 'historia', 'świat', 'emocje', 'zabawa', 'inny'].includes(style))
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy styl sesji RPG.' });

		if (style_description !== null && style_description.length > 150)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi opis stylu.' });

		if (typeof tech_requirements == 'object')
		{
			/** @type {number[]} */
			const array = [];

			for (let i = 1; i <= 7; ++i)
				if (tech_requirements[i] == '1')
					array.push(1);

			tech_requirements = array;
		}
		else
			tech_requirements = [];

		if (tech_requirements_others !== null && tech_requirements_others.length > 250)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi opis innego sprzętu.' });

		if (typeof trigger_list == 'object')
		{
			/** @type {number[]} */
			const array = [];

			for (let i = 1; i <= 13; ++i)
				if (trigger_list[i] == '1')
					array.push(1);

			trigger_list = array;
		}
		else
			trigger_list = [];

		if (typeof accessability == 'object')
		{
			/** @type {number[]} */
			const array = [];

			for (let i = 1; i <= 8; ++i)
				if (accessability[i] == '1')
					array.push(1);

			accessability = array;
		}
		else
			accessability = [];

		if (typeof preference_time == 'object')
		{
			/** @type {number[]} */
			const array = [];

			for (let i = 1; i <= 7; ++i)
				if (preference_time[i] == '1')
					array.push(1);

			preference_time = array;
		}
		else
			preference_time = [];

		if (preferences_additional !== null && preferences_additional.length > 250)
			return JSON.stringify({ success: false, code: 400, message: 'Za długi opis dostępności czasowej.' });

		if (experience.length > 250)
			return JSON.stringify({ success: false, code: 400, message: 'Za długa wartość pola wartość pola \'Doświadczenie\'.' });

		if (organization.length > 50)
			return JSON.stringify({ success: false, code: 400, message: 'Za długa wartość pola wartość pola \'Organizacja\'.' });

		if (dis_panel_topics !== null && dis_panel_topics.length > 250)
			return JSON.stringify({ success: false, code: 400, message: 'Za długa wartość pola wartość pola \'Opis panelu dyskusyjnego\'.' });

		if (other_remarks.length > 250)
			return JSON.stringify({ success: false, code: 400, message: 'Za długa wartość pola wartość pola \'Dodatkowe uwagi\'.' });
	}

	const success = await SQL.transaction(
	[
		{
			statement:
			`
				INSERT INTO forms
				(
					user,
					cohorts,
					plain_cohorts,
					type,
					type_others,
					type_contest,
					duration,
					track,
					title,
					full_description,
					system,
					system_knowledge,
					beginners_friendly,
					age,
					num_players,
					style,
					style_description,
					tech_requirements,
					tech_requirements_others,
					trigger_list,
					accessability,
					preference_time,
					preferences_additional,
					previous_conventions,
					previous_conventions_which,
					experience,
					organization,
					dis_panel_question,
					dis_panel_topics,
					other_remarks
				)
				VALUES
				(
					:user,
					:cohorts,
					:plain_cohorts,
					:type,
					:type_others,
					:type_contest,
					:duration,
					:track,
					:title,
					:full_description,
					:system,
					:system_knowledge,
					:beginners_friendly,
					age,
					num_players,
					style,
					style_description,
					tech_requirements,
					tech_requirements_others,
					trigger_list,
					accessability,
					preference_time,
					preferences_additional,
					previous_conventions,
					previous_conventions_which,
					experience,
					organization,
					dis_panel_question,
					dis_panel_topics,
					other_remarks
				)
			`,
			params:
			{
				user,
				cohorts,
				plain_cohorts,
				type,
				type_others,
				type_contest,
				duration,
				track,
				title,
				full_description,
				system,
				system_knowledge,
				beginners_friendly,
				age,
				num_players,
				style,
				style_description,
				tech_requirements,
				tech_requirements_others,
				trigger_list,
				accessability,
				preference_time,
				preferences_additional,
				previous_conventions,
				previous_conventions_which,
				experience,
				organization,
				dis_panel_question,
				dis_panel_topics,
				other_remarks
			}
		},
		{
			statement: 'INSERT INTO logs (module, event, user) VALUES (:module, :event, :user)',
			params: { module: 'core', event: 'form_send', user }
		},
	]);

	if (!success)
		return JSON.stringify({ success: false, code: 500, message: '<mark>Backend/SQL</mark> Nie udało się wysłać formularza.' });

	return JSON.stringify(
	{
		success: true,
		message: 'Formularz został wysłany pomyślnie.'
	});
};