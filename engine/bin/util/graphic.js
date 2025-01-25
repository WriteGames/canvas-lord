import { moveCanvas, Draw } from './draw.js';
import { Random } from './random.js';
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
    scrollX = 1;
    scrollY = 1;
    alpha = 1;
    parent;
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
        throw new Error('unimplemented');
    }
    centerOO() {
        this.centerOrigin();
    }
    update(input) { }
    render(ctx, camera) { }
}
export class GraphicList extends Graphic {
    graphics;
    constructor(x = 0, y = 0) {
        super(x, y);
        this.graphics = [];
    }
    centerOrigin() {
        // TODO(bret): what should this actually do?
        this.graphics.forEach((graphic) => graphic.centerOrigin());
    }
    add(graphic) {
        if (this.has(graphic))
            return;
        graphic.parent = this;
        this.graphics.push(graphic);
    }
    has(graphic) {
        const index = this.graphics.indexOf(graphic);
        return index > -1;
    }
    remove(graphic) {
        if (!this.has(graphic))
            return;
        const index = this.graphics.indexOf(graphic);
        graphic.parent = undefined;
        this.graphics.splice(index, 1);
    }
    update(input) {
        this.graphics.forEach((graphic) => graphic.update(input));
    }
    render(ctx, camera) {
        // TODO(bret): Set up transformations here!
        this.scrollX = this.scrollY = 0;
        const r = 3;
        const preX = this.x;
        const preY = this.y;
        const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
        const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
        this.x = x;
        this.y = y;
        moveCanvas(() => {
            this.graphics.forEach((graphic) => graphic.render(ctx, camera));
        })(ctx, this, x, y);
        this.x = preX;
        this.y = preY;
    }
}
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
    render(ctx, camera) {
        const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
        const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
        Draw.text(ctx, this, x, y, this.str);
    }
}
// TODO(bret): How to tile?
export class Sprite extends Graphic {
    asset;
    // TODO(bret): remove these and allow Draw.image to make them optional
    frame = 0;
    frameW = 0;
    frameH = 0;
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
    static createRect(width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('[Sprite.createRect()] getContext() failed');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const asset = {
            // TODO(bret): Could hash these & put them in assetManager :O
            fileName: [width, height, color].join('-'),
            image: null,
            loaded: false,
        };
        const img = new Image(width, height);
        img.onload = () => {
            if ((asset.image = img)) {
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
    centerOrigin() {
        this.offsetX = -this.width >> 1;
        this.offsetY = -this.height >> 1;
        this.originX = -this.width >> 1;
        this.originY = -this.height >> 1;
    }
    render(ctx, camera) {
        const { sourceX, sourceY, sourceW = this.width, sourceH = this.height, } = this;
        const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
        const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
        Draw.image(ctx, this, x, y, sourceX, sourceY, sourceW, sourceH);
    }
}
export class AnimatedSprite extends Graphic {
    asset;
    // TODO(bret): remove these and allow Draw.image to make them optional
    frame = 0;
    frameId = 0;
    frameW = 0;
    frameH = 0;
    framesPerRow = 0;
    sourceX = 0;
    sourceY = 0;
    sourceW;
    sourceH;
    color;
    blend;
    animations = new Map();
    currentAnimation;
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
    constructor(asset, frameW, frameH) {
        super();
        this.asset = asset;
        if (frameW === undefined || frameH === undefined)
            throw new Error('please supply frameW/frameH');
        this.frame = 0;
        this.frameId = 0;
        this.frameW = frameW;
        this.frameH = frameH;
        this.sourceX = 0;
        this.sourceY = 0;
        this.sourceW = asset.image?.width;
        this.sourceH = asset.image?.height;
    }
    add(name, frames, frameRate, loop = true) {
        const animation = {
            name,
            frames,
            frameRate,
            loop,
        };
        this.animations.set(name, animation);
    }
    play(name) {
        this.inc = 0;
        this.currentAnimation =
            name !== undefined ? this.animations.get(name) : name;
    }
    stop() {
        this.play();
    }
    centerOrigin() {
        this.offsetX = -this.frameW >> 1;
        this.offsetY = -this.frameH >> 1;
        this.originX = -this.frameW >> 1;
        this.originY = -this.frameH >> 1;
    }
    inc = 0;
    update() {
        if (this.currentAnimation) {
            const { frames, frameRate } = this.currentAnimation;
            this.frame = Math.floor(this.inc / frameRate) % frames.length;
            this.frameId = frames[this.frame];
            ++this.inc;
        }
    }
    render(ctx, camera) {
        const { frameId, frameW, frameH } = this;
        this.framesPerRow = this.imageSrc.width / frameW;
        const sourceX = (frameId % this.framesPerRow) * frameW;
        const sourceY = Math.floor(frameId / this.framesPerRow) * frameH;
        const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
        const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
        Draw.image(ctx, this, x, y, sourceX, sourceY, frameW, frameH);
    }
}
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
    // TODO(bret): remove these and allow Draw.image to make them optional
    frame = 0;
    frameW = 0;
    frameH = 0;
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
    render(ctx, camera) {
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
export class Emitter extends Graphic {
    asset;
    // TODO(bret): remove these and allow Draw.image to make them optional
    frame = 0;
    frameW = 0;
    frameH = 0;
    #types = new Map();
    // TODO(bret): remove the seed
    random = new Random(2378495);
    imageSrc = null;
    blendCanvas;
    // get imageSrc(): HTMLImageElement {
    // 	if (!this.asset.image) throw new Error("asset.image hasn't loaded yet");
    // 	return this.asset.image;
    // }
    constructor(asset, x, y) {
        super(x, y);
        // TODO(bret): Figure out how we want to handle this
        if (asset instanceof Sprite) {
            asset = asset.asset;
        }
        this.asset = asset;
        this.blendCanvas = document.createElement('canvas');
    }
    newType(name, frames) {
        this.#types.set(name, { frames, particles: [] });
    }
    getType(name) {
        const type = this.#types.get(name);
        if (!type)
            throw new Error(`${name} is not set`);
        return type;
    }
    assignToType(type, field, value) {
        type[field] = Object.assign(type[field] ?? {}, value);
    }
    setAlpha(name, start, end, ease) {
        const type = this.getType(name);
        this.assignToType(type, 'alpha', { start, end });
        type.alphaEase = ease;
        return type;
    }
    setAngle(name, min, max) {
        const type = this.getType(name);
        this.assignToType(type, 'angle', { min, max });
        return type;
    }
    setRotation(name, min, max, ease) {
        const type = this.getType(name);
        this.assignToType(type, 'rotation', { min, max });
        type.rotationEase = ease;
        return type;
    }
    // TODO(bret): Make this better, might need to wait for WebGL/WebGPU
    setColor(name, start, end, ease, resolution = 250) {
        const type = this.getType(name);
        let ctx = type.color?.ctx ?? null;
        if (!type.color) {
            const canvas = document.createElement('canvas');
            canvas.width = resolution;
            canvas.height = 1;
            ctx = canvas.getContext('2d');
        }
        if (!ctx)
            throw new Error();
        const gradient = ctx.createLinearGradient(0, 0, resolution, 1);
        gradient.addColorStop(0, start);
        gradient.addColorStop(1, end);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, resolution, 1);
        const samples = Array.from({ length: resolution }, (_, i) => {
            const { data } = ctx.getImageData(i, 0, 1, 1);
            const hex = [...data].map((c) => c.toString(16).padStart(2, '0'));
            return '#' + hex.join('');
        });
        type.colorEase = ease;
        return this.assignToType(type, 'color', { ctx, samples });
    }
    setMotion(name, moveAngle, distance, duration, moveAngleRange = 0, distanceRange = 0, durationRange = 0, ease) {
        const type = this.getType(name);
        this.assignToType(type, 'moveAngle', {
            min: moveAngle,
            max: moveAngle + moveAngleRange,
        });
        this.assignToType(type, 'distance', {
            min: distance,
            max: distance + distanceRange,
        });
        this.assignToType(type, 'duration', {
            min: duration,
            max: duration + durationRange,
        });
        type.motionEase = ease;
        return type;
    }
    emit(name, x, y) {
        const type = this.#types.get(name);
        if (!type)
            throw new Error(`${name} is not set`);
        const { random } = this;
        const moveAngle = type.moveAngle
            ? (random.range(type.moveAngle.min, type.moveAngle.max) * Math.PI) /
                180.0
            : 0;
        const angle = type.angle
            ? random.range(type.angle.min, type.angle.max)
            : 0;
        const rotation = type.rotation
            ? random.range(type.rotation.min, type.rotation.max) *
                this.random.sign()
            : 0;
        const duration = type.duration
            ? random.range(type.duration.min, type.duration.max)
            : 1;
        const distance = type.distance
            ? random.range(type.distance.min, type.distance.max)
            : 1;
        const endX = x + distance * Math.cos(moveAngle);
        const endY = y + distance * Math.sin(moveAngle);
        const particle = {
            x,
            y,
            startX: x,
            startY: y,
            endX,
            endY,
            startAngle: angle,
            angle,
            rotation,
            elapsed: 0,
            duration,
            t: 0,
            type,
        };
        // TODO(bret): Set up particles.toAdd/toDelete & a pool
        type.particles.push(particle);
    }
    update() {
        [...this.#types.entries()].forEach(([name, type]) => {
            type.particles = type.particles.filter((particle) => particle.elapsed < particle.duration);
            type.particles.forEach((particle) => {
                const motionT = type.motionEase?.(particle.t) ?? particle.t;
                particle.x = Math.lerp(particle.startX, particle.endX, motionT);
                particle.y = Math.lerp(particle.startY, particle.endY, motionT);
                particle.t = particle.elapsed / particle.duration;
                const angleT = type.rotationEase?.(particle.t) ?? particle.t;
                particle.angle =
                    particle.startAngle + particle.rotation * angleT;
                ++particle.elapsed;
            });
        });
    }
    render(ctx, camera) {
        const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
        const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
        const { image } = this.asset;
        if (!image)
            throw new Error();
        const { blendCanvas } = this;
        blendCanvas.width = image.width;
        blendCanvas.height = image.height;
        const { width, height } = blendCanvas;
        // TODO(bret): We might want to catch this
        const blendCtx = blendCanvas.getContext('2d');
        if (!blendCtx)
            throw new Error();
        [...this.#types.entries()].forEach(([name, type]) => {
            type.particles.forEach((particle) => {
                this.alpha = 1;
                if (particle.type.alpha) {
                    const { start, end } = particle.type.alpha;
                    this.alpha = Math.lerp(start, end, particle.t);
                }
                // TODO(bret): Draw.image now supports blending colors, might wanna switch this over!
                if (particle.type.color) {
                    const { samples } = particle.type.color;
                    // TODO(bret): we'll never hit 1.0 :(
                    const colorT = type.colorEase?.(particle.t) ?? particle.t;
                    const i = Math.round(colorT * (samples.length - 1));
                    blendCtx.save();
                    blendCtx.clearRect(0, 0, width, height);
                    blendCtx.drawImage(image, 0, 0);
                    blendCtx.globalCompositeOperation = 'source-atop';
                    blendCtx.fillStyle = samples[i];
                    blendCtx.fillRect(0, 0, width, height);
                    blendCtx.restore();
                }
                this.imageSrc = blendCanvas;
                const drawX = x + particle.x;
                const drawY = y + particle.y;
                this.angle = particle.angle;
                // TODO(bret): unhardcode centered particles!
                this.offsetX = -(width >> 1);
                this.originX = this.offsetX;
                this.offsetY = -(height >> 1);
                this.originY = this.offsetY;
                Draw.image(ctx, this, drawX, drawY);
            });
        });
    }
}
//# sourceMappingURL=graphic.js.map