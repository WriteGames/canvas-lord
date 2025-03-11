/* Canvas Lord v0.5.3 */

import { Collider } from './collider.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import { Vec2 } from '../math/index.js';

interface ICircleCollider {
	type: 'circle';
	radius: number;
}

// TODO(bret): getter for width/height :O
export class CircleCollider extends Collider implements ICircleCollider {
	type = 'circle' as const;
	radius: number;

	get r(): number {
		return this.radius;
	}
	set r(value) {
		this.radius = value;
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

	render(ctx: Ctx, x: number, y: number): void {
		Draw.circle(
			ctx,
			{
				type: 'stroke',
				color: 'red',
			},
			x + this.centerX - this.r,
			y + this.centerY - this.r,
			this.r,
		);
	}
}
