/* Canvas Lord v0.6.0 */
import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import { Draw } from '../util/draw.js';
const assetHasImage = (asset) => asset.image !== null;
// TODO(bret): How to tile?
export class Sprite extends Graphic {
    asset;
    sourceX = 0;
    sourceY = 0;
    sourceW;
    sourceH;
    color;
    blend;
    get width() {
        return this.imageSrc.width;
    }
    get w() {
        return this.width;
    }
    get height() {
        return this.imageSrc.height;
    }
    get h() {
        return this.height;
    }
    get imageSrc() {
        if (!this.asset.image)
            throw new Error("asset.image hasn't loaded yet");
        return this.asset.image;
    }
    constructor(asset, x = 0, y = 0, sourceX = 0, sourceY = 0, sourceW = undefined, sourceH = undefined) {
        super(x, y);
        this.asset = asset;
        this.sourceX = sourceX;
        this.sourceY = sourceY;
        this.sourceW = sourceW;
        this.sourceH = sourceH;
    }
    static createImage(width, height, fileName, callback) {
        // TODO(bret): use generateCanvasAndCtx
        // const { canvas, ctx } = generateCanvasAndCtx(width, height);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('[Sprite.createRect()] getContext() failed');
        callback(ctx);
        const asset = {
            // TODO(bret): Could hash these & put them in assetManager :O
            fileName,
            image: null,
            loaded: false,
        };
        const img = new Image(width, height);
        img.onload = () => {
            asset.image = img;
            if (assetHasImage(asset)) {
                asset.width = width;
                asset.height = height;
                asset.loaded = true;
            }
        };
        img.src = canvas.toDataURL();
        // TODO(bret): This might be dangerous!! It unfortunately is needed for new Sprite() to work :/
        asset.loaded = true;
        asset.image = img;
        return new Sprite(asset);
    }
    static createRect(width, height, color) {
        const fileName = ['createRect', width, height, color].join('-');
        return Sprite.createImage(width, height, fileName, (ctx) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        });
    }
    static createCircle(size, color) {
        const fileName = ['createCircle', size, color].join('-');
        const halfSize = size * 0.5;
        return Sprite.createImage(size, size, fileName, (ctx) => {
            ctx.translate(halfSize, halfSize);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    centerOrigin() {
        this.originX = this.width / 2;
        this.originY = this.height / 2;
    }
    render(ctx, camera = Vec2.zero) {
        if (!this.visible)
            return;
        const { sourceX, sourceY, sourceW = this.width, sourceH = this.height, } = this;
        let x = this.x - camera.x * this.scrollX;
        let y = this.y - camera.y * this.scrollY;
        if (this.relative) {
            x += this.parent?.x ?? 0;
            y += this.parent?.y ?? 0;
        }
        Draw.image(ctx, this, x, y, sourceX, sourceY, sourceW, sourceH);
    }
    reset() {
        super.reset();
        this.sourceX = 0;
        this.sourceY = 0;
        this.sourceW = undefined;
        this.sourceH = undefined;
        this.color = undefined;
        this.blend = undefined;
    }
}
//# sourceMappingURL=sprite.js.map