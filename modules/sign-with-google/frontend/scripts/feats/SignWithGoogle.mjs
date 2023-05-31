import Forms from '/core/frontend/scripts/feats/Forms.mjs';
import Login from '/core/frontend/scripts/feats/Login.mjs';

export default class SignWithGoogle
{
	static
	{
		Forms.response.post(SignWithGoogle.#postFormResponse);
	}

	static #postFormResponse(/** @type {import('/core/frontend/scripts/feats/Forms.mjs').FormsResponse} */ response)
	{
		if (response.id != 'sign-with-google/login-google')
			return;

		if (typeof response.json.token != 'string')
			return;

		Login.login.run({
			token: response.json.token,
			expiration: new Date(response.json.expiration),
			user: response.json.user,
			login: response.json.login,
			firstName: response.json.first_name ?? null,
			nickName: response.json.nick_name ?? null,
			lastName: response.json.last_name ?? null,
			logo: response.json.logo ?? null,
		});
	}
}