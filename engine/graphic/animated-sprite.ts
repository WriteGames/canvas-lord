import type { ImageAsset } from '../core/asset-manager.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import type { Animation, AnimFrameKey, Frame } from './animation.js';
import type { Atlas } from './atlas.js';
import { Graphic } from './graphic.js';
import type { ISpriteLike } from './sprite.js';

type AnimCallback = (name: string) => void;

export class AnimatedSprite extends Graphic implements ISpriteLike {
	asset: ImageAsset;

	inc = 0;

	frame = 0;
	frameId = 0;
	frameW = 0;
	frameH = 0;

	frameData: Record<AnimFrameKey, Frame>;

	color?: string;
	blend?: boolean;

	done = false;

	animations = new Map<string, Animation>();
	currentAnimation?: Animation;
	currentFrame: Frame;
	callback?: AnimCallback;

	get width(): number {
		return this.imageSrc.width;
	}
	get w(): number {
		return this.width;
	}

	get height(): number {
		return this.imageSrc.height;
	}
	get h(): number {
		return this.height;
	}

	get imageSrc(): HTMLImageElement {
		if (!this.asset.image) throw new Error("asset.image hasn't loaded yet");
		return this.asset.image;
	}

	constructor(
		asset: ImageAsset,
		frameW: number,
		frameH: number,
		callback?: AnimCallback,
	) {
		super();
		this.asset = asset;

		if (
			(frameW as unknown) === undefined ||
			(frameH as unknown) === undefined
		)
			throw new Error('please supply frameW/frameH');

		// TYPE(bret): remove these two lines
		this.frameData = {};
		this.currentFrame = null as unknown as Frame;

		this.applyGrid(frameW, frameH);

		this.callback = callback;
	}

	applyGrid(frameW: number, frameH: number): this {
		this.frame = 0;
		this.frameId = 0;
		this.frameW = frameW;
		this.frameH = frameH;

		const framesPerRow = Math.floor(this.imageSrc.width / frameW);

		const map = (frameId: number): Frame => ({
			texture: this.asset,
			frame: {
				x: (frameId % framesPerRow) * frameW,
				y: Math.floor(frameId / framesPerRow) * frameH,
				w: frameW,
				h: frameH,
			},
		});

		const rowCount = Math.floor(this.imageSrc.height / frameH);
		const totalFrames = framesPerRow * rowCount;
		this.frameData = Object.fromEntries(
			Array.from({ length: totalFrames }, (_, i) => [i, map(i)]),
		);

		// TYPE(bret): Fix this
		const curFrame = this.frameData[0] as Frame | undefined;
		this.currentFrame = curFrame ?? {
			texture: this.asset,
			frame: {
				x: 0,
				y: 0,
				w: this.imageSrc.width,
				h: this.imageSrc.height,
			},
		};

		return this;
	}

	applyAtlas(atlas: Atlas): this {
		this.frame = 0;
		this.frameId = 0;

		// DECIDE(bret): We might want to have frameW/frameH be getters. However, using originX/Y gets really funky here
		this.frameW = this.imageSrc.width;
		this.frameH = this.imageSrc.height;

		this.frameData = atlas.frameData;
		const curFrame = Object.values(this.frameData)[0] as Frame | undefined;
		this.currentFrame = curFrame ?? {
			texture: this.asset,
			frame: {
				x: 0,
				y: 0,
				w: this.imageSrc.width,
				h: this.imageSrc.height,
			},
		};

		return this;
	}

	add(
		name: string,
		frames: AnimFrameKey[],
		frameRate: number,
		loop = true,
	): void {
		const animation: Animation = {
			name,
			frames,
			frameRate,
			loop,
		};
		this.animations.set(name, animation);
	}

	// DECIDE(bret): Revisit this, we might want a `restart = false` override
	play(name?: string, reset = false, frame = 0): void {
		if (!reset && name === this.currentAnimation?.name) return;

		this.currentAnimation =
			name !== undefined ? this.animations.get(name) : name;

		if (this.currentAnimation) {
			this.inc = frame * this.currentAnimation.frameRate;
			this.done = false;
		} else {
			this.inc = 0;
			this.done = true;
		}

		this.updateRect();
	}

	stop(): void {
		this.play();
	}

	centerOrigin(): void {
		this.originX = this.frameW >> 1;
		this.originY = this.frameH >> 1;
	}

	updateRect(): void {
		if (!this.currentAnimation) return;

		const { frames: frames2, frameRate } = this.currentAnimation;
		this.frame = Math.floor(this.inc / frameRate);
		if (this.currentAnimation.loop) {
			this.frame %= frames2.length;
		} else {
			this.frame = Math.min(this.frame, frames2.length - 1);
		}

		const key = frames2[this.frame];
		this.currentFrame = this.frameData[key];
	}

	update(): void {
		if (!this.currentAnimation || this.done) return;

		const { frames: frames2, frameRate } = this.currentAnimation;

		++this.inc;

		let atEnd = false;
		const dur = frameRate * frames2.length;
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

	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.visible) return;

		let x = this.x - camera.x * this.scrollX;
		let y = this.y - camera.y * this.scrollY;
		if (this.relative) {
			x += this.parent?.x ?? 0;
			y += this.parent?.y ?? 0;
		}

		if ('trimmed' in this.currentFrame) {
			const {
				anchor = { x: 0, y: 0 },
				frame,
				sourceSize,
				spriteSourceSize,
				trimmed,
				texture,
			} = this.currentFrame;

			const originX = anchor.x * frame.w;
			const originY = anchor.y * frame.h;

			let drawX = x + originX;
			let drawY = y + originY;
			if (trimmed) {
				drawX += spriteSourceSize.x;
				drawY += spriteSourceSize.y;
			}

			const sourceX = frame.x;
			const sourceY = frame.y;
			const w = frame.w;
			const h = frame.h;

			this.asset = texture;
			Draw.image(ctx, this, drawX, drawY, sourceX, sourceY, w, h);

			if (true as boolean) {
				Draw.rect(
					ctx,
					{
						color: 'lime',
						type: 'stroke',
					},
					x,
					y,
					sourceSize.w,
					sourceSize.h,
				);

				Draw.rect(
					ctx,
					{
						color: 'red',
						type: 'stroke',
					},
					drawX - originX,
					drawY - originY,
					w,
					h,
				);
			}
		} else {
			const { x: sX, y: sY, w, h } = this.currentFrame.frame;
			Draw.image(ctx, this, x, y, sX, sY, w, h);
		}
	}

	reset(): void {
		super.reset();

		this.inc = 0;

		this.frame = 0;
		this.frameId = 0;
		this.frameW = 0;
		this.frameH = 0;

		// TODO(bret): remove these and allow Draw.image to make them optional
		this.color = undefined;
		this.blend = undefined;

		this.animations.clear();
		this.currentAnimation = undefined;
		// DECIDE(bret): What do we want to set this to?
		// this.currentFrame = ???
		this.frameData = {};
	}
}
