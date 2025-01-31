/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class GridCollider extends Collider {
    type = 'grid';
    grid;
    constructor(grid, x = 0, y = 0) {
        super(x, y);
        this.grid = grid;
    }
    render(ctx, x, y) {
        Draw.circle(ctx, this.options, x + this.x, y + this.y, 1);
    }
}
//# sourceMappingURL=grid-collider.js.map