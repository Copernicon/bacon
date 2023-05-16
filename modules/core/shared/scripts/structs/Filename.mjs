export default class Filename
{
	/**
		A filename's stem.

		Origin:
		- The name until the last full stop (U+002E, `.`).

		Value:
		- Regex:
			```js
			/[\p{L}\p{N}]+(?:[._-]?[\p{L}\p{N}]+)*?/u
			```

		Consists of one or more following characters:
		- alphanumeric:
			- letters (`\p{L}`)
			- numeric (`\p{N}`)
		- non-alphanumeric¹:
			- full stop (U+002E, `.`)
			- underscore (U+005F, `_`)
			- dash (U+002D, `-`)

		1. Non-alphanumeric characters must be both immediatelly preceded and immediatelly succedeed by alphanumeric characters.

		Example:
		- `main.cfg` in `main.cfg.bak`

		@type {string}
	*/
	stem;

	/**
		A filename's extension.

		Origin:
		- The name after the last full stop (U+002E, `.`).

		Value:
		- Regex:
			```js
			/[\p{L}\p{N}]+(?:[_-]?[\p{L}\p{N}]+){0,}/u
			```

		Consists of one or more following characters:
		- alphanumeric:
			- letters (`\p{L}`)
			- numeric (`\p{N}`)
		- non-alphanumeric¹:
			- underscore (U+005F, `_`)
			- dash (U+002D, `-`)

		1. Non-alphanumeric characters must be both immediatelly preceded and immediatelly succedeed by alphanumeric characters.

		Example:
		- `bak` in `main.cfg.bak`

		@type {string?}
	*/
	extension = null;

	constructor
	(
		/** @type {string} */ stem,
		/** @type {string?} */ extension = null
	)
	{
		this.stem = stem;
		this.extension = extension;
	}

	toString()
	{
		let string = this.stem;

		if (this.extension !== null)
			string += '.' + this.extension;

		return string;
	}

	static fromString(/** @type {string} */ string)
	{
		return new Filename(...string.split(/\.(?!.*\.)/u));
	}
}