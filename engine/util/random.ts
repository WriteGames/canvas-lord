/* Canvas Lord v0.5.3 */

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
