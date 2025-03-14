export class Delegate<
	T extends unknown[],
	C extends (...args: T) => void = (...args: T) => void,
> {
	#callbacks: C[];

	constructor() {
		this.#callbacks = [];
	}

	invoke(...args: T): void {
		this.#callbacks.forEach((callback) => callback(...args));
	}

	add(callback: C): void {
		this.#callbacks.push(callback);
	}

	remove(callback: C): void {
		const index = this.#callbacks.indexOf(callback);
		if (index < 0) return;
		this.#callbacks.splice(index, 1);
	}

	removeAll(): void {
		this.#callbacks.splice(0, this.#callbacks.length);
	}
}
