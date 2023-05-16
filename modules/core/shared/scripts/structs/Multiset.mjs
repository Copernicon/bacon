/**
	A set that allows multiple instances of its elements.
	@template T
*/
export default class Multiset
{
	#id = 0;
	#size = 0;

	/** @type {Object.<number, T>} */
	#data = {};

	get id() { return this.#id; }
	get size() { return this.#size; }
	get data() { return this.#data; }

	get(/** @type {number} */ id)
	{
		return this.#data[id];
	}

	insert(/** @type {T} */ data)
	{
		++this.#size;
		this.#data[this.#id++] = data;
	}

	remove(/** @type {number} */ id)
	{
		--this.#size;
		delete this.#data[id];
	}
}