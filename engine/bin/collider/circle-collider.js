/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
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
    constructor(r, x = 0, y = 0) {
        super(x, y);
        if (r < 0)
            throw new Error('Invalid radius');
        this.radius = r;
    }
    render(ctx, x, y) {
        Draw.circle(ctx, {
            type: 'stroke',
            color: 'red',
        }, x, y, this.r);
    }
}
//# sourceMappingURL=circle-collider.js.map