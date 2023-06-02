import child_process from 'node:child_process';
import os from 'node:os';
import Module from '/core/backend/scripts/bases/Module.mjs';
import Login from '/core/backend/scripts/classes/Login.mjs';
import Register from '/core/backend/scripts/classes/Register.mjs';
import Resources from '/core/backend/scripts/classes/Resources.mjs';
import googleData from '/sign-with-google/shared/data/google.json' assert { type: 'json' };
import app from '/core/shared/data/app.json' assert { type: 'json' };
import server from '/core/backend/data/server.json' assert { type: 'json' };
import pkg from '^/package.json' assert { type: 'json' };

export default class SignWithGoogle extends Module
{
	constructor()
	{
		super();

		this.start.imp(SignWithGoogle.#installDependencies);
		this.start.imp(SignWithGoogle.#start);
	}

	static #installDependencies()
	{
		const dependencies = ['googleapis'];

		/** @type {string[]} */
		const dependenciesToInstall = [];

		for (const dependency of dependencies) // @ts-ignore
			if (pkg.dependencies[dependency] === undefined)
				dependenciesToInstall.push(dependency);

		if (dependenciesToInstall.length == 0)
			return;

		child_process.execSync(`npm i ${dependenciesToInstall.join(' ')}`, { stdio: []});

		if (os.platform() == 'win32')
			child_process.execSync(`title ${app.name}`, { stdio: []});
	}

	static #start()
	{
		SignWithGoogle.#addScripts();
		SignWithGoogle.#addRegisterMethods();
		SignWithGoogle.#addLoginMethods();
	}

	static #addScripts()
	{
		Resources.addScript('/sign-with-google/frontend/scripts/feats/SignWithGoogle.mjs');
	}

	static #addRegisterMethods()
	{
		Register.addMethod(
		{
			name: 'Google',
			logo: '/sign-with-google/frontend/icons/external/google.80.svg',
			target: SignWithGoogle.#getGoogleSignURL('register')
		});
	}

	static #addLoginMethods()
	{
		Login.addMethod(
		{
			name: 'Google',
			logo: '/sign-with-google/frontend/icons/external/google.80.svg',
			pages: {
				login: SignWithGoogle.#getGoogleSignURL('login'),
				add: SignWithGoogle.#getGoogleSignURL('add'),
				remove: 'sign-with-google/remove-google',
			},
			API: '/sign-with-google/api/v0/login-google',
		});
	}

	static #getGoogleSignURL(/** @type {'login'|'register'|'add'} */ endpoint)
	{
		const scopes =
		[
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile',
		];

		const origin =
		(
				server.https.enabled
			?	`https://${server.https.host}:${server.https.port}`
			:	`http://${server.http.host}:${server.http.port}`
		);

		const url =
		(
				'https://accounts.google.com/o/oauth2/v2/auth'
			+	`?client_id=${googleData.clientID}`
			+	`&redirect_uri=${origin}/sign-with-google/${endpoint}-google`
			+	`&scope=${scopes.join(' ')}`
			+	'&include_granted_scopes=true'
			+	'&response_type=code'
			+	'&access_type=offline'
		);

		return url;
	}
}