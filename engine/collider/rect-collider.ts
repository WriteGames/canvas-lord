/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';

interface IRectCollider {
	type: 'rect';
	width: number;
	height: number;
}

export class RectCollider extends Collider implements IRectCollider {
	type = 'rect' as const;
	width: number;
	height: number;

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

	get left() {
		return this.parent.x + this.x;
	}
	get right() {
		return this.parent.x + this.x + this.w - 1;
	}
	get top() {
		return this.parent.y + this.y;
	}
	get bottom() {
		return this.parent.y + this.y + this.h - 1;
	}

	constructor(w: number, h: number, x = 0, y = 0) {
		super(x, y);
		if (w < 0) throw new Error('Invalid width');
		if (h < 0) throw new Error('Invalid height');
		this.width = w;
		this.height = h;
	}

	render(ctx: CanvasRenderingContext2D, x = 0, y = 0): void {
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
