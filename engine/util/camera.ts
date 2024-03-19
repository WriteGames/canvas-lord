import type { V2 } from './math';

export class Camera extends Array {
	constructor(x: V2[0], y: V2[1]) {
		super();
		this.push(x, y);
	}

	get x(): number {
		return this[0] as number;
	}
	set x(val) {
		this[0] = val;
	}

	get y(): number {
		return this[1] as number;
	}
	set y(val) {
		this[1] = val;
	}
}
