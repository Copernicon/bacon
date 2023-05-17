import fs from 'node:fs';
import cryptoRandomString from 'crypto-random-string';
import noexcept from '/core/shared/scripts/utils/noexcept.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

/** End-user permissions related functions. */
export default class Uploads
{
	/**
		Uploads a file to the server.

		@param {string} file Base64 encoded file data.
		@param {string} extension The file extension.

		@return
		An URL to the uploaded file xor `null` if the upload failed.
	*/
	static upload(file, extension)
	{
		const date = new Date();
		const year = String(date.getFullYear()).padStart(4, '0');
		const month = String(date.getMonth()).padStart(2, '0');
		const relativePath = `/${year}/${month}`;
		const absolutePath = `${fs.realpathSync('./uploads')}${relativePath}`;

		if (!fs.existsSync(absolutePath))
		{
			const success = noexcept(fs.mkdirSync)(absolutePath, { recursive: true });

			if (success === null)
				return null;
		}

		const stem = cryptoRandomString({ length: server.tokenSize, type: 'alphanumeric' });
		const fileName = `${stem}.${extension}`;
		const filePath = `${absolutePath}/${fileName}`;

		const success = noexcept(fs.writeFileSync)(filePath, file.replace(/^.*?,/u, ''), 'base64');

		if (success === null)
			return null;

		return `/uploads${relativePath}/${fileName}`;
	}
}