/* Canvas Lord v0.6.1 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
import { Vec2 } from '../math/index.js';
// TODO(bret): getter for width/height :O
export class CircleCollider extends Collider {
    type = 'circle';
    radius;
    get r() {
        return this.radius;
    }
    set r(value) {
        this.radius = value;
    }
    get center() {
        return new Vec2(this.centerX, this.centerY);
    }
    get centerX() {
        return this.x + this.parent.x - this.originX;
    }
    get centerY() {
        return this.y + this.parent.y - this.originY;
    }
    constructor(r, x = 0, y = 0) {
        super(x, y);
        if (r < 0)
            throw new Error('Invalid radius');
        this.radius = r;
    }
    render(ctx, x, y) {
        if (this.collidable)
            this.options.color = this.color;
        Draw.circle(ctx, this.options, x + this.centerX - this.r, y + this.centerY - this.r, this.r);
    }
}
//# sourceMappingURL=circle-collider.js.map