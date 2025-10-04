/* Canvas Lord v0.6.1 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class BoxCollider extends Collider {
    type = 'box';
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
    constructor(w, h, x = 0, y = 0) {
        super(x, y);
        if (w < 0)
            throw new Error('Invalid width');
        if (h < 0)
            throw new Error('Invalid height');
        this.width = w;
        this.height = h;
    }
    centerOrigin() {
        this.originX = this.w / 2;
        this.originY = this.h / 2;
    }
    centerOO() {
        this.centerOrigin();
    }
    render(ctx, x = 0, y = 0) {
        if (this.collidable)
            this.options.color = this.color;
        Draw.rect(ctx, this.options, x + this.left, y + this.top, this.w, this.h);
    }
}
//# sourceMappingURL=box-collider.js.map