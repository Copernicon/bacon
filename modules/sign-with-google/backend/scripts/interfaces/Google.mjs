import google from 'googleapis';
import server from '/core/backend/data/server.json' assert { type: 'json' };
import googleSharedData from '/sign-with-google/shared/data/google.json' assert { type: 'json' };
import googleBackendData from '/sign-with-google/backend/data/google.json' assert { type: 'json' };

export default class Google
{
	/**
		Validates a *Google Sign In* code.

		@param {string} code
		The *Google Sign In* code to validate.
	*/
	static async validateCode(code)
	{
		const link =
		(
				server.https.enabled
			?	`https://${server.https.host}:${server.https.port}/sign-with-google/register-google`
			:	`http://${server.http.host}:${server.http.port}/sign-with-google/register-google`
		);

		const client = new google.Auth.OAuth2Client(
		{
			clientId: googleSharedData.clientID,
			clientSecret: googleBackendData.clientSecret,
			redirectUri: link
		});

		const token = await client.getToken(code);

		if (token.res?.statusText != 'OK')
			return false;

		if (typeof token.tokens.access_token != 'string')
			return false;

		const path = 'https://www.googleapis.com/oauth2/v2/userinfo';
		const file = await fetch(path, { method: 'GET', headers: { Authorization: `Bearer ${token.tokens.access_token}` }}).catch(() => {});
		const response = await file?.json().catch(() => {});

		if (response?.verified_email !== true)
			return false;

		const email = String(response.email).substring(0, 128);
		const firstName = String(response.given_name).substring(0, 64);
		const lastName = String(response.family_name).substring(0, 64);
		const logo = String(response.picture).substring(0, 192);
		const id = String(response.id).substring(0, 128);

		return { email, first_name: firstName, last_name: lastName, logo, id };
	}
}