/* Canvas Lord v0.5.3 */
import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
const { canvas: tempCanvas } = generateCanvasAndCtx();
// TODO(bret): Could have this extend from Sprite maybe, or a new parent class... hmm...
export class NineSlice extends Graphic {
    asset;
    width;
    height;
    tileW;
    tileH;
    color;
    blend;
    get imageSrc() {
        if (!this.asset.image)
            throw new Error("asset.image hasn't loaded yet");
        return this.asset.image;
    }
    // TODO(bret): See if we can remove this - they get set in recalculate()
    patternT;
    patternL;
    patternR;
    patternB;
    patternC;
    // TODO(bret): Allow for custom tileW/tileH, along with non-uniform sizes
    constructor(asset, x, y, w, h) {
        if (!asset.image)
            throw new Error();
        super(x, y);
        this.asset = asset;
        this.width = w;
        this.height = h;
        this.tileW = asset.image.width / 3;
        this.tileH = asset.image.height / 3;
        this.recalculate();
    }
    recalculate() {
        if (!tempCanvas) {
            throw new Error('tempCanvas failed to create');
        }
        const { tileW: w, tileH: h } = this;
        tempCanvas.width = this.tileW;
        tempCanvas.height = this.tileH;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx)
            throw new Error();
        // top
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        Draw.image(ctx, this, 0, 0, w, 0, w, h);
        const patternT = ctx.createPattern(tempCanvas, 'repeat-x');
        if (patternT === null)
            throw new Error();
        this.patternT = patternT;
        // bottom
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        Draw.image(ctx, this, 0, 0, w, h * 2, w, h);
        const patternB = ctx.createPattern(tempCanvas, 'repeat-x');
        if (patternB === null)
            throw new Error();
        this.patternB = patternB;
        // left
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        Draw.image(ctx, this, 0, 0, 0, h, w, h);
        const patternL = ctx.createPattern(tempCanvas, 'repeat-y');
        if (patternL === null)
            throw new Error();
        this.patternL = patternL;
        // right
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        Draw.image(ctx, this, 0, 0, w * 2, h, w, h);
        const patternR = ctx.createPattern(tempCanvas, 'repeat-y');
        if (patternR === null)
            throw new Error();
        this.patternR = patternR;
        // center
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        Draw.image(ctx, this, 0, 0, w, h, w, h);
        const patternC = ctx.createPattern(tempCanvas, 'repeat');
        if (patternC === null)
            throw new Error();
        this.patternC = patternC;
    }
    // TODO: hook up moveCanvas
    render(ctx, camera = Vec2.zero) {
        const o = this;
        const x = this.x - camera.x * this.scrollX;
        const y = this.y - camera.y * this.scrollY;
        const { tileW: w, tileH: h } = this;
        const right = x + this.width - w;
        const bottom = y + this.height - h;
        const centerW = this.width - w * 2;
        const centerH = this.height - h * 2;
        Draw.image(ctx, this, x, y, 0, 0, w, h); // top left
        Draw.image(ctx, this, x, bottom, 0, h * 2, w, h); // bottom left
        Draw.image(ctx, this, right, y, w * 2, 0, w, h); // top right
        Draw.image(ctx, this, right, bottom, w * 2, h * 2, w, h); // bottom right
        ctx.save();
        ctx.fillStyle = this.patternT; // top
        ctx.translate(x + w, y);
        ctx.fillRect(0, 0, centerW, h);
        ctx.fillStyle = this.patternB; // bottom
        ctx.translate(0, bottom - y);
        ctx.fillRect(0, 0, centerW, h);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = this.patternL; // left
        ctx.translate(x, y + h);
        ctx.fillRect(0, 0, w, centerH);
        ctx.fillStyle = this.patternR; // right
        ctx.translate(right - x, 0);
        ctx.fillRect(0, 0, w, centerH);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = this.patternC; // center
        ctx.translate(x + w, y + h);
        ctx.fillRect(0, 0, centerW, centerH);
        ctx.restore();
    }
}
//# sourceMappingURL=nine-slice.js.map