/* Canvas Lord v0.6.0 */

import { Collider } from './collider.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

interface IPointCollider {
	type: 'point';
}

export class PointCollider extends Collider implements IPointCollider {
	type = 'point' as const;

	get left(): number {
		return this.parent.x + this.x - this.originX;
	}
	get right(): number {
		return this.parent.x + this.x - this.originX;
	}
	get top(): number {
		return this.parent.y + this.y - this.originY;
	}
	get bottom(): number {
		return this.parent.y + this.y - this.originY;
	}

	constructor(x = 0, y = 0) {
		super(x, y);
	}

	render(ctx: Ctx, x = 0, y = 0): void {
		Draw.circle(ctx, this.options, x + this.left, y + this.top, 1);
	}
}
