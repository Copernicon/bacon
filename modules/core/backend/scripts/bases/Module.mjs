import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';

/** Base class for modules. */
export default class Module
{
	/** Indicates if the module is loaded. */
	#loaded = false;

	/** Indicates if the module is started. */
	#started = false;

	/** Checks if the module is loaded. */
	get loaded() { return this.#loaded; }

	/** Checks if the module is started. */
	get started() { return this.#started; }

	/**
		Loads the module.

		Related event:
		- {@link unload `unload`}

		@type {HookableEvent<[]>}
	*/
	load = new HookableEvent();

	/**
		Unloads the module.

		Related event:
		- {@link load `load`}

		@type {HookableEvent<[]>}
	*/
	unload = new HookableEvent();

	/**
		Starts the module.

		Related event:
		- {@link stop `stop`}

		@type {HookableEvent<[]>}
	*/
	start = new HookableEvent();

	/**
		Stops the module.

		Related event:
		- {@link start `start`}

		@type {HookableEvent<[]>}
	*/
	stop = new HookableEvent();

	constructor()
	{
		if (new.target === Module)
			throw new Error('Class \'Module\' is a base class, cannot be initialized directly.');

		this.load.pro(() => this.#loaded);
		this.load.post(() => void (this.#loaded = true));

		this.unload.pro(() => !this.#loaded);
		this.unload.post(() => void (this.#loaded = false));

		this.start.pro(() => this.#started);
		this.start.post(() => void (this.#started = true));

		this.stop.pro(() => !this.#started);
		this.stop.post(() => void (this.#started = false));
	}
}