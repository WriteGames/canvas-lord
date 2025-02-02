/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';

interface IPointCollider {
	type: 'point';
}

export class PointCollider extends Collider implements IPointCollider {
	type = 'point' as const;

	get left() {
		return this.parent.x + this.x;
	}
	get right() {
		return this.parent.x + this.x;
	}
	get top() {
		return this.parent.y + this.y;
	}
	get bottom() {
		return this.parent.y + this.y;
	}

	constructor(x = 0, y = 0) {
		super(x, y);
	}

	render(ctx: CanvasRenderingContext2D, x = 0, y = 0): void {
		Draw.circle(ctx, this.options, x + this.left, y + this.top, 1);
	}
}
