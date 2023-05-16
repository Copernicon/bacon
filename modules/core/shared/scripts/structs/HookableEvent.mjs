import Multiset from '/core/shared/scripts/structs/Multiset.mjs';

/**
	@template {*[]} DataTypes
	@typedef {(...data: Readonly<DataTypes>) => boolean | Promise<boolean>} ProHook
	A hook run before an event that can suppress it returning `true`.

	Related struct:
	- {@link HookableEvent `HookableEvent`}

	Related types:
	- {@link PreHook `PreHook`}
	- {@link PenHook `PenHook`}
	- {@link Implementation `Implementation`}
	- {@link PostHook `PostHook`}

*//**

	@template {*[]} DataTypes
	@typedef {(...data: Readonly<DataTypes>) => void | Promise<void>} PreHook
	A hook run before an event that can view it's old data.

	Related struct:
	- {@link HookableEvent `HookableEvent`}

	Related types:
	- {@link ProHook `ProHook`}
	- {@link PenHook `PenHook`}
	- {@link Implementation `Implementation`}
	- {@link PostHook `PostHook`}

*//**

	@template {*[]} DataTypes
	@typedef {(...data: DataTypes) => void | Promise<void>} PenHook
	A hook run before an event that can edit it's data.

	Related struct:
	- {@link HookableEvent `HookableEvent`}

	Related types:
	- {@link ProHook `ProHook`}
	- {@link PreHook `PreHook`}
	- {@link Implementation `Implementation`}
	- {@link PostHook `PostHook`}

*//**

	@template {*[]} DataTypes
	@typedef {(...data: Readonly<DataTypes>) => void | Promise<void>} Implementation
	A hook run during an event that implements it.

	Related struct:
	- {@link HookableEvent `HookableEvent`}

	Related types:
	- {@link ProHook `ProHook`}
	- {@link PreHook `PreHook`}
	- {@link PenHook `PenHook`}
	- {@link PostHook `PostHook`}

*//**

	@template {*[]} DataTypes
	@typedef {(...data: Readonly<DataTypes>) => void | Promise<void>} PostHook
	A hook run after an event that can view it's new data.

	Related struct:
	- {@link HookableEvent `HookableEvent`}

	Related types:
	- {@link ProHook `ProHook`}
	- {@link PreHook `PreHook`}
	- {@link PenHook `PenHook`}
	- {@link Implementation `Implementation`}
*/
export {};

/**
	A hookable event that can be suppressed and its data can be edited.

	Related types:
	- {@link ProHook `ProHook`}
	- {@link PreHook `PreHook`}
	- {@link PenHook `PenHook`}
	- {@link Implementation `Implementation`}
	- {@link PostHook `PostHook`}

	@see [HookableEvent.example.js](HookableEvent.example.js)
	@template {*[]} DataTypes
*/
export default class HookableEvent
{
	/** @type {Multiset<ProHook<DataTypes>>} */
	#proHooks = new Multiset();

	/** @type {Multiset<PreHook<DataTypes>>} */
	#preHooks = new Multiset();

	/** @type {Multiset<PenHook<DataTypes>>} */
	#penHooks = new Multiset();

	/** @type {Multiset<Implementation<DataTypes>>} */
	#implementations = new Multiset();

	/** @type {Multiset<PostHook<DataTypes>>} */
	#postHooks = new Multiset();

	/**
		Adds a hook run before an event that can suppress it returning `true`.

		Note:
		- If {@link ProHook `ProHook`} will return `true`, an event shall be immediatelly suppressed
		(and neither {@link PreHook `PreHook`}s, {@link PenHook `PenHook`}s, {@link PostHook `PostHook`}s,
		{@link Implementation `Implementation`}s nor even other {@link ProHook `ProHook`}s shall be called).

		Aliases:
		- {@link addProHook `addProHook`}
		- {@link pro `pro`}

		Related events:
		- {@link addPreHook `addPreHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addImplementation `addImplementation`}
		- {@link addPostHook `addPostHook`}
		- {@link removeProHook `removeProHook`}
	*/
	addProHook(/** @type {ProHook<DataTypes>} */ proHook)
	{
		this.#proHooks.insert(proHook);
	}

	/**
		Adds a hook run before an event that can view it's old data.

		Aliases:
		- {@link addPreHook `addPreHook`}
		- {@link pre `pre`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addImplementation `addImplementation`}
		- {@link addPostHook `addPostHook`}
		- {@link removePreHook `removePreHook`}
	*/
	addPreHook(/** @type {PreHook<DataTypes>} */ preHook)
	{
		this.#preHooks.insert(preHook);
	}

	/**
		Adds a hook run before an event that can edit it's data.

		Aliases:
		- {@link addPenHook `addPenHook`}
		- {@link pen `pen`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPreHook `addPreHook`}
		- {@link addImplementation `addImplementation`}
		- {@link addPostHook `addPostHook`}
		- {@link removePenHook `removePenHook`}
	*/
	addPenHook(/** @type {PenHook<DataTypes>} */ penHook)
	{
		this.#penHooks.insert(penHook);
	}

	/**
		Adds a hook run during an event that implements it.

		Aliases:
		- {@link addImplementation `addImplementation`}
		- {@link imp `imp`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPreHook `addPreHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addPostHook `addPostHook`}
		- {@link removeImplementation `removeImplementation`}
	*/
	addImplementation(/** @type {Implementation<DataTypes>} */ implementation)
	{
		this.#implementations.insert(implementation);
	}

	/**
		Adds a hook run after an event that can view it's new data.

		Aliases:
		- {@link addPostHook `addPostHook`}
		- {@link post `post`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPreHook `addPreHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addImplementation `addImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	addPostHook(/** @type {PostHook<DataTypes>} */ postHook)
	{
		this.#postHooks.insert(postHook);
	}

	/**
		Removes a hook run before an event that can suppress it returning `true`.

		Aliases:
		- {@link removeProHook `removeProHook`}
		- {@link depro `depro`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removeImplementation `removeImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	removeProHook(/** @type {number} */ id)
	{
		this.#proHooks.remove(id);
	}

	/**
		Removes a hook run before an event that can view it's old data.

		Aliases:
		- {@link removePreHook `removePreHook`}
		- {@link depre `depre`}

		Related events:
		- {@link addPreHook `addPreHook`}
		- {@link removeProHook `removeProHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removeImplementation `removeImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	removePreHook(/** @type {number} */ id)
	{
		this.#preHooks.remove(id);
	}

	/**
		Removes a hook run before an event that can edit it's data.

		Aliases:
		- {@link removePenHook `removePenHook`}
		- {@link depen `depen`}

		Related events:
		- {@link addPenHook `addPenHook`}
		- {@link removeProHook `removeProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removeImplementation `removeImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	removePenHook(/** @type {number} */ id)
	{
		this.#penHooks.remove(id);
	}

	/**
		Removes a hook run during an event that implements it.

		Aliases:
		- {@link removeImplementation `removeImplementation`}
		- {@link deimp `deimp`}

		Related events:
		- {@link addImplementation `addImplementation`}
		- {@link removeProHook `removeProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removePostHook `removePostHook`}
	*/
	removeImplementation(/** @type {number} */ id)
	{
		this.#implementations.remove(id);
	}

	/**
		Removes a hook run after an event that can view it's new data.

		Aliases:
		- {@link removePostHook `removePostHook`}
		- {@link depost `depost`}

		Related events:
		- {@link addPostHook `addPostHook`}
		- {@link removeProHook `removeProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removeImplementation `removeImplementation`}
	*/
	removePostHook(/** @type {number} */ id)
	{
		this.#postHooks.remove(id);
	}

	/**
		Invokes an event that can be suppressed and its data can be edited.

		Aliases:
		- {@link invoke `invoke`}
		- {@link run `run`}
	*/
	async invoke(/** @type {DataTypes} */ ...data)
	{
		for (const proHook of Object.values(this.#proHooks.data))
			if (await proHook(...data))
				return;

		for (const preHook of Object.values(this.#preHooks.data))
			await preHook(...data);

		for (const penHook of Object.values(this.#penHooks.data))
			await penHook(...data);

		for (const implementation of Object.values(this.#implementations.data))
			await implementation(...data);

		for (const postHook of Object.values(this.#postHooks.data))
			await postHook(...data);
	}

	/**
		Adds a hook run before an event that can suppress it returning `true`.

		Note:
		- If {@link ProHook `ProHook`} will return `true`, an event shall be immediatelly suppressed
		(and neither {@link PreHook `PreHook`}s, {@link PenHook `PenHook`}s, {@link PostHook `PostHook`}s,
		{@link Implementation `Implementation`}s nor even other {@link ProHook `ProHook`}s shall be called).

		Aliases:
		- {@link addProHook `addProHook`}
		- {@link pro `pro`}

		Related events:
		- {@link addPreHook `addPreHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addImplementation `addImplementation`}
		- {@link addPostHook `addPostHook`}
		- {@link removeProHook `removeProHook`}
	*/
	pro = this.addProHook;

	/**
		Adds a hook run before an event that can view it's old data.

		Aliases:
		- {@link addPreHook `addPreHook`}
		- {@link pre `pre`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addImplementation `addImplementation`}
		- {@link addPostHook `addPostHook`}
		- {@link removePreHook `removePreHook`}
	*/
	pre = this.addPreHook;

	/**
		Adds a hook run before an event that can edit it's data.

		Aliases:
		- {@link addPenHook `addPenHook`}
		- {@link pen `pen`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPreHook `addPreHook`}
		- {@link addImplementation `addImplementation`}
		- {@link addPostHook `addPostHook`}
		- {@link removePenHook `removePenHook`}
	*/
	pen = this.addPenHook;

	/**
		Adds a hook run during an event that implements it.

		Aliases:
		- {@link addImplementation `addImplementation`}
		- {@link imp `imp`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPreHook `addPreHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addPostHook `addPostHook`}
		- {@link removeImplementation `removeImplementation`}
	*/
	imp = this.addImplementation;

	/**
		Adds a hook run after an event that can view it's new data.

		Aliases:
		- {@link addPostHook `addPostHook`}
		- {@link post `post`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link addPreHook `addPreHook`}
		- {@link addPenHook `addPenHook`}
		- {@link addImplementation `addImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	post = this.addPostHook;

	/**
		Removes a hook run before an event that can suppress it returning `true`.

		Aliases:
		- {@link removeProHook `removeProHook`}
		- {@link depro `depro`}

		Related events:
		- {@link addProHook `addProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removeImplementation `removeImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	depro = this.removeProHook;

	/**
		Removes a hook run before an event that can view it's old data.

		Aliases:
		- {@link removePreHook `removePreHook`}
		- {@link depre `depre`}

		Related events:
		- {@link addPreHook `addPreHook`}
		- {@link removeProHook `removeProHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removeImplementation `removeImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	depre = this.removePreHook;

	/**
		Removes a hook run before an event that can edit it's data.

		Aliases:
		- {@link removePenHook `removePenHook`}
		- {@link depen `depen`}

		Related events:
		- {@link addPenHook `addPenHook`}
		- {@link removeProHook `removeProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removeImplementation `removeImplementation`}
		- {@link removePostHook `removePostHook`}
	*/
	depen = this.removePenHook;

	/**
		Removes a hook run during an event that implements it.

		Aliases:
		- {@link removeImplementation `removeImplementation`}
		- {@link deimp `deimp`}

		Related events:
		- {@link addImplementation `addImplementation`}
		- {@link removeProHook `removeProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removePostHook `removePostHook`}
	*/
	deimp = this.removeImplementation;

	/**
		Removes a hook run after an event that can view it's new data.

		Aliases:
		- {@link removePostHook `removePostHook`}
		- {@link depost `depost`}

		Related events:
		- {@link addPostHook `addPostHook`}
		- {@link removeProHook `removeProHook`}
		- {@link removePreHook `removePreHook`}
		- {@link removePenHook `removePenHook`}
		- {@link removeImplementation `removeImplementation`}
	*/
	depost = this.removePostHook;

	/**
		Invokes an event that can be suppressed and its data can be edited.

		Aliases:
		- {@link invoke `invoke`}
		- {@link run `run`}
	*/
	run = this.invoke;
}