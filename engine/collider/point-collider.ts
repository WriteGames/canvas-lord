import { Collider } from './collider.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

interface IPointCollider {
	type: 'point';
}

export class PointCollider extends Collider implements IPointCollider {
	type = 'point' as const;

	get width(): number {
		return 1 as number;
	}
	get height(): number {
		return 1 as number;
	}

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

	constructor(x = 0, y = 0, ...tags: string[]) {
		super(...tags);
		this.x = x;
		this.y = y;
	}

	centerOrigin(): void {
		this.originX = 0;
		this.originY = 0;
	}

	centerOO(): void {
		this.centerOrigin();
	}

	render(ctx: Ctx, x = 0, y = 0): void {
		if (this.collidable) this.options.color = this.color;

		Draw.circle(ctx, this.options, x + this.left, y + this.top, 1);
	}
}
