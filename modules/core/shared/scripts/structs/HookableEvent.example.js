import HookableEvent from '/core/shared/scripts/structs/HookableEvent.mjs';

/**
	@typedef {{
		type: string,
		value: number
	}} Damage
*/

class Entity
{
	#hp = 100;
	#dead = false;

	/** @type {HookableEvent<[Damage]>} */
	takeDamage = new HookableEvent();

	/** @type {HookableEvent<[]>} */
	die = new HookableEvent();

	constructor()
	{
		// Don't take damage if dead.
		this.takeDamage.pro(() => this.#dead);

		// Implement taking damage.
		this.takeDamage.imp(damage =>
		{
			this.#hp = Math.max(this.#hp - Math.max(damage.value, 0), 0);

			// Die if dropped to 0 hp.
			if (this.#hp == 0)
				this.die.run();
		});

		this.takeDamage.post(damage => void console.log(`You took ${damage.value} ${damage.type} damage. You have ${this.#hp} HP left.`));
	}
}

const player = new Entity();
class Buff
{
	/** @type {number?} */
	#initialDamageValue = null;

	constructor()
	{
		// Cache initial damage taken value.
		player.takeDamage.pre(damage => void (this.#initialDamageValue = damage.value));

		// Reduce damage taken by 10% of initial value.
		player.takeDamage.pen(damage =>
		{
			if (this.#initialDamageValue)
				damage.value -= this.#initialDamageValue / 10;
		});
	}
}

[...new Array(2)].map(() => new Buff());
player.takeDamage.run({ type: 'chaos', value: 100 });
// > 'You took 80 chaos damage. You have 20 HP left.'