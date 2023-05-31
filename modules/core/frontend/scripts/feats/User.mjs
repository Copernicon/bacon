import Login from '/core/frontend/scripts/feats/Login.mjs';

/** The user data manager. */
export default class User
{
	/**
		The user's identifier if the user is logged in xor `null` otherwise.
		@type {number?}
	*/
	static #user = null;

	/**
		The user's login if the user is logged in xor `null` otherwise.
		@type {string?}
	*/
	static #login = null;

	/**
		The user's first name if the user is logged in xor `null` otherwise.
		@type {string?}
	*/
	static #firstName = null;

	/**
		The user's nick name if the user is logged in xor `null` otherwise.
		@type {string?}
	*/
	static #nickName = null;

	/**
		The user's last name if the user is logged in xor `null` otherwise.
		@type {string?}
	*/
	static #lastName = null;

	/**
		The user's logo address if the user is logged in xor `null` otherwise.
		@type {string?}
	*/
	static #logo = null;

	/** Gets the user's identifier if the user is logged in xor `null` otherwise. */
	static get user() { return User.#user; }

	/** Gets the user's login if the user is logged in xor `null` otherwise. */
	static get login() { return User.#login; }

	/** Gets the user's first name if the user is logged in xor `null` otherwise. */
	static get firstName() { return User.#firstName; }

	/** Gets the user's nick name if the user is logged in xor `null` otherwise. */
	static get nickName() { return User.#nickName; }

	/** Gets the user's last name if the user is logged in xor `null` otherwise. */
	static get lastName() { return User.#lastName; }

	/** Gets the user's logo address if the user is logged in xor `null` otherwise. */
	static get logo() { return User.#logo; }

	/**
		Gets the user's display name if the user is logged in xor `null` otherwise.

		The display name is based on the following data:
		- {@link login `login`}
		- {@link firstName `firstName`}
		- {@link nickName `nickName`}
		- {@link lastName `lastName`}

		Examples:
		- `Jan "Kowal" Kowalski`
		- `Jan Kowalski`
		- `Kowal`
		- `jan_kowalski_1337`
	*/
	static get displayName()
	{
		if ([User.#firstName, User.#lastName].includes(null))
			return User.#nickName ?? User.#login;

		if (User.#nickName === null)
			return `${User.#firstName} ${User.#lastName}`;

		return `${User.#firstName} "${User.#nickName}" ${User.#lastName}`;
	}

	static
	{
		Login.login.imp(User.#store);
		Login.logout.imp(User.#remove);
		Login.restore.imp(User.#load);
	}

	/** Loads the user session data from the {@link sessionStorage `sessionStorage`} to the {@link User `User`} members. */
	static #load()
	{
		User.#user = Number(sessionStorage.getItem('core/user/id'));
		User.#login = sessionStorage.getItem('core/user/login');
		User.#firstName = sessionStorage.getItem('core/user/first-name');
		User.#nickName = sessionStorage.getItem('core/user/nick-name');
		User.#lastName = sessionStorage.getItem('core/user/last-name');
		User.#logo = sessionStorage.getItem('core/user/logo');
	}

	/** Stores the user session data in both {@link User `User`} members and the {@link sessionStorage `sessionStorage`}. */
	static #store(/** @type {import('/core/frontend/scripts/feats/Login.mjs').LoginData} */ data)
	{
		User.#user = data.user;
		User.#login = data.login;
		User.#firstName = data.firstName;
		User.#nickName = data.nickName;
		User.#lastName = data.lastName;
		User.#logo = data.logo;

		sessionStorage.setItem('core/user/id', data.user.toString());
		sessionStorage.setItem('core/user/login', data.login);

		if (data.firstName)
			sessionStorage.setItem('core/user/first-name', data.firstName);

		if (data.nickName)
			sessionStorage.setItem('core/user/nick-name', data.nickName);

		if (data.lastName)
			sessionStorage.setItem('core/user/last-name', data.lastName);

		if (data.logo)
			sessionStorage.setItem('core/user/logo', data.logo);
	}

	/** Removes the user session data from both {@link User `User`} members and the {@link sessionStorage `sessionStorage`}. */
	static #remove()
	{
		User.#user = null;
		User.#login = null;
		User.#firstName = null;
		User.#nickName = null;
		User.#lastName = null;
		User.#logo = null;

		for (const key of ['id', 'login', 'first-name', 'nick-name', 'last-name', 'logo'])
			sessionStorage.removeItem(`core/user/${key}`);
	}
}