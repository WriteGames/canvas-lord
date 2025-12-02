import { beforeEach, describe, expect, test } from 'vitest';
import { LineCollider } from './index';
import type { Entity } from '../core/entity';

const X1 = 10;
const Y1 = 45;
const X2 = 100;
const Y2 = 87;

const SIZE_W = X2 - X1 + 1;
const SIZE_H = Y2 - Y1 + 1;

const coords = [X1, Y1, X2, Y2] as const;

const TAG_1 = 'tag-1' as const;
const TAG_2 = 'tag-2' as const;
const TAG_3 = 'tag-3' as const;

const entity00 = {
	x: 0,
	y: 0,
} as Entity;

const entityWithPosition = {
	x: -100,
	y: 300,
} as Entity;

let lineCollider: LineCollider;
function testBounds(
	left: number,
	right: number,
	top: number,
	bottom: number,
): void {
	test(`left should be equal to ${left}`, () => {
		expect(lineCollider.left).toEqual(left);
	});

	test(`right should be equal to ${right}`, () => {
		expect(lineCollider.right).toEqual(right);
	});

	test(`top should be equal to ${top}`, () => {
		expect(lineCollider.top).toEqual(top);
	});

	test(`bottom should be equal to ${bottom}`, () => {
		expect(lineCollider.bottom).toEqual(bottom);
	});
}

describe('constructor', () => {
	test('should accept four arguments', () => {
		const lineCollider = new LineCollider(...coords);
		expect(lineCollider.x1).toEqual(X1);
		expect(lineCollider.y1).toEqual(Y1);
		expect(lineCollider.x2).toEqual(X2);
		expect(lineCollider.y2).toEqual(Y2);
		expect(lineCollider.tag).toEqual(undefined);
		expect(lineCollider.tags).toEqual([]);
	});

	test('should accept five arguments', () => {
		const lineCollider = new LineCollider(...coords, TAG_1);
		expect(lineCollider.x1).toEqual(X1);
		expect(lineCollider.y1).toEqual(Y1);
		expect(lineCollider.x2).toEqual(X2);
		expect(lineCollider.y2).toEqual(Y2);
		expect(lineCollider.tag).toEqual(TAG_1);
		expect(lineCollider.tags).toEqual([TAG_1]);
	});

	test('should accept any number of arguments', () => {
		const lineCollider = new LineCollider(...coords, TAG_1, TAG_2, TAG_3);
		expect(lineCollider.x1).toEqual(X1);
		expect(lineCollider.y1).toEqual(Y1);
		expect(lineCollider.x2).toEqual(X2);
		expect(lineCollider.y2).toEqual(Y2);
		expect(lineCollider.tag).toEqual(TAG_1);
		expect(lineCollider.tags).toEqual([TAG_1, TAG_2, TAG_3]);
	});
});

// TODO(bret): Someday LineCollider will need origins
// describe('center origin', () => {
// 	beforeEach(() => {
// 		lineCollider = new LineCollider(...coords);
// 	});

// 	test('centerOrigin() should center the origin', () => {
// 		lineCollider.centerOrigin();
// 		expect(lineCollider.originX).toEqual(0);
// 		expect(lineCollider.originY).toEqual(0);
// 	});

// 	test('centerOO() should center the origin', () => {
// 		lineCollider.centerOO();
// 		expect(lineCollider.originX).toEqual(0);
// 		expect(lineCollider.originY).toEqual(0);
// 	});
// });

describe('getters/setters', () => {
	const LEFT = X1;
	const TOP = Y1;
	const RIGHT = X2;
	const BOTTOM = Y2;

	beforeEach(() => {
		lineCollider = new LineCollider(...coords);
		lineCollider.assignParent(entity00);
	});

	testBounds(LEFT, RIGHT, TOP, BOTTOM);

	test(`width should be equal to ${SIZE_W}`, () => {
		expect(lineCollider.width).toEqual(SIZE_W);
	});

	test(`w should be equal to ${SIZE_W}`, () => {
		expect(lineCollider.w).toEqual(SIZE_W);
	});

	test(`height should be equal to ${SIZE_H}`, () => {
		expect(lineCollider.height).toEqual(SIZE_H);
	});

	test(`h should be equal to ${SIZE_H}`, () => {
		expect(lineCollider.h).toEqual(SIZE_H);
	});
});

describe('bounds', () => {
	describe('bounds should be relative to entity', () => {
		const LEFT = X1 + entityWithPosition.x;
		const TOP = Y1 + entityWithPosition.y;
		const RIGHT = X2 + entityWithPosition.x;
		const BOTTOM = Y2 + entityWithPosition.y;

		beforeEach(() => {
			lineCollider = new LineCollider(...coords);
			lineCollider.assignParent(entityWithPosition);
		});

		testBounds(LEFT, RIGHT, TOP, BOTTOM);
	});
});
