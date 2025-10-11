import {
	addPos,
	subPos,
	scalePos,
	posEqual,
	addScalar,
	equal,
	Vec2,
} from './index.js';
import { describe, expect, test } from 'vitest';
import { isWithinBounds } from './misc.js';

// move to setupTests.ts using expect.extend
const expectVec2Equal = (received: Vec2, expected: Vec2 | number[]): void => {
	expect(received).toHaveLength(expected.length);
	expect([...received]).toEqual([...expected]);
};

describe('(Vec) Vector operations', () => {
	describe('getter/setters work as intended', () => {
		test('get x/y/[0]/[1]', () => {
			const X = 13;
			const Y = 27;
			const a = new Vec2(X, Y);
			expect(a.x).toEqual(X);
			expect(a[0]).toEqual(X);
			expect(a.y).toEqual(Y);
			expect(a[1]).toEqual(Y);
		});

		test('set x/y/[0]/[1]', () => {
			const X = 13;
			const Y = 27;
			const a = new Vec2(0, 0);
			a.x = X;
			expect(a.x).toEqual(X);
			a[0] = -X;
			expect(a[0]).toEqual(-X);
			a.y = Y;
			expect(a.y).toEqual(Y);
			a[1] = -Y;
			expect(a[1]).toEqual(-Y);
		});
	});

	test('test iterator', () => {
		const X = 5;
		const Y = 7;
		expect([...new Vec2(X, Y)]).toEqual([X, Y]);
	});

	test('clone', () => {
		const a = new Vec2(5, 7);
		const b = a.clone();
		expect(a === b).toEqual(false);
		expectVec2Equal(a, b);
	});

	describe('Vector & Vector', () => {
		describe('addPos(a, b)', () => {
			describe('when a & b are both the same length', () => {
				test('V2 + V2 should result in a V2 sum', () => {
					const a = new Vec2(4, 5);
					const b = new Vec2(0, 1);

					expectVec2Equal(a.add(b), [4, 6]);
					// expectVec2Equal(Vec2.add(a, b), [4, 6]);
				});

				test.skip('V3 + V3 should result in a V3 sum', () => {
					const sum = addPos([4, 5, 6], [0, 1, 2]);
					expect(sum).toHaveLength(3);
					expect(sum).toEqual([4, 6, 8]);
				});

				test.skip('V4 + V4 should result in a V4 sum', () => {
					const sum = addPos([4, 5, 6, 7], [0, 1, 2, 3]);
					expect(sum).toHaveLength(4);
					expect(sum).toEqual([4, 6, 8, 10]);
				});
			});

			describe.skip('when a is longer than b', () => {
				test("sum should be of length a, treating b's missing elements as 0", () => {
					const sum = addPos([2, 3, 4], [0, 1]);
					expect(sum).toHaveLength(3);
					expect(sum).toEqual([2, 4, 4]);
				});
			});

			describe.skip('when a is shorter than b', () => {
				test('sum should be of length a, truncating extra elements from b', () => {
					const sum = addPos([3, 4], [0, 1, 2]);
					expect(sum).toHaveLength(2);
					expect(sum).toEqual([3, 5]);
				});
			});
		});

		describe('subPos(a, b)', () => {
			describe('when a & b are both the same length', () => {
				test('V2 - V2 should result in a V2 difference', () => {
					const a = new Vec2(4, 5);
					const b = new Vec2(0, 1);
					expectVec2Equal(a.sub(b), [4, 4]);
					expectVec2Equal(Vec2.sub(a, b), [4, 4]);
				});

				test.skip('V3 - V3 should result in a V3 difference', () => {
					const diff = subPos([4, 5, 6], [0, 1, 2]);
					expect(diff).toHaveLength(3);
					expect(diff).toEqual([4, 4, 4]);
				});

				test.skip('V4 - V4 should result in a V4 difference', () => {
					const diff = subPos([4, 5, 6, 7], [0, 1, 2, 3]);
					expect(diff).toHaveLength(4);
					expect(diff).toEqual([4, 4, 4, 4]);
				});
			});

			describe.skip('when a is longer than b', () => {
				test("difference should be of length a, treating b's missing elements as 0", () => {
					const diff = subPos([2, 3, 4], [0, 1]);
					expect(diff).toHaveLength(3);
					expect(diff).toEqual([2, 2, 4]);
				});
			});

			describe.skip('when a is shorter than b', () => {
				test('difference should be of length a, truncating extra elements from b', () => {
					const diff = subPos([3, 4], [0, 1, 2]);
					expect(diff).toHaveLength(2);
					expect(diff).toEqual([3, 3]);
				});
			});
		});

		describe('posEqual(a, b)', () => {
			test('equal returns true?', () => {
				const a = new Vec2(1, 2);
				const b = new Vec2(1, 2);
				expect(Vec2.equal(a, b)).toEqual(true);
				expect(a.equal(b)).toEqual(true);
			});

			test('equal returns false?', () => {
				const a = new Vec2(1, 2);
				const b = new Vec2(1, 3);
				expect(Vec2.equal(a, b)).toEqual(false);
				expect(a.equal(b)).toEqual(false);
			});

			test.skip('should return true if both vectors are of equal length and have the same valued elements', () => {
				const isEqual = posEqual([1, 2, 3], [1, 2, 3]);
				expect(isEqual).toEqual(true);
			});
			test.skip('should return true if both vectors are of equal length and shared values are within the epsilon margin of error', () => {
				const isEqual = posEqual([0.1 + 0.2, 2, 3], [0.3, 2, 3]);
				expect(isEqual).toEqual(true);
			});

			test.skip('should return false if the vectors do not match', () => {
				const isEqual = posEqual([1, 2, 3], [1, 2, 4]);
				expect(isEqual).toEqual(false);
			});

			test.skip('should return false if vector a is longer, even if the shared elements match', () => {
				const isEqual = posEqual([1, 2, 3], [1, 2]);
				expect(isEqual).toEqual(false);
			});

			test.skip('should return false if vector b is longer, even if the shared elements match', () => {
				const isEqual = posEqual([1, 2], [1, 2, 3]);
				expect(isEqual).toEqual(false);
			});
		});
	});

	describe('Vector & Scalar', () => {
		describe('addScalar(p, s)', () => {
			test('should return a vector of equal length translated by a scalar', () => {
				const scaled = addScalar([1, 2], 5);
				expect(scaled).toHaveLength(2);
				expect(scaled).toEqual([6, 7]);
			});
			// TODO(bret): Fix this
			test.fails(
				'should return a vector of equal length translated by a scalar',
				() => {
					const scaled = addScalar([1, 2, 3], 5);
					expect(scaled).toHaveLength(3);
					expect(scaled).toEqual([6, 7, 8]);
				},
			);
		});

		describe('scalePos(p, s)', () => {
			test('should return a vector of equal length scaled by a scalar', () => {
				const scaled = scalePos([1, 2], 5);
				expect(scaled).toHaveLength(2);
				expect(scaled).toEqual([5, 10]);
			});
			// TODO(bret): Fix this
			test.fails(
				'should return a vector of equal length scaled by a scalar',
				() => {
					const scaled = scalePos([1, 2, 3], 5);
					expect(scaled).toHaveLength(3);
					expect(scaled).toEqual([5, 10, 15]);
				},
			);
		});
	});
});

describe('Scalar operations', () => {
	describe('equal(a, b)', () => {
		test('should return true for equal scalars', () => {
			const isEqual = equal(10, 10);
			expect(isEqual).toEqual(true);
		});

		test('should return true for unequal scalars that have a difference lesser than the epsilon', () => {
			const isEqual = equal(0.1 + 0.2, 0.3);
			expect(isEqual).toEqual(true);
		});

		test('should return false for unequal scalars', () => {
			const isEqual = equal(10, 7);
			expect(isEqual).toEqual(false);
		});
	});
});

describe('Vector operations', () => {
	describe('Vector & Vector', () => {
		describe.skip('addPos(a, b)', () => {
			describe('when a & b are both the same length', () => {
				test('V2 + V2 should result in a V2 sum', () => {
					const sum = addPos([4, 5], [0, 1]);
					expect(sum).toHaveLength(2);
					expect(sum).toEqual([4, 6]);
				});

				test('V3 + V3 should result in a V3 sum', () => {
					const sum = addPos([4, 5, 6], [0, 1, 2]);
					expect(sum).toHaveLength(3);
					expect(sum).toEqual([4, 6, 8]);
				});

				test('V4 + V4 should result in a V4 sum', () => {
					const sum = addPos([4, 5, 6, 7], [0, 1, 2, 3]);
					expect(sum).toHaveLength(4);
					expect(sum).toEqual([4, 6, 8, 10]);
				});
			});

			describe('when a is longer than b', () => {
				test("sum should be of length a, treating b's missing elements as 0", () => {
					const sum = addPos([2, 3, 4], [0, 1]);
					expect(sum).toHaveLength(3);
					expect(sum).toEqual([2, 4, 4]);
				});
			});

			describe('when a is shorter than b', () => {
				test('sum should be of length a, truncating extra elements from b', () => {
					const sum = addPos([3, 4], [0, 1, 2]);
					expect(sum).toHaveLength(2);
					expect(sum).toEqual([3, 5]);
				});
			});
		});

		describe.skip('subPos(a, b)', () => {
			describe('when a & b are both the same length', () => {
				test('V2 - V2 should result in a V2 difference', () => {
					const diff = subPos([4, 5], [0, 1]);
					expect(diff).toHaveLength(2);
					expect(diff).toEqual([4, 4]);
				});

				test('V3 - V3 should result in a V3 difference', () => {
					const diff = subPos([4, 5, 6], [0, 1, 2]);
					expect(diff).toHaveLength(3);
					expect(diff).toEqual([4, 4, 4]);
				});

				test('V4 - V4 should result in a V4 difference', () => {
					const diff = subPos([4, 5, 6, 7], [0, 1, 2, 3]);
					expect(diff).toHaveLength(4);
					expect(diff).toEqual([4, 4, 4, 4]);
				});
			});

			describe('when a is longer than b', () => {
				test("difference should be of length a, treating b's missing elements as 0", () => {
					const diff = subPos([2, 3, 4], [0, 1]);
					expect(diff).toHaveLength(3);
					expect(diff).toEqual([2, 2, 4]);
				});
			});

			describe('when a is shorter than b', () => {
				test('difference should be of length a, truncating extra elements from b', () => {
					const diff = subPos([3, 4], [0, 1, 2]);
					expect(diff).toHaveLength(2);
					expect(diff).toEqual([3, 3]);
				});
			});
		});

		describe('posEqual(a, b)', () => {
			test('should return true if both vectors are of equal length and have the same valued elements', () => {
				const isEqual = posEqual([1, 2, 3], [1, 2, 3]);
				expect(isEqual).toEqual(true);
			});
			test('should return true if both vectors are of equal length and shared values are within the epsilon margin of error', () => {
				const isEqual = posEqual([0.1 + 0.2, 2, 3], [0.3, 2, 3]);
				expect(isEqual).toEqual(true);
			});

			test('should return false if the vectors do not match', () => {
				const isEqual = posEqual([1, 2, 3], [1, 2, 4]);
				expect(isEqual).toEqual(false);
			});

			test('should return false if vector a is longer, even if the shared elements match', () => {
				const isEqual = posEqual([1, 2, 3], [1, 2]);
				expect(isEqual).toEqual(false);
			});

			test('should return false if vector b is longer, even if the shared elements match', () => {
				const isEqual = posEqual([1, 2], [1, 2, 3]);
				expect(isEqual).toEqual(false);
			});
		});
	});

	describe('Vector & Scalar', () => {
		describe.skip('addScalar(p, s)', () => {
			test('should return a vector of equal length translated by a scalar', () => {
				const scaled = addScalar([1, 2, 3], 5);
				expect(scaled).toHaveLength(3);
				expect(scaled).toEqual([6, 7, 8]);
			});
		});

		describe.skip('scalePos(p, s)', () => {
			test('should return a vector of equal length scaled by a scalar', () => {
				const scaled = scalePos([1, 2, 3], 5);
				expect(scaled).toHaveLength(3);
				expect(scaled).toEqual([5, 10, 15]);
			});
		});
	});
});

describe('Scalar operations', () => {
	describe('equal(a, b)', () => {
		test('should return true for equal scalars', () => {
			const isEqual = equal(10, 10);
			expect(isEqual).toEqual(true);
		});

		test('should return true for unequal scalars that have a difference lesser than the epsilon', () => {
			const isEqual = equal(0.1 + 0.2, 0.3);
			expect(isEqual).toEqual(true);
		});

		test('should return false for unequal scalars', () => {
			const isEqual = equal(10, 7);
			expect(isEqual).toEqual(false);
		});
	});
});

const xPos = [-101, -100, 0, 77, 78];
const yPos = [-81, -80, 0, 36, 37];

describe('isWithinBounds()', () => {
	const p1 = new Vec2(-100, -80);
	const p2 = new Vec2(78, 37);

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

	test('is in bounds', () => {
		expect(isWithinBounds(Vec2.zero, p1, p2)).toBeTruthy();
	});

	test('is in bounds', () => {
		expect(isWithinBounds(Vec2.zero, p1, p2)).toBeTruthy();
	});
});
