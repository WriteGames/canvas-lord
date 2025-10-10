/* Canvas Lord v0.6.1 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
import { Vec2 } from '../math/index.js';
export class CircleCollider extends Collider {
    type = 'circle';
    radius;
    get r() {
        return this.radius;
    }
    set r(value) {
        this.radius = value;
    }
    get w() {
        return this.width;
    }
    set w(_value) {
        throw new Error('cannot set width of circle');
    }
    get h() {
        return this.height;
    }
    set h(_value) {
        throw new Error('cannot set height of circle');
    }
    get width() {
        return this.radius * 2;
    }
    set width(_value) {
        throw new Error('cannot set width of circle');
    }
    get height() {
        return this.radius * 2;
    }
    set height(_value) {
        throw new Error('cannot set height of circle');
    }
    get left() {
        return this.parent.x + this.x - this.originX - (this.radius - 0.5);
    }
    get right() {
        return this.parent.x + this.x - this.originX + (this.radius - 0.5);
    }
    get top() {
        return this.parent.y + this.y - this.originY - (this.radius - 0.5);
    }
    get bottom() {
        return this.parent.y + this.y - this.originY + (this.radius - 0.5);
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
    centerOrigin() {
        this.originX = this.w / 2;
        this.originY = this.h / 2;
    }
    centerOO() {
        this.centerOrigin();
    }
    render(ctx, x, y) {
        if (this.collidable)
            this.options.color = this.color;
        Draw.circle(ctx, this.options, x + this.centerX - this.r, y + this.centerY - this.r, this.r);
    }
}
//# sourceMappingURL=circle-collider.js.map