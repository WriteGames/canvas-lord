import type { AssetManager } from '../canvas-lord.js';
import { indexToPos, V2 } from './math.js';
import type { CSSColor } from './types.js';
import { Draw, drawable } from './draw.js';

// TODO: find a better place for this to live globally
const pixelCanvas =
	typeof OffscreenCanvas !== 'undefined'
		? new OffscreenCanvas(1, 1)
		: document.createElement('canvas');
const _pixelCtx =
	typeof OffscreenCanvas !== 'undefined'
		? (pixelCanvas as OffscreenCanvas).getContext('2d')
		: (pixelCanvas as HTMLCanvasElement).getContext('2d');
if (!_pixelCtx) {
	throw Error('pixelCtx failed to create');
}
const pixelCtx = _pixelCtx;

export interface Grid {
	width: number;
	height: number;
	tileW: number;
	tileH: number;
	columns: number;
	rows: number;
	color: CSSColor;
	renderMode: 0 | 1 | 2;
	data: number[];
}

export class Grid {
	constructor(width: number, height: number, tileW: number, tileH: number) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);

		const size = this.columns * this.rows;

		this.color = 'rgba(255, 0, 0, 0.6)';
		this.renderMode = 2;
		this.data = Array.from({ length: size }, (v) => 0);
	}

	static fromBitmap(
		assetManager: AssetManager,
		src: string,
		tileW: number,
		tileH: number,
	): Grid {
		const image = assetManager.images.get(src);
		if (!image) {
			throw new Error('image is not valid');
		}

		const width = image.width * tileW;
		const height = image.height * tileH;
		const stride = image.width;

		const grid = new Grid(width, height, tileW, tileH);
		grid.forEach((_, [x, y]) => {
			pixelCtx.drawImage(image, -x, -y);
			const { data } = pixelCtx.getImageData(0, 0, 1, 1);
			if (data[0] === 0) {
				grid.setTile(x, y, 1);
			}
		});

		return grid;
	}

	static fromBinary(
		data: [number, number, ...number[]],
		tileW: number,
		tileH: number,
	): Grid {
		const [width, height, ...gridData] = data;

		const grid = new Grid(width * tileW, height * tileH, tileW, tileH);

		const stride = grid.columns;
		gridData
			.flatMap((b) => b.toString(2).padStart(32, '0').split(''))
			.forEach((v, i) => {
				grid.setTile(...indexToPos(i, stride), +v);
			});

		return grid;
	}

	forEach(callback: (val: number, pos: V2) => void): void {
		const stride = this.columns;
		this.data
			.map<[number, V2]>((val, i) => [val, indexToPos(i, stride)])
			.forEach((args) => callback(...args));
	}

	inBounds(x: number, y: number): boolean {
		return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
	}

	setTile(x: number, y: number, value: number): void {
		if (!this.inBounds(x, y)) return;
		this.data[y * this.columns + x] = value;
	}

	getTile(x: number, y: number): number {
		if (!this.inBounds(x, y)) return 0;
		return this.data[y * this.columns + x] as number;
	}

	renderOutline(ctx: CanvasRenderingContext2D, camera: V2): void {
		const stride = this.columns;
		const width = this.tileW;
		const height = this.tileH;

		const [cameraX, cameraY] = camera;

		ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					const x1 = x * this.tileW + 0.5 - cameraX;
					const y1 = y * this.tileH + 0.5 - cameraY;
					const x2 = x1 + width - 1;
					const y2 = y1 + height - 1;
					if (!this.getTile(x - 1, y)) {
						Draw.line(ctx, drawable, x1, y1, x1, y2);
					}
					if (!this.getTile(x + 1, y)) {
						Draw.line(ctx, drawable, x2, y1, x2, y2);
					}
					if (!this.getTile(x, y - 1)) {
						Draw.line(ctx, drawable, x1, y1, x2, y1);
					}
					if (!this.getTile(x, y + 1)) {
						Draw.line(ctx, drawable, x1, y2, x2, y2);
					}
				}
			}
		}
	}

	renderEachCell(
		ctx: CanvasRenderingContext2D,
		camera: V2,
		fill = false,
	): void {
		const stride = this.columns;
		const width = this.tileW - +!fill;
		const height = this.tileH - +!fill;

		const [cameraX, cameraY] = camera;

		if (fill) ctx.fillStyle = this.color;
		else ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		const drawRect = (...args: Parameters<typeof ctx.fillRect>): void =>
			fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);

		const offset = fill ? 0 : 0.5;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					drawRect(
						x * this.tileW + offset - cameraX,
						y * this.tileH + offset - cameraY,
						width,
						height,
					);
				}
			}
		}
	}

	render(ctx: CanvasRenderingContext2D, camera = V2.zero): void {
		switch (this.renderMode) {
			case 0:
				this.renderOutline(ctx, camera);
				break;

			case 1:
				this.renderEachCell(ctx, camera);
				break;

			case 2: {
				const temp = this.color;
				this.color = 'rgba(255, 0, 0, 0.3)';
				this.renderEachCell(ctx, camera, true);
				this.color = temp;
				this.renderEachCell(ctx, camera, false);
				break;
			}
		}
	}
}
