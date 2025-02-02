/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import { Draw } from '../util/draw.js';
import { Entity } from '../canvas-lord.js';

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
	width: number;
	height: number;

	#orientation: Orientation;
	#points!: Points;

	#lastLeft!: number;
	#lastTop!: number;
	#lastW!: number;
	#lastH!: number;

	get points() {
		this.#computePoints();
		return this.#points;
	}

	#computePoints(compute = false) {
		if (
			compute ||
			(this.left === this.#lastLeft &&
				this.top === this.#lastTop &&
				this.width === this.#lastW &&
				this.height === this.#lastH)
		)
			return;

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
				throw new Error(`Invalid orientation (${this.orientation})`);
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

	get w() {
		return this.width;
	}
	set w(value) {
		this.width = value;
	}

	get h() {
		return this.height;
	}
	set h(value) {
		this.height = value;
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

	get left() {
		return this.x + this.parent.x;
	}
	get right() {
		return this.x + this.parent.x + this.w - 1;
	}
	get top() {
		return this.y + this.parent.y;
	}
	get bottom() {
		return this.y + this.parent.y + this.h - 1;
	}

	get p1() {
		this.#computePoints();
		return this.#points[0];
	}
	get p2() {
		this.#computePoints();
		return this.#points[1];
	}
	get p3() {
		this.#computePoints();
		return this.#points[2];
	}

	get x1() {
		this.#computePoints();
		return this.#points[0][0];
	}
	get y1() {
		this.#computePoints();
		return this.#points[0][1];
	}
	get x2() {
		this.#computePoints();
		return this.#points[1][0];
	}
	get y2() {
		this.#computePoints();
		return this.#points[1][1];
	}
	get x3() {
		this.#computePoints();
		return this.#points[2][0];
	}
	get y3() {
		this.#computePoints();
		return this.#points[2][1];
	}

	render(ctx: CanvasRenderingContext2D, x = 0, y = 0): void {
		// TODO(bret): Fix this
		Draw.polygon(
			ctx,
			this.options,
			x,
			y,
			// @ts-expect-error
			this.#points,
		);
	}
}
