import { beforeEach, describe, expect, test } from 'vitest';
import { PointCollider } from './index';
import type { Entity } from '../core/entity';

const X1 = 10;
const Y1 = 45;

const coords = [X1, Y1] as const;

const entity00 = {
	x: 0,
	y: 0,
} as Entity;

const entityWithPosition = {
	x: -100,
	y: 300,
} as Entity;

let pointCollider: PointCollider;
function testBounds(
	left: number,
	right: number,
	top: number,
	bottom: number,
): void {
	test(`left should be equal to ${left}`, () => {
		expect(pointCollider.left).toEqual(left);
	});

	test(`right should be equal to ${right}`, () => {
		expect(pointCollider.right).toEqual(right);
	});

	test(`top should be equal to ${top}`, () => {
		expect(pointCollider.top).toEqual(top);
	});

	test(`bottom should be equal to ${bottom}`, () => {
		expect(pointCollider.bottom).toEqual(bottom);
	});
}

describe('constructor', () => {
	test('should accept two arguments', () => {
		const pointCollider = new PointCollider(...coords);
		pointCollider.x = X1;
		pointCollider.y = Y1;
	});
});

describe('center origin', () => {
	beforeEach(() => {
		pointCollider = new PointCollider(...coords);
	});

	test('centerOrigin() should center the origin', () => {
		pointCollider.centerOrigin();
		expect(pointCollider.originX).toEqual(0);
		expect(pointCollider.originY).toEqual(0);
	});

	test('centerOO() should center the origin', () => {
		pointCollider.centerOO();
		expect(pointCollider.originX).toEqual(0);
		expect(pointCollider.originY).toEqual(0);
	});
});

describe('getters/setters', () => {
	const LEFT = X1;
	const TOP = Y1;
	const RIGHT = X1;
	const BOTTOM = Y1;

	beforeEach(() => {
		pointCollider = new PointCollider(...coords);
		pointCollider.assignParent(entity00);
	});

	testBounds(LEFT, RIGHT, TOP, BOTTOM);

	test(`width should be equal to 1`, () => {
		expect(pointCollider.width).toEqual(1);
	});

	test(`w should be equal to 1`, () => {
		expect(pointCollider.w).toEqual(1);
	});

	test(`height should be equal to 1`, () => {
		expect(pointCollider.height).toEqual(1);
	});

	test(`h should be equal to 1`, () => {
		expect(pointCollider.h).toEqual(1);
	});
});

describe('bounds', () => {
	describe('bounds should be relative to origin', () => {
		const ORIGIN_X = 7;
		const ORIGIN_Y = -19;

		const LEFT = X1 - ORIGIN_X;
		const TOP = Y1 - ORIGIN_Y;
		const RIGHT = LEFT;
		const BOTTOM = TOP;

		beforeEach(() => {
			pointCollider = new PointCollider(...coords);
			pointCollider.assignParent(entity00);
			pointCollider.originX = ORIGIN_X;
			pointCollider.originY = ORIGIN_Y;
		});

		testBounds(LEFT, RIGHT, TOP, BOTTOM);
	});

	describe('bounds should be relative to entity', () => {
		const LEFT = X1 + entityWithPosition.x;
		const TOP = Y1 + entityWithPosition.y;
		const RIGHT = LEFT;
		const BOTTOM = TOP;

		beforeEach(() => {
			pointCollider = new PointCollider(...coords);
			pointCollider.assignParent(entityWithPosition);
		});

		testBounds(LEFT, RIGHT, TOP, BOTTOM);
	});
});
