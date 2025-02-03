/* Canvas Lord v0.5.1 */
import { Collider } from './collider.js';
import { Draw } from '../util/draw.js';
export class LineCollider extends Collider {
    type = 'line';
    x1;
    y1;
    x2;
    y2;
    get start() {
        return {
            x: this.xStart,
            left: this.xStart,
            right: this.xStart,
            y: this.yStart,
            top: this.yStart,
            bottom: this.yStart,
        };
    }
    get end() {
        return {
            x: this.xEnd,
            left: this.xEnd,
            right: this.xEnd,
            y: this.yEnd,
            top: this.yEnd,
            bottom: this.yEnd,
        };
    }
    get xStart() {
        return this.x1 + this.parent.x;
    }
    get yStart() {
        return this.y1 + this.parent.y;
    }
    get xEnd() {
        return this.x2 + this.parent.x;
    }
    get yEnd() {
        return this.y2 + this.parent.y;
    }
    constructor(x1, y1, x2, y2, x = 0, y = 0) {
        super(x, y);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    render(ctx, x = 0, y = 0) {
        const x1 = x + this.xStart;
        const y1 = y + this.yStart;
        const x2 = x + this.xEnd;
        const y2 = y + this.yEnd;
        Draw.line(ctx, this.options, x1, y1, x2, y2);
    }
}
//# sourceMappingURL=line-collider.js.map