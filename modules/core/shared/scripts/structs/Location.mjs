import Filename from '/core/shared/scripts/structs/Filename.mjs';

/**
	A URL without origin and hash, *ie* path and search only.

	Example:

	```ini
	# https://johndoe:letmein@example.com:2137/core/frontend/pages/main.html?page=42&lang=pl#answer
	```

	- `https://johndoe:letmein@example.com:2137` — URL origin
	- `/core/frontend/pages/main.html?page=42&lang=pl` — {@link Location `Location`}:
		>- `/core/frontend/pages/main.html` — URL path:
			>>- `core` — {@link Location.module `Location.module`}
			>>- `frontend` — {@link Location.layer `Location.layer`}
			>>- `/pages` — {@link Location.path `Location.path`}
			>>- `main.html` — {@link Location.filename `Location.filename`}
				>>>- `main` — {@link Filename.stem `Filename.stem`}
				>>>- `html` — {@link Filename.extension `Filename.extension`}
		>- `page=42&lang=pl` — {@link Location.params `Location.params`}
	- `answer` — URL fragment — {@link Location.params `Location.params`} — `document.location.hash` without a number sign (U+0023, `#`)
*/
export default class Location
{
	/**
		A module name.

		Origin:
		- The first URL path segment, without a leading slash.

		Value:
		- Regex:
			```js
			/[\p{L}\p{N}]+(?:[._-]?[\p{L}\p{N}]+){0,}/u
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
		- `core` in `/core/frontend/pages/main.html`

		@type {string}
	*/
	module;

	/**
		A module layer.

		Origin:
		- The second URL path segment, without a leading slash.

		Value:
		- Xeither `frontend`, `backend`, `api` xor `shared`.

		Example:
		- `frontend` in `/core/frontend/pages/main.html`

		@type {`${'front'|'back'}end`|'api'|'shared'}
	*/
	layer;

	/**
		A path from a layer to a file.

		Origin:
		- The URL path but the first two and the last segment.

		Value:
		- Regex:
			```js
			/(?:\/[\p{L}\p{N}]+(?:[._-]?[\p{L}\p{N}]+)*){0,}/u
			```

		Consists of any number of sequences of slash (U+002F, `/`) followed by one or more following characters:
		- alphanumeric:
			- letters (`\p{L}`)
			- numeric (`\p{N}`)
		- non-alphanumeric¹:
			- full stop (U+002E, `.`)
			- underscore (U+005F, `_`)
			- dash (U+002D, `-`)

		1. Non-alphanumeric characters must be both immediatelly preceded and immediatelly succedeed by alphanumeric characters.

		Example:
		- `/pages` in `/core/frontend/pages/main.html`

		@type {string}
	*/
	path;

	/**
		A location's filename.

		Origin:
		- The last URL path segment.

		@type {Filename}
	*/
	filename;

	/**
		Location params.

		Origin:
		- The URL query.

		Value:
		- Regex:
			```js
			/[^#]+/u
			```

		Example:
		- `page=42&lang=pl` in `/core/frontend/pages/main.html?page=42&lang=pl`

		@type {string?}
	*/
	params = null;

	constructor
	(
		/** @type {string} */ module,
		/** @type {`${'front'|'back'}end`|'api'|'shared'} */ layer,
		/** @type {string} */ path,
		/** @type {Filename} */ filename,
		/** @type {string?} */ params = null,
	)
	{
		this.module = module;
		this.layer = layer;
		this.path = path;
		this.filename = filename;
		this.params = params;
	}

	toString()
	{
		let string = `/${this.module}/${this.layer}${this.path}/${this.filename.stem}`;

		if (this.filename.extension !== null)
			string += `.${this.filename.extension}`;

		if (this.params !== null)
			string += `?${this.params}`;

		return string;
	}

	/**
		Constructs a {@link Location `Location`} from {@link string `string`} in the full form.

		@param {string} string
		One of the following:
		<br>

		-
			```js
			`/${module}/${layer}${path}/${filename}`
			```
		-
			```js
			`/${module}/${layer}${path}/${filename}?${params}`
			```
	*/
	static fromString(/** @type {string} */ string)
	{
		/**
			@type {{
				module: string,
				layer: `${'front'|'back'}end`|'api'|'shared',
				path: string,
				stem: string,
				extension?: string,
				params?: string,
			} | undefined}
		*/// @ts-ignore
		const match = string?.match(new RegExp
		(
				'^\\/(?<module>[\\p{L}\\p{N}]+(?:[._-]?[\\p{L}\\p{N}]+)*)'
			+	'\\/(?<layer>(?:front|back)end|api|shared)'
			+	'(?<path>(?:\\/[\\p{L}\\p{N}]+(?:[._-]?[\\p{L}\\p{N}]+)*)*)'
			+	'\\/(?<stem>[\\p{L}\\p{N}]+(?:[._-]?[\\p{L}\\p{N}]+)*?)'
			+	'(?:\\.(?<extension>[\\p{L}\\p{N}]+(?:[_-]?[\\p{L}\\p{N}]+)*))?'
			+	'(?:\\?(?<params>)[^#]*)?$'
			,	'u'
		))?.groups;

		if (match === undefined)
			return null;

		return new Location(match.module, match.layer, match.path, new Filename(match.stem, match.extension ?? null), match.params ?? null);
	}

	/**
		Constructs a {@link Location `Location`} from {@link string `string`} in the short form¹.
		1. The full form without the following, constant parts:

			<br>

			- layer: `frontend`
			- path: `/pages`
			- extension: `html`

			The short form is used to load pages into `body > main`.

		@param {string} string
		One of the following:
		<br>

		-
			```js
			`${module}/${filename.stem}`
			```
		-
			```js
			`${module}/${filename.stem}?${params}`
			```
	*/
	static fromShortString(string)
	{
		/**
			@type {{
				module: string,
				stem: string,
				params?: string,
			} | undefined}
		*/// @ts-ignore
		const match = string?.match(new RegExp
		(
				'^(?<module>[\\p{L}\\p{N}]+(?:[._-]?[\\p{L}\\p{N}]+)*)'
			+	'\\/(?<stem>[\\p{L}\\p{N}]+(?:[._-]?[\\p{L}\\p{N}]+)*?)'
			+	'(?:\\?(?<params>)[^#]*)?$'
			,	'u'
		))?.groups;

		if (match === undefined)
			return null;

		return new Location(match.module, 'frontend', '/pages', new Filename(match.stem, 'html'), match.params ?? null);
	}
}