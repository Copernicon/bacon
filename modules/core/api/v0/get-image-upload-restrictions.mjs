import Permissions from '/core/backend/scripts/interfaces/Permissions.mjs';
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

	const extensions = Object.keys(server.uploadImgExtensions);

	return JSON.stringify({ success: true, 'max-upload-size': server.maxUploadSize, extensions });
};