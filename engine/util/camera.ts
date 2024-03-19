import type { V2 } from './math';

export interface Camera {
	[0]: number;
	[1]: number;
}

export class Camera extends Array {
	constructor(x: V2[0], y: V2[1]) {
		super();
		this.push(x, y);
	}

	get x(): number {
		return this[0];
	}
	set x(val) {
		this[0] = val;
	}

	get y(): number {
		return this[1];
	}
	set y(val) {
		this[1] = val;
	}
}
