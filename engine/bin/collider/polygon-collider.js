/* Canvas Lord v0.6.0 */
import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import { Draw } from '../util/draw.js';
export class PolygonCollider extends Collider {
    type = 'polygon';
    #points;
    get left() {
        return Math.min(...this.vertices.map(([x]) => x - this.originX));
    }
    get top() {
        return Math.min(...this.vertices.map(([_, y]) => y - this.originY));
    }
    get right() {
        return Math.max(...this.vertices.map(([x]) => x - this.originX));
    }
    get bottom() {
        return Math.max(...this.vertices.map(([_, y]) => y - this.originY));
    }
    setPoints(value) {
        this.#points = value;
    }
    get vertices() {
        return this.#points.map(([x, y]) => [
            x + this.x + this.parent.x - this.originX,
            y + this.y + this.parent.y - this.originY,
        ]);
    }
    get lines() {
        const lines = [];
        const { vertices } = this;
        const n = vertices.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            lines.push({
                x1: vertices[j][0],
                y1: vertices[j][1],
                x2: vertices[i][0],
                y2: vertices[i][1],
            });
        }
        return lines;
    }
    get edges() {
        const lines = this.lines;
        return lines.map(({ x1, y1, x2, y2 }) => new Vec2(x2 - x1, y2 - y1));
    }
    get axes() {
        const axes = this.edges.map(([_x, _y]) => new Vec2(-_y, _x));
        axes.forEach((axis) => Vec2.normalize(axis));
        return axes;
    }
    // TODO(bret): throw error if points are invalid
    constructor(points, x = 0, y = 0) {
        super(x, y);
        this.#points = points;
    }
    render(ctx, x = 0, y = 0) {
        const drawX = x + this.parent.x;
        const drawY = y + this.parent.y;
        Draw.polygon(ctx, this.options, drawX, drawY, this.#points);
    }
}
//# sourceMappingURL=polygon-collider.js.map