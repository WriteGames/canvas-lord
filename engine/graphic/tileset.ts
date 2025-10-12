/* Canvas Lord v0.6.1 */

import { Graphic, type GraphicParent } from './graphic.js';
import type { ImageAsset } from '../core/asset-manager.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import { generateCanvasAndCtx, type Canvas, type Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

export interface Tileset {
	width: number;
	height: number;
	tileW: number;
	tileH: number;
	columns: number;
	rows: number;

	relative: boolean;
	visible: boolean;
	asset: ImageAsset;
	parent: GraphicParent | undefined;

	// data: Array<Vec2 | null>;

	startX: number;
	startY: number;
	separation: number;
}

export interface TilesetOptions {
	startX?: number;
	startY?: number;
	separation?: number;
}

type DataEntry = Vec2 | null;

export class Tileset extends Graphic {
	relative = true;
	visible = true;

	#data: DataEntry[];

	canvas: Canvas;
	ctx: Ctx;

	#invalidated = true;

	get imageSrc(): Canvas {
		return this.canvas;
	}

	constructor(
		asset: ImageAsset,
		width: number,
		height: number,
		tileW: number,
		tileH: number,
		options: TilesetOptions = {},
	) {
		super();

		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);

		const { canvas, ctx } = generateCanvasAndCtx(width, height);
		if (!canvas || !ctx)
			throw new Error('failed to create canvas/ctx for Tilset');

		this.canvas = canvas;
		this.ctx = ctx;

		this.asset = asset;

		this.#data = Array.from(
			{ length: this.columns * this.rows },
			() => null,
		);

		this.startX = options.startX ?? 0;
		this.startY = options.startY ?? 0;
		this.separation = options.separation ?? 0;
	}

	setTile(x: number, y: number, tileX: number, tileY: number): void {
		if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) return;
		this.#data[y * this.columns + x] = new Vec2(tileX, tileY);
		this.#invalidated = true;
	}

	getTile(x: number, y: number): DataEntry {
		if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) return null;
		return this.#data[y * this.columns + x];
	}

	updateImage(): void {
		const scale = 1;

		const { asset, separation, startX, startY, tileW, tileH } = this;

		if (!asset.image) throw new Error('Tileset is missing an image');

		// const srcCols = Math.floor(image.width / tileW);
		// const srcRows = Math.floor(image.height / tileH);

		const offsetX = (this.relative ? this.parent?.x : 0) ?? 0;
		const offsetY = (this.relative ? this.parent?.y : 0) ?? 0;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				const val = this.#data[y * this.columns + x];
				if (val) {
					const [tileX, tileY] = val;
					const srcX = startX + (separation + tileW) * tileX;
					const srcY = startY + (separation + tileH) * tileY;
					const dstX = x * tileW + offsetX;
					const dstY = y * tileH + offsetY;
					this.ctx.drawImage(
						asset.image,
						srcX,
						srcY,
						tileW,
						tileH,
						dstX,
						dstY,
						tileW * scale,
						tileH * scale,
					);
				}
			}
		}

		this.#invalidated = false;
	}

	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (this.#invalidated) this.updateImage();

		if (!this.visible) return;

		let x = this.x - camera.x * this.scrollX;
		let y = this.y - camera.y * this.scrollY;
		if (this.relative) {
			x += this.parent?.x ?? 0;
			y += this.parent?.y ?? 0;
		}

		// ctx.drawImage(this.canvas, x, y);
		Draw.image(ctx, this, x, y);
	}
}
