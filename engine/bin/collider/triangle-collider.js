/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class TriangleCollider extends Collider {
    type = 'triangle';
    points;
    constructor(points, x = 0, y = 0) {
        super(x, y);
        this.points = points;
    }
    get x1() {
        return this.points[0][0];
    }
    set x1(value) {
        this.points[0][0] = value;
    }
    get y1() {
        return this.points[0][1];
    }
    set y1(value) {
        this.points[0][1] = value;
    }
    get x2() {
        return this.points[1][0];
    }
    set x2(value) {
        this.points[1][0] = value;
    }
    get y2() {
        return this.points[1][1];
    }
    set y2(value) {
        this.points[1][1] = value;
    }
    get x3() {
        return this.points[2][0];
    }
    set x3(value) {
        this.points[2][0] = value;
    }
    get y3() {
        return this.points[2][1];
    }
    set y3(value) {
        this.points[2][1] = value;
    }
    render(ctx, x = 0, y = 0) {
        Draw.polygon(ctx, this.options, x + this.x, y + this.y, this.points);
    }
}
//# sourceMappingURL=triangle-collider.js.map