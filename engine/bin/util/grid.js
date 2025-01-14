import { indexToPos } from './math.js';
import { Draw, drawable } from './draw.js';
// TODO: find a better place for this to live globally
const pixelCanvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(1, 1)
    : document.createElement('canvas');
const options = { willReadFrequently: true };
const _pixelCtx = typeof OffscreenCanvas !== 'undefined'
    ? pixelCanvas.getContext('2d', options)
    : pixelCanvas.getContext('2d', options);
// const pixelCanvas =
// 	typeof OffscreenCanvas !== 'undefined'
// 		? new OffscreenCanvas(1, 1)
// 		: document.createElement('canvas');
// const options = { willReadFrequently: true };
// const _pixelCtx =
// 	typeof OffscreenCanvas !== 'undefined'
// 		? (pixelCanvas as OffscreenCanvas).getContext('2d', options)
// 		: (pixelCanvas as HTMLCanvasElement).getContext('2d', options);
if (!_pixelCtx) {
    throw Error('pixelCtx failed to create');
}
const pixelCtx = _pixelCtx;
export class Grid {
    constructor(width, height, tileW, tileH) {
        this.width = width;
        this.height = height;
        this.tileW = tileW;
        this.tileH = tileH;
        this.columns = Math.ceil(width / tileW);
        this.rows = Math.ceil(height / tileH);
        const size = this.columns * this.rows;
        this.color = 'rgba(255, 0, 0, 0.6)';
        this.renderMode = 2;
        this.data = Array.from({ length: size }, () => 0);
    }
    static fromBitmap(assetManager, src, tileW, tileH) {
        const sprite = assetManager.sprites.get(src);
        if (!sprite?.image) {
            throw new Error('image is not valid');
        }
        const width = sprite.width * tileW;
        const height = sprite.height * tileH;
        const stride = sprite.width;
        const grid = new Grid(width, height, tileW, tileH);
        grid.forEach((_, [x, y]) => {
            // @ts-ignore
            pixelCtx.drawImage(sprite.image, -x, -y);
            // @ts-ignore
            const { data } = pixelCtx.getImageData(0, 0, 1, 1);
            if (data[0] === 0) {
                grid.setTile(x, y, 1);
            }
        });
        return grid;
    }
    static fromBinary(data, tileW, tileH) {
        const [width, height, ...gridData] = data;
        const grid = new Grid(width * tileW, height * tileH, tileW, tileH);
        const stride = grid.columns;
        gridData
            .flatMap((b) => b.toString(2).padStart(32, '0').split(''))
            .forEach((v, i) => {
            const [x, y] = indexToPos(i, stride);
            grid.setTile(x, y, +v);
        });
        return grid;
    }
    forEach(callback) {
        const stride = this.columns;
        this.data
            .map((val, i) => [val, indexToPos(i, stride)])
            .forEach((args) => callback(...args));
    }
    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
    }
    setTile(x, y, value) {
        if (!this.inBounds(x, y))
            return;
        this.data[y * this.columns + x] = value;
    }
    getTile(x, y) {
        if (!this.inBounds(x, y))
            return 0;
        return this.data[y * this.columns + x];
    }
    renderOutline(ctx, camera) {
        const stride = this.columns;
        const width = this.tileW;
        const height = this.tileH;
        const [cameraX, cameraY] = camera;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        for (let y = 0; y < this.rows; ++y) {
            for (let x = 0; x < this.columns; ++x) {
                if (this.data[y * stride + x] === 1) {
                    const x1 = x * this.tileW + 0.5 - cameraX;
                    const y1 = y * this.tileH + 0.5 - cameraY;
                    const x2 = x1 + width - 1;
                    const y2 = y1 + height - 1;
                    if (!this.getTile(x - 1, y)) {
                        Draw.line(ctx, drawable, x1, y1, x1, y2);
                    }
                    if (!this.getTile(x + 1, y)) {
                        Draw.line(ctx, drawable, x2, y1, x2, y2);
                    }
                    if (!this.getTile(x, y - 1)) {
                        Draw.line(ctx, drawable, x1, y1, x2, y1);
                    }
                    if (!this.getTile(x, y + 1)) {
                        Draw.line(ctx, drawable, x1, y2, x2, y2);
                    }
                }
            }
        }
    }
    renderEachCell(ctx, camera, fill = false) {
        const stride = this.columns;
        const width = this.tileW - +!fill;
        const height = this.tileH - +!fill;
        const [cameraX, cameraY] = camera;
        if (fill)
            ctx.fillStyle = this.color;
        else
            ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        const drawRect = (...args) => fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);
        const offset = fill ? 0 : 0.5;
        for (let y = 0; y < this.rows; ++y) {
            for (let x = 0; x < this.columns; ++x) {
                if (this.data[y * stride + x] === 1) {
                    drawRect(x * this.tileW + offset - cameraX, y * this.tileH + offset - cameraY, width, height);
                }
            }
        }
    }
    render(ctx, camera) {
        switch (this.renderMode) {
            case 0:
                this.renderOutline(ctx, camera);
                break;
            case 1:
                this.renderEachCell(ctx, camera);
                break;
            case 2: {
                const temp = this.color;
                this.color = 'rgba(255, 0, 0, 0.3)';
                this.renderEachCell(ctx, camera, true);
                this.color = temp;
                this.renderEachCell(ctx, camera, false);
                break;
            }
        }
    }
}
//# sourceMappingURL=grid.js.map