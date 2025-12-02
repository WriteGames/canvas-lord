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
		return this.parent.x + this.x - this.originX;
	}
	get right(): number {
		return this.parent.x + this.x - this.originX + this.w - 1;
	}
	get top(): number {
		return this.parent.y + this.y - this.originY;
	}
	get bottom(): number {
		return this.parent.y + this.y - this.originY + this.h - 1;
	}

	get center(): Vec2 {
		return new Vec2(this.centerX, this.centerY);
	}
	get centerX(): number {
		return this.x + this.parent.x - this.originX + this.radius / 2;
	}
	get centerY(): number {
		return this.y + this.parent.y - this.originY + this.radius / 2;
	}

	constructor(r: number, ...tags: string[]) {
		super(...tags);
		if (r < 0) throw new Error('Invalid radius');
		this.radius = r;
	}

	centerOrigin(): void {
		this.originX = this.radius / 2;
		this.originY = this.radius / 2;
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
