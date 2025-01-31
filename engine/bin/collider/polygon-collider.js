/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import { Draw } from '../util/draw.js';
export class PolygonCollider extends Collider {
    type = 'polygon';
    #points;
    get vertices() {
        return this.#points.map((p) => {
            return [
                p[0] + this.x + this.parent.x,
                p[1] + this.y + this.parent.y,
            ];
        });
    }
    get lines() {
        const lines = [];
        const points = this.#points;
        const n = points.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            lines.push({
                x1: this.x + this.parent.x + points[j][0],
                y1: this.y + this.parent.y + points[j][1],
                x2: this.x + this.parent.x + points[i][0],
                y2: this.y + this.parent.y + points[i][1],
            });
        }
        return lines;
    }
    get edges() {
        const lines = this.lines;
        return lines.map(({ x1, y1, x2, y2 }) => new Vec2(x2 - x1, y2 - y1));
    }
    get axes() {
        const edges = this.edges;
        return edges.map(([_x, _y]) => new Vec2(-_y, _x));
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