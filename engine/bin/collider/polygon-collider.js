/* Canvas Lord v0.4.4 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class PolygonCollider extends Collider {
    type = 'polygon';
    points;
    get lines() {
        const lines = [];
        const { points } = this;
        const n = points.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            lines.push({
                x1: this.x + points[j][0],
                y1: this.y + points[j][1],
                x2: this.x + points[i][0],
                y2: this.y + points[i][1],
            });
        }
        return lines;
    }
    // TODO(bret): throw error if points are invalid
    constructor(points, x = 0, y = 0) {
        super(x, y);
        this.points = points;
    }
    render(ctx, x = 0, y = 0) {
        Draw.polygon(ctx, this.options, x + this.x, y + this.y, this.points);
    }
}
//# sourceMappingURL=polygon-collider.js.map