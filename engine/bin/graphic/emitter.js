/* Canvas Lord v0.6.0 */
import { Graphic } from './graphic.js';
import { Sprite } from './sprite.js';
import { Vec2 } from '../math/index.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import { Random } from '../util/random.js';
export class Emitter extends Graphic {
    asset;
    #types = new Map();
    // TODO(bret): remove the seed
    random = new Random(2378495);
    // TODO(bret): Ensure we want both of these to be able to be OffscreenCanvases
    imageSrc = null;
    blendCanvas;
    // get imageSrc(): HTMLImageElement {
    // 	if (!this.asset.image) throw new Error("asset.image hasn't loaded yet");
    // 	return this.asset.image;
    // }
    constructor(asset, x, y) {
        super(x, y);
        let _asset = asset;
        // TODO(bret): Figure out how we want to handle this
        if (_asset instanceof Sprite) {
            _asset = _asset.asset;
        }
        this.asset = _asset;
        const { canvas } = generateCanvasAndCtx();
        if (!canvas)
            throw new Error();
        this.blendCanvas = canvas;
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
            ({ ctx } = generateCanvasAndCtx(resolution, 1, {
                willReadFrequently: true,
            }));
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
            return `#${hex.join('')}`;
        });
        type.colorEase = ease;
        this.assignToType(type, 'color', { ctx, samples });
        return type;
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
        [...this.#types.entries()].forEach(([_, type]) => {
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
    render(ctx, camera = Vec2.zero) {
        if (!this.visible)
            return;
        let x = this.x - camera.x * this.scrollX;
        let y = this.y - camera.y * this.scrollY;
        if (this.relative) {
            x += this.parent?.x ?? 0;
            y += this.parent?.y ?? 0;
        }
        const { image } = this.asset;
        if (!image)
            throw new Error();
        const { blendCanvas } = this;
        blendCanvas.width = image.width;
        blendCanvas.height = image.height;
        const { width, height } = blendCanvas;
        // TODO(bret): We might want to cache this
        const blendCtx = blendCanvas.getContext('2d');
        if (!blendCtx)
            throw new Error();
        [...this.#types.entries()].forEach(([_, type]) => {
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
                this.originX = -(width >> 1);
                this.originY = -(height >> 1);
                Draw.image(ctx, this, drawX, drawY);
            });
        });
    }
}
//# sourceMappingURL=emitter.js.map