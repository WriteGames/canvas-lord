/* Canvas Lord v0.5.1 */
import { Vec2 } from '../math/index.js';
// TODO(bret): extend Graphic!!
export class Tileset {
    constructor(sprite, width, height, tileW, tileH, options = {}) {
        this.width = width;
        this.height = height;
        this.tileW = tileW;
        this.tileH = tileH;
        this.columns = Math.ceil(width / tileW);
        this.rows = Math.ceil(height / tileH);
        this.sprite = sprite;
        this.data = Array.from({ length: this.columns * this.rows }, (v) => null);
        this.startX = options.startX ?? 1;
        this.startY = options.startY ?? 1;
        this.separation = options.separation ?? 1;
    }
    setTile(x, y, tileX, tileY) {
        if (x < 0 || y < 0 || x >= this.columns || y >= this.rows)
            return;
        this.data[y * this.columns + x] = new Vec2(tileX, tileY);
    }
    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.columns || y >= this.rows)
            return null;
        return this.data[y * this.columns + x];
    }
    render(ctx, camera = Vec2.zero) {
        const scale = 1;
        const { sprite: image, separation, startX, startY, tileW, tileH, } = this;
        if (!image.image)
            throw new Error('Tileset is missing an image');
        const srcCols = Math.floor(image.width / tileW);
        const srcRows = Math.floor(image.height / tileH);
        const [cameraX, cameraY] = camera;
        const offsetX = this.parent?.x ?? 0;
        const offsetY = this.parent?.y ?? 0;
        for (let y = 0; y < this.rows; ++y) {
            for (let x = 0; x < this.columns; ++x) {
                const val = this.data[y * this.columns + x];
                if (val) {
                    const [tileX, tileY] = val;
                    const srcX = startX + (separation + tileW) * tileX;
                    const srcY = startY + (separation + tileH) * tileY;
                    const dstX = x * tileW - cameraX + offsetX;
                    const dstY = y * tileH - cameraY + offsetY;
                    ctx.drawImage(image.image, srcX, srcY, tileW, tileH, dstX, dstY, tileW * scale, tileH * scale);
                }
            }
        }
    }
}
//# sourceMappingURL=tileset.js.map