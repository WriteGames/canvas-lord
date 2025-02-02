/* Canvas Lord v0.5.0 */
import { Graphic } from './graphic.js';
import type { ISpriteLike } from './sprite.js';
import type { ImageAsset } from '../core/asset-manager.js';
import type { Entity } from '../core/entity.js';
import type { Input } from '../core/input.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import { moveCanvas, Draw } from '../util/draw.js';
import { Random } from '../util/random.js';

interface Animation {
	name: string;
	frames: number[];
	frameRate: number;
	loop: boolean;
}

export class AnimatedSprite extends Graphic implements ISpriteLike {
	asset: ImageAsset;

	inc = 0;

	frame: number = 0;
	frameId: number = 0;
	frameW: number = 0;
	frameH: number = 0;
	framesPerRow: number = 0;

	sourceX: number = 0;
	sourceY: number = 0;
	sourceW: number | undefined;
	sourceH: number | undefined;

	color?: string;
	blend?: boolean;

	animations: Map<string, Animation> = new Map();
	currentAnimation?: Animation;

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

	get imageSrc(): HTMLImageElement {
		if (!this.asset.image) throw new Error("asset.image hasn't loaded yet");
		return this.asset.image;
	}

	constructor(asset: ImageAsset, frameW: number, frameH: number) {
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

	add(name: string, frames: number[], frameRate: number, loop = true) {
		const animation: Animation = {
			name,
			frames,
			frameRate,
			loop,
		};
		this.animations.set(name, animation);
	}

	// TODO(bret): Revisit this, we might want a `restart = false` override
	play(name?: string) {
		if (name === this.currentAnimation?.name) return;

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

	update() {
		if (this.currentAnimation) {
			const { frames, frameRate } = this.currentAnimation;
			this.frame = Math.floor(this.inc / frameRate);
			if (this.currentAnimation.loop) {
				this.frame %= frames.length;
			} else {
				this.frame = Math.min(this.frame, frames.length - 1);
			}
			this.frameId = frames[this.frame];
			++this.inc;
		}
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera = Vec2.zero) {
		const { frameId, frameW, frameH } = this;
		this.framesPerRow = this.imageSrc.width / frameW;

		const sourceX = (frameId % this.framesPerRow) * frameW;
		const sourceY = Math.floor(frameId / this.framesPerRow) * frameH;
		const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
		const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
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
