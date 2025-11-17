import { describe, expect, test } from 'vitest';
import { Vec2, isWithinBounds } from './index.js';

describe('isWithinBounds()', () => {
	describe('2d', () => {
		const p1 = new Vec2(-100, -80);
		const p2 = new Vec2(78, 37);

		const xPos = [p1.x - 1, p1.x, 0, p2.x - 1, p2.x];
		const yPos = [p1.y - 1, p1.y, 0, p2.y - 1, p2.y];

		yPos.forEach((y, yi) => {
			xPos.forEach((x, xi) => {
				const expected = Math.abs(yi - 2) <= 1 && Math.abs(xi - 2) <= 1;
				test(`(${x}, ${y}) should ${expected ? 'be' : 'not be'} in bounds`, () => {
					expect(isWithinBounds(new Vec2(x, y), p1, p2)).toEqual(
						expected,
					);
				});
			});
		});
	});
});
