import Register from '/core/backend/scripts/classes/Register.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';

export default (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const action = String(data.action);

	switch (action)
	{
		case 'get methods':

			return getMethods();
	}

	return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowe zapytanie.' });
};

function getMethods()
{
	return JSON.stringify({ success: true, methods: Register.methods });
}