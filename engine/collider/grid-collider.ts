/* Canvas Lord v0.6.1 */

import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import type { Ctx } from '../util/canvas.js';
import { Grid } from '../util/grid.js';

interface IGridCollider {
	type: 'grid';

	// TODO(bret): This is a temp hack to get things moving quickly
	grid: Grid;
}

export class GridCollider extends Collider implements IGridCollider {
	type = 'grid' as const;
	grid: Grid;

	constructor(grid: Grid, x = 0, y = 0) {
		super(x, y);
		this.grid = grid;
		this.grid.renderMode = Grid.RenderMode.OUTLINE;
	}

	get width(): number {
		return this.grid.width;
	}
	get w(): number {
		return this.width;
	}

	get height(): number {
		return this.grid.height;
	}
	get h(): number {
		return this.height;
	}

	get left(): number {
		return this.parent.x + this.x - this.originX;
	}
	get right(): number {
		return this.parent.x + this.x - this.originX + this.w - 1;
	}
	get top(): number {
		return this.parent.y + this.y - this.originY;
	}
	get bottom(): number {
		return this.parent.y + this.y - this.originY + this.h - 1;
	}

	render(ctx: Ctx, x: number, y: number): void {
		if (this.collidable) this.options.color = this.color;
		if (this.options.color) this.grid.color = this.options.color;

		const camera = new Vec2(x + this.left, y + this.top).scale(-1);
		this.grid.render(ctx, camera);
	}
}
