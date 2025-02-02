/* Canvas Lord v0.5.0 */
import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import { Draw } from '../util/draw.js';
const textCanvas = document.createElement('canvas');
const textCtx = textCanvas.getContext('2d');
export class Text extends Graphic {
    str;
    color = 'white'; // what do we want for default?
    type = 'fill';
    font = 'sans-serif';
    size = 10;
    align = 'left';
    // TODO(bret): check if this is the default we want :/
    baseline = 'top';
    constructor(str, x, y) {
        super(x, y);
        this.str = str;
    }
    centerOrigin() {
        if (!textCtx)
            throw new Error();
        const { font = 'sans-serif', size = 10, align = 'left', baseline = 'top', // TODO(bret): check if this is the default we want :/
        // count,
         } = this;
        textCtx.save();
        const _size = typeof size === 'number' ? `${size}px` : size;
        textCtx.font = `${_size} ${font}`;
        textCtx.textAlign = align;
        textCtx.textBaseline = baseline;
        const metrics = textCtx.measureText(this.str);
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        this.offsetX = -metrics.width / 2;
        this.offsetY = -height / 2;
        textCtx.restore();
    }
    render(ctx, camera = Vec2.zero) {
        const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
        const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
        Draw.text(ctx, this, x, y, this.str);
    }
}
//# sourceMappingURL=text.js.map