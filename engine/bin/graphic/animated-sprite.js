/* Canvas Lord v0.6.0 */
import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import { Draw } from '../util/draw.js';
export class AnimatedSprite extends Graphic {
    asset;
    inc = 0;
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
    done = false;
    animations = new Map();
    currentAnimation;
    callback;
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
    constructor(asset, frameW, frameH, callback) {
        super();
        this.asset = asset;
        if (frameW === undefined ||
            frameH === undefined)
            throw new Error('please supply frameW/frameH');
        this.frame = 0;
        this.frameId = 0;
        this.frameW = frameW;
        this.frameH = frameH;
        this.sourceX = 0;
        this.sourceY = 0;
        this.sourceW = asset.image?.width;
        this.sourceH = asset.image?.height;
        this.callback = callback;
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
    // TODO(bret): Revisit this, we might want a `restart = false` override
    play(name, reset = false, frame = 0) {
        if (!reset && name === this.currentAnimation?.name)
            return;
        this.currentAnimation =
            name !== undefined ? this.animations.get(name) : name;
        if (this.currentAnimation) {
            this.inc = frame * this.currentAnimation.frameRate;
            this.done = false;
        }
        else {
            this.inc = 0;
            this.done = true;
        }
        this.updateRect();
    }
    stop() {
        this.play();
    }
    centerOrigin() {
        this.originX = this.frameW >> 1;
        this.originY = this.frameH >> 1;
    }
    updateRect() {
        if (!this.currentAnimation)
            return;
        const { frames, frameRate } = this.currentAnimation;
        this.frame = Math.floor(this.inc / frameRate);
        if (this.currentAnimation.loop) {
            this.frame %= frames.length;
        }
        else {
            this.frame = Math.min(this.frame, frames.length - 1);
        }
        this.frameId = frames[this.frame];
    }
    update() {
        if (!this.currentAnimation || this.done)
            return;
        const { frames, frameRate } = this.currentAnimation;
        ++this.inc;
        let atEnd = false;
        const dur = frameRate * frames.length;
        if (this.inc >= dur) {
            atEnd = true;
            if (this.currentAnimation.loop) {
                this.inc -= dur;
            }
        }
        this.updateRect();
        if (atEnd) {
            if (!this.currentAnimation.loop) {
                this.done = true;
            }
            this.callback?.(this.currentAnimation.name);
        }
    }
    render(ctx, camera = Vec2.zero) {
        if (!this.visible)
            return;
        const { frameId, frameW, frameH } = this;
        this.framesPerRow = Math.floor(this.imageSrc.width / frameW);
        const sourceX = (frameId % this.framesPerRow) * frameW;
        const sourceY = Math.floor(frameId / this.framesPerRow) * frameH;
        let x = this.x - camera.x * this.scrollX;
        let y = this.y - camera.y * this.scrollY;
        if (this.relative) {
            x += this.parent?.x ?? 0;
            y += this.parent?.y ?? 0;
        }
        Draw.image(ctx, this, x, y, sourceX, sourceY, frameW, frameH);
    }
    reset() {
        super.reset();
        this.inc = 0;
        // TODO(bret): remove these and allow Draw.image to make them optional
        this.frame = 0;
        this.frameId = 0;
        this.frameW = 0;
        this.frameH = 0;
        this.framesPerRow = 0;
        this.sourceX = 0;
        this.sourceY = 0;
        this.sourceW = undefined;
        this.sourceH = undefined;
        this.color = undefined;
        this.blend = undefined;
        this.animations.clear();
        this.currentAnimation = undefined;
    }
}
//# sourceMappingURL=animated-sprite.js.map