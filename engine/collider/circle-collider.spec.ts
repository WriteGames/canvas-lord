import { beforeEach, describe, expect, test } from 'vitest';
import { CircleCollider } from './index';
import type { Entity } from '../core/entity';

const X_POS = 40;
const Y_POS = 55;
const RADIUS = 67;
const SIZE_W = RADIUS * 2;
const SIZE_H = RADIUS * 2;

const entity00 = {
	x: 0,
	y: 0,
} as Entity;

const entityWithPosition = {
	x: -100,
	y: 300,
} as Entity;

let circleCollider: CircleCollider;
function testBounds(
	left: number,
	right: number,
	top: number,
	bottom: number,
): void {
	test(`left should be equal to ${left}`, () => {
		expect(circleCollider.left).toEqual(left);
	});

	test(`right should be equal to ${right}`, () => {
		expect(circleCollider.right).toEqual(right);
	});

	test(`top should be equal to ${top}`, () => {
		expect(circleCollider.top).toEqual(top);
	});

	test(`bottom should be equal to ${bottom}`, () => {
		expect(circleCollider.bottom).toEqual(bottom);
	});
}

describe('constructor', () => {
	test('should accept two arguments', () => {
		const circleCollider = new CircleCollider(RADIUS);
		expect(circleCollider.x).toEqual(0);
		expect(circleCollider.y).toEqual(0);
		expect(circleCollider.radius).toEqual(RADIUS);
	});

	test('should accept three arguments', () => {
		const circleCollider = new CircleCollider(RADIUS, X_POS);
		expect(circleCollider.x).toEqual(X_POS);
		expect(circleCollider.y).toEqual(0);
		expect(circleCollider.width).toEqual(SIZE_W);
		expect(circleCollider.height).toEqual(SIZE_H);
	});

	test('should accept four arguments', () => {
		const circleCollider = new CircleCollider(RADIUS, X_POS, Y_POS);
		expect(circleCollider.x).toEqual(X_POS);
		expect(circleCollider.y).toEqual(Y_POS);
		expect(circleCollider.width).toEqual(SIZE_W);
		expect(circleCollider.height).toEqual(SIZE_H);
	});
});

// TODO(bret): Should circles _not_ be centered by default?
describe('center origin', () => {
	beforeEach(() => {
		circleCollider = new CircleCollider(RADIUS);
	});

	test('centerOrigin() should center the origin', () => {
		circleCollider.centerOrigin();
		expect(circleCollider.originX).toEqual(RADIUS / 2);
		expect(circleCollider.originY).toEqual(RADIUS / 2);
	});

	test('centerOO() should center the origin', () => {
		circleCollider.centerOO();
		expect(circleCollider.originX).toEqual(RADIUS / 2);
		expect(circleCollider.originY).toEqual(RADIUS / 2);
	});
});

describe('getters/setters', () => {
	const LEFT = X_POS;
	const TOP = Y_POS;
	const RIGHT = LEFT + SIZE_W - 1;
	console.log({ RIGHT });
	const BOTTOM = TOP + SIZE_H - 1;

	beforeEach(() => {
		circleCollider = new CircleCollider(RADIUS, X_POS, Y_POS);
		circleCollider.assignParent(entity00);
	});

	testBounds(LEFT, RIGHT, TOP, BOTTOM);

	test(`width should be equal to ${SIZE_W}`, () => {
		expect(circleCollider.width).toEqual(SIZE_W);
	});

	test(`w should be equal to ${SIZE_W}`, () => {
		expect(circleCollider.w).toEqual(SIZE_W);
	});

	test(`height should be equal to ${SIZE_H}`, () => {
		expect(circleCollider.height).toEqual(SIZE_H);
	});

	test(`h should be equal to ${SIZE_H}`, () => {
		expect(circleCollider.h).toEqual(SIZE_H);
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
			circleCollider = new CircleCollider(RADIUS, X_POS, Y_POS);
			circleCollider.assignParent(entity00);
			circleCollider.originX = ORIGIN_X;
			circleCollider.originY = ORIGIN_Y;
		});

		testBounds(LEFT, RIGHT, TOP, BOTTOM);
	});

	describe('bounds should be relative to entity', () => {
		const LEFT = X_POS + entityWithPosition.x;
		const TOP = Y_POS + entityWithPosition.y;
		const RIGHT = LEFT + SIZE_W - 1;
		const BOTTOM = TOP + SIZE_H - 1;

		beforeEach(() => {
			circleCollider = new CircleCollider(RADIUS, X_POS, Y_POS);
			circleCollider.assignParent(entityWithPosition);
		});

		testBounds(LEFT, RIGHT, TOP, BOTTOM);
	});
});
