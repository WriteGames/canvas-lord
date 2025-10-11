/* Canvas Lord v0.6.1 */

import { Collider } from './collider.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import { Vec2 } from '../math/index.js';

interface ICircleCollider {
	type: 'circle';
	radius: number;
}

export class CircleCollider extends Collider implements ICircleCollider {
	type = 'circle' as const;
	radius: number;

	get r(): number {
		return this.radius;
	}
	set r(value) {
		this.radius = value;
	}

	get width(): number {
		return this.radius * 2;
	}
	set width(_value) {
		throw new Error('cannot set width of circle');
	}

	get height(): number {
		return this.radius * 2;
	}
	set height(_value) {
		throw new Error('cannot set height of circle');
	}

	get left(): number {
		return this.parent.x + this.x - this.originX - (this.radius - 0.5);
	}
	get right(): number {
		return this.parent.x + this.x - this.originX + (this.radius - 0.5);
	}
	get top(): number {
		return this.parent.y + this.y - this.originY - (this.radius - 0.5);
	}
	get bottom(): number {
		return this.parent.y + this.y - this.originY + (this.radius - 0.5);
	}

	get center(): Vec2 {
		return new Vec2(this.centerX, this.centerY);
	}
	get centerX(): number {
		return this.x + this.parent.x - this.originX;
	}
	get centerY(): number {
		return this.y + this.parent.y - this.originY;
	}

	constructor(r: number, x = 0, y = 0) {
		super(x, y);
		if (r < 0) throw new Error('Invalid radius');
		this.radius = r;
	}

	centerOrigin(): void {
		this.originX = 0;
		this.originY = 0;
	}

	centerOO(): void {
		this.centerOrigin();
	}

	render(ctx: Ctx, x: number, y: number): void {
		if (this.collidable) this.options.color = this.color;

		Draw.circle(
			ctx,
			this.options,
			x + this.centerX - this.r,
			y + this.centerY - this.r,
			this.r,
		);
	}
}
