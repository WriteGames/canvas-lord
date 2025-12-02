import { beforeEach, describe, expect, test } from 'vitest';
import { BoxCollider } from './index';
import type { Entity } from '../core/entity';

const X_POS = 40;
const Y_POS = 55;
const SIZE_W = 123;
const SIZE_H = 777;

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

let boxCollider: BoxCollider;
function testBounds(
	left: number,
	right: number,
	top: number,
	bottom: number,
): void {
	test(`left should be equal to ${left}`, () => {
		expect(boxCollider.left).toEqual(left);
	});

	test(`right should be equal to ${right}`, () => {
		expect(boxCollider.right).toEqual(right);
	});

	test(`top should be equal to ${top}`, () => {
		expect(boxCollider.top).toEqual(top);
	});

	test(`bottom should be equal to ${bottom}`, () => {
		expect(boxCollider.bottom).toEqual(bottom);
	});
}

describe('constructor', () => {
	test('should accept two arguments', () => {
		const boxCollider = new BoxCollider(SIZE_W, SIZE_H);
		expect(boxCollider.width).toEqual(SIZE_W);
		expect(boxCollider.height).toEqual(SIZE_H);
		expect(boxCollider.tag).toEqual(undefined);
		expect(boxCollider.tags).toEqual([]);
	});

	test('should accept three arguments', () => {
		const boxCollider = new BoxCollider(SIZE_W, SIZE_H, TAG_1);
		expect(boxCollider.width).toEqual(SIZE_W);
		expect(boxCollider.height).toEqual(SIZE_H);
		expect(boxCollider.tag).toEqual(TAG_1);
		expect(boxCollider.tags).toEqual([TAG_1]);
	});

	test('should accept any number of arguments', () => {
		const boxCollider = new BoxCollider(
			SIZE_W,
			SIZE_H,
			TAG_1,
			TAG_2,
			TAG_3,
		);
		expect(boxCollider.width).toEqual(SIZE_W);
		expect(boxCollider.height).toEqual(SIZE_H);
		expect(boxCollider.tag).toEqual(TAG_1);
		expect(boxCollider.tags).toEqual([TAG_1, TAG_2, TAG_3]);
	});
});

describe('center origin', () => {
	beforeEach(() => {
		boxCollider = new BoxCollider(SIZE_W, SIZE_H);
	});

	test('centerOrigin() should center the origin', () => {
		boxCollider.centerOrigin();
		boxCollider.originX = -SIZE_W / 2;
		boxCollider.originY = -SIZE_H / 2;
	});

	test('centerOO() should center the origin', () => {
		boxCollider.centerOO();
		boxCollider.originX = -SIZE_W / 2;
		boxCollider.originY = -SIZE_H / 2;
	});
});

describe('getters/setters', () => {
	const LEFT = X_POS;
	const TOP = Y_POS;
	const RIGHT = LEFT + SIZE_W - 1;
	const BOTTOM = TOP + SIZE_H - 1;

	beforeEach(() => {
		boxCollider = new BoxCollider(SIZE_W, SIZE_H);
		boxCollider.x = X_POS;
		boxCollider.y = Y_POS;
		boxCollider.assignParent(entity00);
	});

	testBounds(LEFT, RIGHT, TOP, BOTTOM);

	test(`width should be equal to ${SIZE_W}`, () => {
		expect(boxCollider.width).toEqual(SIZE_W);
	});

	test(`w should be equal to ${SIZE_W}`, () => {
		expect(boxCollider.w).toEqual(SIZE_W);
	});

	test(`height should be equal to ${SIZE_H}`, () => {
		expect(boxCollider.height).toEqual(SIZE_H);
	});

	test(`h should be equal to ${SIZE_H}`, () => {
		expect(boxCollider.h).toEqual(SIZE_H);
	});
});

describe('bounds', () => {
	describe('bounds should be relative to origin', () => {
		const ORIGIN_X = 7;
		const ORIGIN_Y = -19;

		const LEFT = X_POS - ORIGIN_X;
		const TOP = Y_POS - ORIGIN_Y;
		const RIGHT = LEFT + SIZE_W - 1;
		const BOTTOM = TOP + SIZE_H - 1;

		beforeEach(() => {
			boxCollider = new BoxCollider(SIZE_W, SIZE_H);
			boxCollider.x = X_POS;
			boxCollider.y = Y_POS;
			boxCollider.assignParent(entity00);
			boxCollider.originX = ORIGIN_X;
			boxCollider.originY = ORIGIN_Y;
		});

		testBounds(LEFT, RIGHT, TOP, BOTTOM);
	});

	describe('bounds should be relative to entity', () => {
		const LEFT = X_POS + entityWithPosition.x;
		const TOP = Y_POS + entityWithPosition.y;
		const RIGHT = LEFT + SIZE_W - 1;
		const BOTTOM = TOP + SIZE_H - 1;

		beforeEach(() => {
			boxCollider = new BoxCollider(SIZE_W, SIZE_H);
			boxCollider.x = X_POS;
			boxCollider.y = Y_POS;
			boxCollider.assignParent(entityWithPosition);
		});

		testBounds(LEFT, RIGHT, TOP, BOTTOM);
	});
});
