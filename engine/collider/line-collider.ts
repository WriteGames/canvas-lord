/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';

interface ILineCollider {
	type: 'line';
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

export class LineCollider extends Collider implements ILineCollider {
	type = 'line' as const;

	x1: number;
	y1: number;
	x2: number;
	y2: number;

	constructor(x1: number, y1: number, x2: number, y2: number, x = 0, y = 0) {
		super(x, y);
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	render(ctx: CanvasRenderingContext2D, x = 0, y = 0): void {
		const x1 = x + this.x + this.x1;
		const y1 = y + this.y + this.y1;
		const x2 = x + this.x + this.x2;
		const y2 = y + this.y + this.y2;
		Draw.line(ctx, this.options, x1, y1, x2, y2);
	}
}
