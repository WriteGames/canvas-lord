/* Canvas Lord v0.6.1 */
import { Vec2 } from '../math/index.js';
export class Graphic {
    x;
    y;
    angle = 0;
    scaleX = 1;
    scaleY = 1;
    originX = 0;
    originY = 0;
    scrollX = 1;
    scrollY = 1;
    alpha = 1;
    parent;
    relative = true;
    visible = true;
    get scale() {
        return this.scaleX;
    }
    set scale(value) {
        this.scaleX = this.scaleY = value;
    }
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    centerOrigin() {
        // TODO(bret): check if invalidated, if so, recalculate!
        throw new Error('unimplemented');
    }
    centerOO() {
        this.centerOrigin();
    }
    update(_input) {
        //
    }
    render(_ctx, _camera = Vec2.zero) {
        //
    }
    reset() {
        this.x = 0;
        this.y = 0;
        this.alpha = 1;
        this.angle = 0;
        this.scaleX = 0;
        this.scaleY = 0;
        this.scrollX = 1;
        this.scrollY = 1;
        this.relative = true;
    }
}
//# sourceMappingURL=graphic.js.map