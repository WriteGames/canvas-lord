/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class PointCollider extends Collider {
    type = 'point';
    get left() {
        return this.parent.x + this.x;
    }
    get right() {
        return this.parent.y + this.x;
    }
    get top() {
        return this.parent.x + this.y;
    }
    get bottom() {
        return this.parent.y + this.y;
    }
    constructor(x = 0, y = 0) {
        super(x, y);
    }
    render(ctx, x = 0, y = 0) {
        Draw.circle(ctx, this.options, x + this.x, y + this.y, 1);
    }
}
//# sourceMappingURL=point-collider.js.map