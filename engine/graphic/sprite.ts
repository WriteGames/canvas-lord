/* Canvas Lord v0.5.3 */

import { Graphic } from './graphic.js';
import type { ImageAsset } from '../core/asset-manager.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import type { CSSColor } from '../util/types';

export interface ISpriteLike {
	color?: CSSColor;
	blend?: boolean;
}

const assetHasImage = (
	asset: ImageAsset,
): asset is ImageAsset & {
	image: HTMLImageElement;
} => asset.image !== null;

// TODO(bret): How to tile?
export class Sprite extends Graphic implements ISpriteLike {
	asset: ImageAsset;

	sourceX = 0;
	sourceY = 0;
	sourceW: number | undefined;
	sourceH: number | undefined;

	color?: string;
	blend?: boolean;

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
		x = 0,
		y = 0,
		sourceX = 0,
		sourceY = 0,
		sourceW = undefined,
		sourceH = undefined,
	) {
		super(x, y);
		this.asset = asset;
		this.sourceX = sourceX;
		this.sourceY = sourceY;
		this.sourceW = sourceW;
		this.sourceH = sourceH;
	}

	static createImage(
		width: number,
		height: number,
		fileName: string,
		callback: (ctx: Ctx) => void,
	): Sprite {
		// TODO(bret): use generateCanvasAndCtx
		// const { canvas, ctx } = generateCanvasAndCtx(width, height);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('[Sprite.createRect()] getContext() failed');

		callback(ctx);

		const asset = {
			// TODO(bret): Could hash these & put them in assetManager :O
			fileName,
			image: null,
			loaded: false,
		} as ImageAsset;

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

	static createRect(width: number, height: number, color: string): Sprite {
		const fileName = [width, height, color].join('-');
		return Sprite.createImage(width, height, fileName, (ctx: Ctx) => {
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		});
	}

	centerOrigin(): void {
		this.originX = this.width / 2;
		this.originY = this.height / 2;
	}

	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		const {
			sourceX,
			sourceY,
			sourceW = this.width,
			sourceH = this.height,
		} = this;
		const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
		const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
		Draw.image(ctx, this, x, y, sourceX, sourceY, sourceW, sourceH);
	}

	reset(): void {
		super.reset();

		this.sourceX = 0;
		this.sourceY = 0;
		this.sourceW = undefined;
		this.sourceH = undefined;

		this.color = undefined;
		this.blend = undefined;
	}
}
