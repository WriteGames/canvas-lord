/* Canvas Lord v0.6.1 */

import { Graphic } from './graphic.js';
import { Sprite } from './sprite.js';
import type { ImageAsset } from '../core/asset-manager.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import { generateCanvasAndCtx, type Canvas, type Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import { Random } from '../util/random.js';

interface MinMax<T> {
	min: T;
	max: T;
}

interface StartEnd<T> {
	start: T;
	end: T;
}

type Ease = (t: number) => number;

interface Particle {
	x: number;
	y: number;
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	startAngle: number;
	angle: number;
	rotation: number;
	elapsed: number;
	duration: number;
	t: number;
	type: ParticleType;
}

interface ParticleType {
	frames?: number[];
	alpha?: StartEnd<number>;
	alphaEase?: Ease;
	color?: {
		ctx: Ctx;
		samples: string[];
	};
	colorEase?: Ease;
	angle?: MinMax<number>;
	rotation?: MinMax<number>;
	rotationEase?: Ease;
	moveAngle?: MinMax<number>;
	distance?: MinMax<number>;
	duration?: MinMax<number>;
	motionEase?: Ease;
	particles: Particle[];
}

type Assignable = Extract<
	keyof ParticleType,
	| 'alpha'
	| 'color'
	| 'angle'
	| 'rotation'
	| 'moveAngle'
	| 'distance'
	| 'duration'
>;

export class Emitter extends Graphic {
	asset: ImageAsset;

	#types = new Map<string, ParticleType>();

	// TODO(bret): remove the seed
	random = new Random(2378495);
	// VALIDATE(bret): Ensure we want both of these to be able to be OffscreenCanvases
	imageSrc: Canvas | HTMLImageElement | null = null;
	blendCanvas: Canvas;

	// get imageSrc(): HTMLImageElement {
	// 	if (!this.asset.image) throw new Error("asset.image hasn't loaded yet");
	// 	return this.asset.image;
	// }

	constructor(asset: Sprite | ImageAsset, x: number, y: number) {
		super(x, y);

		let _asset = asset;

		// DECIDE(bret): Figure out how we want to handle this
		if (_asset instanceof Sprite) {
			_asset = _asset.asset;
		}

		this.asset = _asset;
		const { canvas } = generateCanvasAndCtx();
		if (!canvas) throw new Error();
		this.blendCanvas = canvas;
	}

	newType(name: string, frames?: number[]): void {
		this.#types.set(name, { frames, particles: [] });
	}

	getType(name: string): ParticleType {
		const type = this.#types.get(name);
		if (!type) throw new Error(`${name} is not set`);
		return type;
	}

	assignToType<T extends Assignable>(
		type: ParticleType,
		field: T,
		value: ParticleType[T],
	): void {
		type[field] = Object.assign(type[field] ?? {}, value);
	}

	setAlpha(
		name: string,
		start: number,
		end: number,
		ease: Ease,
	): ParticleType {
		const type = this.getType(name);
		this.assignToType(type, 'alpha', { start, end });
		type.alphaEase = ease;
		return type;
	}

	setAngle(name: string, min: number, max: number): ParticleType {
		const type = this.getType(name);
		this.assignToType(type, 'angle', { min, max });
		return type;
	}

	setRotation(
		name: string,
		min: number,
		max: number,
		ease: Ease,
	): ParticleType {
		const type = this.getType(name);
		this.assignToType(type, 'rotation', { min, max });
		type.rotationEase = ease;
		return type;
	}

	// OPTIMIZE(bret): Make this better, might need to wait for WebGL/WebGPU

	setColor(
		name: string,
		start: string,
		end: string,
		ease: Ease,
		resolution = 250,
	): ParticleType {
		const type = this.getType(name);
		let ctx = type.color?.ctx ?? null;
		if (!type.color) {
			({ ctx } = generateCanvasAndCtx(resolution, 1, {
				willReadFrequently: true,
			}));
		}
		if (!ctx) throw new Error();
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

	setMotion(
		name: string,
		moveAngle: number,
		distance: number,
		duration: number,
		moveAngleRange = 0,
		distanceRange = 0,
		durationRange = 0,
		ease?: Ease,
	): ParticleType {
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

	emit(name: string, x: number, y: number): void {
		const type = this.#types.get(name);
		if (!type) throw new Error(`${name} is not set`);

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

		const particle: Particle = {
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

	update(): void {
		[...this.#types.entries()].forEach(([_, type]) => {
			type.particles = type.particles.filter(
				(particle) => particle.elapsed < particle.duration,
			);
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

	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.visible) return;

		let x = this.x - camera.x * this.scrollX;
		let y = this.y - camera.y * this.scrollY;
		if (this.relative) {
			x += this.parent?.x ?? 0;
			y += this.parent?.y ?? 0;
		}

		const { image } = this.asset;
		if (!image) throw new Error();

		const { blendCanvas } = this;
		blendCanvas.width = image.width;
		blendCanvas.height = image.height;
		const { width, height } = blendCanvas;
		// DECIDE(bret): We might want to cache this
		const blendCtx = blendCanvas.getContext('2d') as Ctx | null;
		if (!blendCtx) throw new Error();

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
					// VALIDATE(bret): we'll never hit 1.0 :(
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
