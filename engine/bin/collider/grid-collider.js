/* Canvas Lord v0.5.3 */
import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import { Grid } from '../util/grid.js';
export class GridCollider extends Collider {
    type = 'grid';
    grid;
    constructor(grid, x = 0, y = 0) {
        super(x, y);
        this.grid = grid;
        this.grid.renderMode = Grid.RenderMode.OUTLINE;
    }
    get width() {
        return this.grid.width;
    }
    get w() {
        return this.width;
    }
    get height() {
        return this.grid.height;
    }
    get h() {
        return this.height;
    }
    get left() {
        return this.parent.x + this.x;
    }
    get right() {
        return this.parent.x + this.x + this.w - 1;
    }
    get top() {
        return this.parent.y + this.y;
    }
    get bottom() {
        return this.parent.y + this.y + this.h - 1;
    }
    render(ctx, x, y) {
        // TODO(bret): Isn't this backwards?
        const cameraX = -x;
        const cameraY = -y;
        this.grid.render(ctx, new Vec2(cameraX - this.left, cameraY - this.top));
    }
}
//# sourceMappingURL=grid-collider.js.map