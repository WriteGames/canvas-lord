/* Canvas Lord v0.6.1 */

export type GetDelegateCallback<T> = T extends Delegate<infer C> ? C : never;
export type GetDelegateParameters<T> = T extends Delegate<infer C>
	? Parameters<C>
	: never;
export type GetDelegateReturnType<T> = T extends Delegate<infer C>
	? ReturnType<C>
	: never;

export class Delegate<
	T extends (...args: P) => void = () => void,
	P extends [] = Parameters<T>,
> {
	#callbacks: T[];

	constructor() {
		this.#callbacks = [];
	}

	invoke(...args: P): void {
		this.#callbacks.forEach((callback) => callback(...args));
	}

	add(callback: T): void {
		this.#callbacks.push(callback);
	}

	remove(callback: T): void {
		const index = this.#callbacks.indexOf(callback);
		if (index < 0) return;
		this.#callbacks.splice(index, 1);
	}

	removeAll(): void {
		this.#callbacks.splice(0, this.#callbacks.length);
	}
}
