/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class RectCollider extends Collider {
    type = 'rect';
    width;
    height;
    get w() {
        return this.width;
    }
    set w(value) {
        this.width = value;
    }
    get h() {
        return this.height;
    }
    set h(value) {
        this.height = value;
    }
    constructor(w, h, x = 0, y = 0) {
        super(x, y);
        if (w < 0)
            throw new Error('Invalid width');
        if (h < 0)
            throw new Error('Invalid height');
        this.width = w;
        this.height = h;
    }
    render(ctx, x, y) {
        Draw.rect(ctx, this.options, x + this.x, y + this.y, this.w, this.h);
    }
}
//# sourceMappingURL=rect-collider.js.map