/* Canvas Lord v0.6.1 */

import { Collider } from './collider.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

interface IBoxCollider {
	type: 'box';
	width: number;
	height: number;
}

export class BoxCollider extends Collider implements IBoxCollider {
	type = 'box' as const;
	#width: number;
	#height: number;

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

	constructor(w: number, h: number, x = 0, y = 0) {
		super(x, y);
		if (w < 0) throw new Error('Invalid width');
		if (h < 0) throw new Error('Invalid height');
		this.#width = w;
		this.#height = h;
	}

	centerOrigin(): void {
		this.originX = this.w / 2;
		this.originY = this.h / 2;
	}

	centerOO(): void {
		this.centerOrigin();
	}

	render(ctx: Ctx, x = 0, y = 0): void {
		if (this.collidable) this.options.color = this.color;

		Draw.rect(
			ctx,
			this.options,
			x + this.left,
			y + this.top,
			this.w,
			this.h,
		);
	}
}
