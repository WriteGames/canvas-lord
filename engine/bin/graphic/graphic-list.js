/* Canvas Lord v0.6.0 */
import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import { moveCanvas } from '../util/draw.js';
export class GraphicList extends Graphic {
    graphics;
    constructor(...graphics) {
        super(0, 0);
        this.graphics = [];
        this.add(graphics);
    }
    centerOrigin() {
        // TODO(bret): what should this actually do?
        this.graphics.forEach((graphic) => graphic.centerOrigin());
    }
    add(...graphics) {
        graphics.flat().forEach((graphic) => {
            if (this.has(graphic))
                return;
            graphic.parent = this;
            this.graphics.push(graphic);
        });
    }
    has(graphic) {
        return this.graphics.includes(graphic);
    }
    remove(...graphics) {
        graphics.flat().forEach((graphic) => {
            if (!this.has(graphic))
                return;
            const index = this.graphics.indexOf(graphic);
            graphic.parent = undefined;
            this.graphics.splice(index, 1);
        });
    }
    update(input) {
        this.graphics.forEach((graphic) => graphic.update(input));
    }
    render(ctx, camera = Vec2.zero) {
        if (!this.visible)
            return;
        // TODO(bret): Set up transformations here!
        this.scrollX = this.scrollY = 0;
        const preX = this.x;
        const preY = this.y;
        let x = this.x - camera.x * this.scrollX;
        let y = this.y - camera.y * this.scrollY;
        if (this.relative) {
            x += this.parent?.x ?? 0;
            y += this.parent?.y ?? 0;
        }
        this.x = x;
        this.y = y;
        moveCanvas(() => {
            this.graphics.forEach((graphic) => graphic.render(ctx, camera));
        })(ctx, this, x, y);
        this.x = preX;
        this.y = preY;
    }
}
//# sourceMappingURL=graphic-list.js.map