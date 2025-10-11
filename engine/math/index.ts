/* Canvas Lord v0.6.1 */

import type { Vec2 } from './vectors';

export * from './vectors';

export const EPSILON = 0.000001;

declare global {
	interface Math {
		clamp: (val: number, min: number, max: number) => number;
		lerp: (a: number, b: number, t: number) => number;
	}
}

// Math prototype fun :~)
if (typeof Math.clamp === 'undefined') {
	Math.clamp = (val, min, max) => {
		if (val < min) return min;
		if (val > max) return max;
		return val;
	};
}

if (typeof Math.lerp === 'undefined') {
	Math.lerp = (a, b, t) => {
		return t * (b - a) + a;
	};
}

export type Line2D = [Vec2, Vec2];
