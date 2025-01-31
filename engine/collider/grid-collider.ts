/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
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
	}

	render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		Draw.circle(ctx, this.options, x + this.x, y + this.y, 1);
	}
}
