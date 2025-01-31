/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import { Draw } from '../util/draw.js';
export class RightTriangleCollider extends Collider {
    type = 'right-triangle';
    width;
    height;
    #orientation;
    #points;
    get orientation() {
        return this.#orientation;
    }
    set orientation(value) {
        this.#orientation = value;
        this.#computePoints();
    }
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
    constructor(w, h, orientation, x = 0, y = 0) {
        super(x, y);
        this.width = w;
        this.height = h;
        this.#orientation = orientation;
        this.#computePoints();
    }
    get left() {
        return this.x;
    }
    get right() {
        return this.x + this.w - 1;
    }
    get top() {
        return this.y;
    }
    get bottom() {
        return this.y + this.h - 1;
    }
    get x1() {
        return this.#points[0][0];
    }
    get y1() {
        return this.#points[0][1];
    }
    get x2() {
        return this.#points[1][0];
    }
    get y2() {
        return this.#points[1][1];
    }
    get x3() {
        return this.#points[2][0];
    }
    get y3() {
        return this.#points[2][1];
    }
    #computePoints() {
        const TL = new Vec2(this.left, this.top);
        const TR = new Vec2(this.right, this.top);
        const BR = new Vec2(this.right, this.bottom);
        const BL = new Vec2(this.left, this.bottom);
        let points;
        switch (this.orientation) {
            case 'NE': {
                points = [
                    [TL[0], TL[1]],
                    [BR[0], BR[1]],
                    [BL[0], BL[1]],
                ];
                break;
            }
            case 'SE': {
                points = [
                    [TR[0], TR[1]],
                    [BL[0], BL[1]],
                    [TL[0], TL[1]],
                ];
                break;
            }
            case 'SW': {
                points = [
                    [BR[0], BR[1]],
                    [TL[0], TL[1]],
                    [TR[0], TR[1]],
                ];
                break;
            }
            case 'NW': {
                points = [
                    [BL[0], BL[1]],
                    [TR[0], TR[1]],
                    [BR[0], BR[1]],
                ];
                break;
            }
            default:
                const msg = `Orientation "${this.orientation}" not supported`;
                throw new Error(msg);
        }
        this.#points = points;
    }
    render(ctx, x = 0, y = 0) {
        Draw.polygon(ctx, this.options, x + this.x, y + this.y, this.#points);
    }
}
//# sourceMappingURL=right-triangle-collider.js.map