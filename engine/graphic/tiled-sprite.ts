/* Canvas Lord v0.6.1 */

import { Graphic } from './graphic.js';
import type { ISpriteLike } from './sprite.js';
import type { ImageAsset } from '../core/asset-manager.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

const { canvas: tempCanvas } = generateCanvasAndCtx();

export const REPEAT_STYLE = {
	NO: 'no-repeat',
	XY: 'repeat',
	X: 'repeat-x',
	Y: 'repeat-y',
} as const;

export type RepeatStyle = (typeof REPEAT_STYLE)[keyof typeof REPEAT_STYLE];

// DECIDE(bret): Could have this extend from Sprite maybe, or a new parent class... hmm...
export class TiledSprite extends Graphic implements ISpriteLike {
	asset: ImageAsset;

	color?: string;
	blend?: boolean;

	repeatStyle: RepeatStyle;

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

	pattern!: CanvasPattern;

	constructor(
		asset: ImageAsset,
		x = 0,
		y = 0,
		repeatStyle: RepeatStyle = REPEAT_STYLE.XY,
	) {
		if (!asset.image) throw new Error();

		super(x, y);
		this.asset = asset;
		this.repeatStyle = repeatStyle;

		this.recalculate();
	}

	recalculate(): void {
		if (!tempCanvas) {
			throw new Error('tempCanvas failed to create');
		}

		tempCanvas.width = this.width;
		tempCanvas.height = this.height;
		const ctx = tempCanvas.getContext('2d') as Ctx | null;
		if (!ctx) throw new Error();

		ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		Draw.image(ctx, this, 0, 0);
		const pattern = ctx.createPattern(tempCanvas, this.repeatStyle);
		if (pattern === null) throw new Error();
		this.pattern = pattern;
	}

	// TODO: hook up moveCanvas
	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.visible) return;

		let x = this.x - camera.x * this.scrollX;
		let y = this.y - camera.y * this.scrollY;
		if (this.relative) {
			x += this.parent?.x ?? 0;
			y += this.parent?.y ?? 0;
		}

		ctx.save();
		ctx.fillStyle = this.pattern;
		ctx.translate(x, y);
		ctx.fillRect(-x, -y, ctx.canvas.width, ctx.canvas.height);
		ctx.restore();
	}
}
