/* Canvas Lord v0.6.1 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class PointCollider extends Collider {
    type = 'point';
    get left() {
        return this.parent.x + this.x - this.originX;
    }
    get right() {
        return this.parent.x + this.x - this.originX;
    }
    get top() {
        return this.parent.y + this.y - this.originY;
    }
    get bottom() {
        return this.parent.y + this.y - this.originY;
    }
    constructor(x = 0, y = 0) {
        super(x, y);
    }
    render(ctx, x = 0, y = 0) {
        if (this.collidable)
            this.options.color = this.color;
        Draw.circle(ctx, this.options, x + this.left, y + this.top, 1);
    }
}
//# sourceMappingURL=point-collider.js.map