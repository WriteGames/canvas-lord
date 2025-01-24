import { Draw } from './draw.js';
const tempCanvas = document.createElement('canvas');
export class Graphic {
    x;
    y;
    angle = 0;
    scaleX = 1;
    scaleY = 1;
    originX = 0;
    originY = 0;
    // TODO(bret): get rid of these :) they're really just the x/y
    offsetX = 0;
    offsetY = 0;
    entity;
    // TODO(bret): What should get scale() return??
    set scale(value) {
        this.scaleX = this.scaleY = value;
    }
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    centerOrigin() {
        // TODO(bret): check if invalidated, if so, recalculate!
    }
    centerOO() {
        this.centerOrigin();
    }
    render(ctx, camera) { }
}
export class Sprite extends Graphic {
    asset;
    imageSrc;
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
    constructor(asset, x = 0, y = 0) {
        if (!asset.image)
            throw new Error();
        super(x, y);
        this.asset = asset;
        // TODO: need to do this better
        this.imageSrc = asset.image;
    }
    centerOrigin() {
        this.offsetX = -this.width >> 1;
        this.offsetY = -this.height >> 1;
        this.originX = -this.width >> 1;
        this.originY = -this.height >> 1;
    }
    render(ctx, camera) {
        const x = this.x - camera.x + (this.entity?.x ?? 0);
        const y = this.y - camera.y + (this.entity?.y ?? 0);
        // @ts-expect-error
        Draw.image(ctx, this, x, y);
    }
}
//# sourceMappingURL=graphic.js.map