/* Canvas Lord v0.6.1 */

import type { Entity } from '../core/entity.js';
import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

type Orientation = 'NW' | 'NE' | 'SW' | 'SE';

type Point = Vec2;
type Points = [Point, Point, Point];

interface IRightTriangleCollider {
	type: 'right-triangle';

	width: number;
	height: number;
	orientation: Orientation;
}

export class RightTriangleCollider
	extends Collider
	implements IRightTriangleCollider
{
	type = 'right-triangle' as const;
	#width!: number;
	#height!: number;

	#orientation: Orientation;
	#points!: Points;

	#lastLeft!: number;
	#lastTop!: number;
	#lastW!: number;
	#lastH!: number;

	get points(): Points {
		this.#computePoints();
		return this.#points;
	}

	get w(): number {
		return this.width;
	}
	set w(value) {
		this.width = value;
	}

	get h(): number {
		return this.height;
	}
	set h(value) {
		this.height = value;
	}

	get width(): number {
		return this.#width;
	}
	set width(value) {
		this.#width = value;
	}

	get height(): number {
		return this.#height;
	}
	set height(value) {
		this.#height = value;
	}

	#computePoints(compute = false): void {
		if (
			this.left === this.#lastLeft &&
			this.top === this.#lastTop &&
			this.width === this.#lastW &&
			this.height === this.#lastH
		) {
			if (!compute) return;
		}

		this.#lastLeft = this.left;
		this.#lastTop = this.top;
		this.#lastW = this.width;
		this.#lastH = this.height;

		const TL = new Vec2(this.left, this.top);
		const TR = new Vec2(this.right, this.top);
		const BR = new Vec2(this.right, this.bottom);
		const BL = new Vec2(this.left, this.bottom);
		let points: Points;
		switch (this.orientation) {
			case 'NE': {
				points = [TL, BR, BL];
				break;
			}
			case 'SE': {
				points = [TR, BL, TL];
				break;
			}
			case 'SW': {
				points = [BR, TL, TR];
				break;
			}
			case 'NW': {
				points = [BL, TR, BR];
				break;
			}
			default:
				throw new Error(
					`Invalid orientation (${
						(this as unknown as RightTriangleCollider).orientation
					})`,
				);
		}
		this.#points = points;
	}

	get orientation(): Orientation {
		return this.#orientation;
	}

	set orientation(value: Orientation) {
		if (this.#orientation === value) return;
		this.#orientation = value;
		this.#computePoints(true);
	}

	constructor(w: number, h: number, orientation: Orientation, x = 0, y = 0) {
		super(x, y);

		this.width = w;
		this.height = h;
		this.#orientation = orientation;
	}

	assignParent(parent: Entity): void {
		super.assignParent(parent);
		this.#computePoints(true);
	}

	get left(): number {
		return this.x + this.parent.x - this.originX;
	}
	get right(): number {
		return this.x + this.parent.x - this.originX + this.w - 1;
	}
	get top(): number {
		return this.y + this.parent.y - this.originY;
	}
	get bottom(): number {
		return this.y + this.parent.y - this.originY + this.h - 1;
	}

	get p1(): Point {
		this.#computePoints();
		return this.#points[0];
	}
	get p2(): Point {
		this.#computePoints();
		return this.#points[1];
	}
	get p3(): Point {
		this.#computePoints();
		return this.#points[2];
	}

	get x1(): number {
		this.#computePoints();
		return this.#points[0][0];
	}
	get y1(): number {
		this.#computePoints();
		return this.#points[0][1];
	}
	get x2(): number {
		this.#computePoints();
		return this.#points[1][0];
	}
	get y2(): number {
		this.#computePoints();
		return this.#points[1][1];
	}
	get x3(): number {
		this.#computePoints();
		return this.#points[2][0];
	}
	get y3(): number {
		this.#computePoints();
		return this.#points[2][1];
	}

	render(ctx: Ctx, x = 0, y = 0): void {
		if (this.collidable) this.options.color = this.color;

		Draw.polygon(
			ctx,
			this.options,
			x,
			y,
			// TODO(bret): the types don't match
			// @ts-expect-error -- idk
			this.#points,
		);
	}
}
