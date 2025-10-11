/* Canvas Lord v0.6.1 */
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
        return this.parent.x + this.x - this.originX;
    }
    get right() {
        return this.parent.x + this.x - this.originX + this.w - 1;
    }
    get top() {
        return this.parent.y + this.y - this.originY;
    }
    get bottom() {
        return this.parent.y + this.y - this.originY + this.h - 1;
    }
    render(ctx, x, y) {
        if (this.collidable)
            this.options.color = this.color;
        if (this.options.color)
            this.grid.color = this.options.color;
        const camera = new Vec2(x + this.left, y + this.top).scale(-1);
        this.grid.render(ctx, camera);
    }
}
//# sourceMappingURL=grid-collider.js.map