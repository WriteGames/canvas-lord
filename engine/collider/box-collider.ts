/* Canvas Lord v0.5.3 */

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
	width: number;
	height: number;

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

	get left(): number {
		return this.parent.x + this.x;
	}
	get right(): number {
		return this.parent.x + this.x + this.w - 1;
	}
	get top(): number {
		return this.parent.y + this.y;
	}
	get bottom(): number {
		return this.parent.y + this.y + this.h - 1;
	}

	constructor(w: number, h: number, x = 0, y = 0) {
		super(x, y);
		if (w < 0) throw new Error('Invalid width');
		if (h < 0) throw new Error('Invalid height');
		this.width = w;
		this.height = h;
	}

	render(ctx: Ctx, x = 0, y = 0): void {
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
