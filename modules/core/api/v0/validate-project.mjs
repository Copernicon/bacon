import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
import Projects from '/core/backend/scripts/interfaces/Projects.mjs';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

export default async (/** @type {string} */ json) =>
{
	const data = noexcept(JSON.parse)(json);
	const token = String(data.token);
	const project = Number(data.project);

	// validate user data
	{
		if (token.length != server.tokenSize)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy żeton uwierzytelniający.' });

		if (!Number.isInteger(project) || project < 0)
			return JSON.stringify({ success: false, code: 400, message: 'Nieprawidłowy identyfikator projektu.' });
	}

	const user = await Permissions.getUserByToken(token);

	if (user === null)
		return JSON.stringify({ success: false, code: 401, message: 'Tożsamość zweryfikowana negatywnie.' });

	const userProject = await Projects.getUserProject(user, project);

	if (userProject === null)
		return JSON.stringify({ success: true, valid: false });

	return JSON.stringify({ success: true, valid: true, name: userProject.name, logo: userProject.logo });
};