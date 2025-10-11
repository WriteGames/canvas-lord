/* Canvas Lord v0.6.1 */

import { Collider } from './collider.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

interface ILineCollider {
	type: 'line';
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

interface Point {
	x: number;
	left: number;
	right: number;
	y: number;
	top: number;
	bottom: number;
}

export class LineCollider extends Collider implements ILineCollider {
	type = 'line' as const;

	x1: number;
	y1: number;
	x2: number;
	y2: number;

	get start(): Point {
		return {
			x: this.xStart,
			left: this.xStart,
			right: this.xStart,
			y: this.yStart,
			top: this.yStart,
			bottom: this.yStart,
		};
	}
	get end(): Point {
		return {
			x: this.xEnd,
			left: this.xEnd,
			right: this.xEnd,
			y: this.yEnd,
			top: this.yEnd,
			bottom: this.yEnd,
		};
	}

	get xStart(): number {
		return this.x1 + this.parent.x - this.originX;
	}
	get yStart(): number {
		return this.y1 + this.parent.y - this.originY;
	}

	get xEnd(): number {
		return this.x2 + this.parent.x - this.originX;
	}
	get yEnd(): number {
		return this.y2 + this.parent.y - this.originY;
	}

	get left(): number {
		return Math.min(this.x1, this.x2) + this.parent.x - this.originX;
	}
	get right(): number {
		return Math.max(this.x1, this.x2) + this.parent.x - this.originX;
	}
	get top(): number {
		return Math.min(this.y1, this.y2) + this.parent.y - this.originY;
	}
	get bottom(): number {
		return Math.max(this.y1, this.y2) + this.parent.y - this.originY;
	}

	get width(): number {
		return Math.abs(this.x1 - this.x2) + 1;
	}
	get w(): number {
		return this.width;
	}

	get height(): number {
		return Math.abs(this.y1 - this.y2) + 1;
	}
	get h(): number {
		return this.height;
	}

	constructor(x1: number, y1: number, x2: number, y2: number, x = 0, y = 0) {
		super(x, y);
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	render(ctx: Ctx, x = 0, y = 0): void {
		if (this.collidable) this.options.color = this.color;

		const x1 = x + this.xStart;
		const y1 = y + this.yStart;
		const x2 = x + this.xEnd;
		const y2 = y + this.yEnd;
		Draw.line(ctx, this.options, x1, y1, x2, y2);
	}
}
