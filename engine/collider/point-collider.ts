/* Canvas Lord v0.5.3 */

import { Collider } from './collider.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

interface IPointCollider {
	type: 'point';
}

export class PointCollider extends Collider implements IPointCollider {
	type = 'point' as const;

	get left(): number {
		return this.parent.x + this.x;
	}
	get right(): number {
		return this.parent.x + this.x;
	}
	get top(): number {
		return this.parent.y + this.y;
	}
	get bottom(): number {
		return this.parent.y + this.y;
	}

	constructor(x = 0, y = 0) {
		super(x, y);
	}

	render(ctx: Ctx, x = 0, y = 0): void {
		Draw.circle(ctx, this.options, x + this.left, y + this.top, 1);
	}
}
