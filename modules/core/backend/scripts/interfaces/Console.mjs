import colors from 'colors';

/**
	Common {@link console `console`} wrappers.

	Dependency:
	- {@link colors `colors`}
*/
export default class Console
{
	static
	{
		colors.enable();
	}

	/** Adds a yellow upper-case title log entry to the {@link Console `Console`} using {@link console.log `console.log`}. */
	static title(/** @type {string} */ message, /** @type {...*} */ ...params)
	{
		console.log(`\n\t${message.toUpperCase().yellow}\n`, ...params);
	}

	/** Adds a white regular log entry to the {@link Console `Console`} using {@link console.log `console.log`}. */
	static log(/** @type {string} */ message, /** @type {...*} */ ...params)
	{
		console.log(`   ${'['.gray}${'I'.cyan}${']'.gray}\t${message}`, ...params);
	}

	/** Adds a gray information log entry to the {@link Console `Console`} using {@link console.log `console.log`}. */
	static info(/** @type {string} */ message, /** @type {...*} */ ...params)
	{
		console.log(`\t${message.gray}`, ...params);
	}

	/** Adds a yellow warning log entry to the {@link Console `Console`} using {@link console.log `console.warn`}. */
	static warn(/** @type {string} */ message, /** @type {...*} */ ...params)
	{
		console.warn(`   ${'['.gray}${'W'.yellow}${']'.gray}\t${message.yellow.bold}`, ...params);
	}

	/** Adds a red error log entry to the {@link Console `Console`} using {@link console.log `console.error`}. */
	static error(/** @type {string} */ message, /** @type {...*} */ ...params)
	{
		console.error(`   ${'['.gray}${'E'.red.bold}${']'.gray}\t${message.red}`, ...params);
	}

	/** Adds a red fatal error log entry to the {@link Console `Console`} using {@link console.log `console.error`}. */
	static fatal(/** @type {string} */ message, /** @type {...*} */ ...params)
	{
		console.error(`   ${'['.gray}${'F'.red}${']'.gray}\t${message.bgRed.white}`, ...params);
	}

	/** Adds a green success log entry to the {@link Console `Console`} using {@link console.log `console.log`}. */
	static ok(/** @type {string} */ message, /** @type {...*} */ ...params)
	{
		console.log(`   ${'['.gray}${'S'.green.bold}${']'.gray}\t${message.green}`, ...params);
	}

	/** Goto a new line in the {@link Console `Console`}. */
	static nl()
	{
		console.log();
	}
}