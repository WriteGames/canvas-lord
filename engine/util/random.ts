/* Canvas Lord v0.6.1 */

const xorShift32 = (random: Random): number => {
	let x = random.seed;
	x ^= x << 13;
	x ^= x >>> 17;
	x ^= x << 5;
	return (random.seed = x >>> 0);
};

export interface Random {
	seed: number;
}

export class Random {
	constructor(seed: number = Date.now()) {
		this.seed = seed;
	}

	#next(): number {
		return Number(xorShift32(this) / 0xffffffff);
	}

	float(n: number): number {
		return this.#next() * n;
	}

	chance(n: number, max: number): boolean {
		return this.#next() < n / max;
	}

	int(n: number): number {
		return Math.floor(this.#next() * n);
	}

	range(a: number, b: number): number {
		return this.float(b - a) + a;
	}

	bool(): boolean {
		return this.int(2) > 0;
	}

	sign(): 1 | -1 {
		return this.bool() ? 1 : -1;
	}

	angle(): number {
		return this.float(360);
	}

	choose<T>(items: T[]): T {
		return items[this.int(items.length)];
	}
}

declare global {
	interface Array<T> {
		shuffle: (random?: Random) => this;
		toShuffled: (random?: Random) => T[];
	}
}

declare global {
	interface Array<T> {
		remove(): T[];
	}
}

const defaultRandom = new Random();

// Array prototype fun :~)
if (typeof Array.prototype.shuffle === 'undefined') {
	Array.prototype.shuffle = function shuffle<T>(
		this: T[],
		random: Random = defaultRandom,
	): T[] {
		let m = this.length;
		let t: T;
		let i: number;
		while (m) {
			i = random.int(m--);

			t = this[m];
			this[m] = this[i];
			this[i] = t;
		}

		return this;
	};
}

if (typeof Array.prototype.toShuffled === 'undefined') {
	Array.prototype.toShuffled = function toShuffle<T>(
		this: T[],
		random: Random = defaultRandom,
	): T[] {
		const newArr = [...this];
		return newArr.shuffle(random);
	};
}
