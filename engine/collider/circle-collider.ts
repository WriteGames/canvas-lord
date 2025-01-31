/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';

interface ICircleCollider {
	type: 'circle';
	radius: number;
}

// TODO(bret): getter for width/height :O
export class CircleCollider extends Collider implements ICircleCollider {
	type = 'circle' as const;
	radius: number;

	get r() {
		return this.radius;
	}
	set r(value) {
		this.radius = value;
	}

	constructor(r: number, x = 0, y = 0) {
		super(x, y);
		if (r < 0) throw new Error('Invalid radius');
		this.radius = r;
	}

	render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		Draw.circle(
			ctx,
			{
				type: 'stroke',
				color: 'red',
			},
			x,
			y,
			this.r,
		);
	}
}
