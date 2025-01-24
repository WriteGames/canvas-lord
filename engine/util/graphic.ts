import type { Camera } from './camera.js';
import { Draw } from './draw.js';
import { Entity } from './entity.js';

const tempCanvas = document.createElement('canvas');

// TODO(bret): Remove this (it's also in canvas-lord.ts)
export type SpriteAsset = {
	fileName: string;
} & (
	| {
			image: null;
			loaded: false;
	  }
	| {
			image: HTMLImageElement;
			width: number;
			height: number;
			loaded: true;
	  }
);

export interface IGraphic {
	x: number;
	y: number;
	angle: number;
	// scale: number;
	scaleX: number;
	scaleY: number;
	originX: number;
	originY: number;
	scrollX: number;
	scrollY: number;
	alpha: number;
	entity: Entity | undefined;
	centerOrigin: () => void;
	centerOO: () => void;
	render: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
}

export class Graphic implements IGraphic {
	x: number;
	y: number;
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
	entity: Entity | undefined;

	// TODO(bret): What should get scale() return??

	set scale(value: number) {
		this.scaleX = this.scaleY = value;
	}

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	centerOrigin(): void {
		// TODO(bret): check if invalidated, if so, recalculate!
		throw new Error('unimplemented');
	}

	centerOO(): void {
		this.centerOrigin();
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera) {}
}

const textCanvas = document.createElement('canvas');
const textCtx = textCanvas.getContext('2d');
export class Text extends Graphic {
	str: string;

	color: string = 'white'; // what do we want for default?
	type: 'fill' | 'stroke' = 'fill';
	font: string = 'sans-serif';
	size: number = 10;
	align: CanvasTextAlign = 'left';
	// TODO(bret): check if this is the default we want :/
	baseline: CanvasTextBaseline = 'top';

	constructor(str: string, x: number, y: number) {
		super(x, y);
		this.str = str;
	}

	centerOrigin(): void {
		if (!textCtx) throw new Error();

		const {
			font = 'sans-serif',
			size = 10,
			align = 'left',
			baseline = 'top', // TODO(bret): check if this is the default we want :/
			// count,
		} = this;

		textCtx.save();
		const _size = typeof size === 'number' ? `${size}px` : size;
		textCtx.font = `${_size} ${font}`;

		textCtx.textAlign = align;
		textCtx.textBaseline = baseline;

		const metrics = textCtx.measureText(this.str);

		const height =
			metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

		this.offsetX = -metrics.width / 2;
		this.offsetY = -height / 2;
		textCtx.restore();
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera) {
		const x = this.x - camera.x * this.scrollX + (this.entity?.x ?? 0);
		const y = this.y - camera.y * this.scrollY + (this.entity?.y ?? 0);
		Draw.text(ctx, this, x, y, this.str);
	}
}

// TODO(bret): How to tile?
export class Sprite extends Graphic {
	asset: SpriteAsset;

	// TODO(bret): remove these and allos Draw.image to make them optional
	frame: number = 0;
	frameW: number = 0;
	frameH: number = 0;

	sourceX: number = 0;
	sourceY: number = 0;
	sourceW: number | undefined;
	sourceH: number | undefined;

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

	constructor(
		asset: SpriteAsset,
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

	static createRect(width: number, height: number, color: string) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('[Sprite.createRect()] getContext() failed');
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const asset = {
			// TODO(bret): Could hash these & put them in assetManager :O
			fileName: [width, height, color].join('-'),
			image: null,
			loaded: false,
		} as SpriteAsset;

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

	render(ctx: CanvasRenderingContext2D, camera: Camera) {
		const {
			sourceX,
			sourceY,
			sourceW = this.width,
			sourceH = this.height,
		} = this;
		const x = this.x - camera.x * this.scrollX + (this.entity?.x ?? 0);
		const y = this.y - camera.y * this.scrollY + (this.entity?.y ?? 0);
		Draw.image(ctx, this, x, y, sourceX, sourceY, sourceW, sourceH);
	}
}

export class NineSlice extends Graphic {
	asset: SpriteAsset;
	imageSrc: HTMLImageElement;
	width: number;
	height: number;
	tileW: number;
	tileH: number;

	// TODO(bret): remove these and allos Draw.image to make them optional
	frame: number = 0;
	frameW: number = 0;
	frameH: number = 0;

	// TODO(bret): See if we can remove this - they get set in recalculate()
	patternT!: CanvasPattern;
	patternL!: CanvasPattern;
	patternR!: CanvasPattern;
	patternB!: CanvasPattern;
	patternC!: CanvasPattern;

	// TODO(bret): Allow for custom tileW/tileH, along with non-uniform sizes
	constructor(
		asset: SpriteAsset,
		x: number,
		y: number,
		w: number,
		h: number,
	) {
		if (!asset.image) throw new Error();

		super(x, y);
		this.asset = asset;
		this.imageSrc = asset.image;
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
		if (!ctx) throw new Error();
		// top
		ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		Draw.image(ctx, this, 0, 0, w, 0, w, h);
		const patternT = ctx.createPattern(tempCanvas, 'repeat-x');
		if (patternT === null) throw new Error();
		this.patternT = patternT;
		// bottom
		ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		Draw.image(ctx, this, 0, 0, w, h * 2, w, h);
		const patternB = ctx.createPattern(tempCanvas, 'repeat-x');
		if (patternB === null) throw new Error();
		this.patternB = patternB;
		// left
		ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		Draw.image(ctx, this, 0, 0, 0, h, w, h);
		const patternL = ctx.createPattern(tempCanvas, 'repeat-y');
		if (patternL === null) throw new Error();
		this.patternL = patternL;
		// right
		ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		Draw.image(ctx, this, 0, 0, w * 2, h, w, h);
		const patternR = ctx.createPattern(tempCanvas, 'repeat-y');
		if (patternR === null) throw new Error();
		this.patternR = patternR;
		// center
		ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		Draw.image(ctx, this, 0, 0, w, h, w, h);
		const patternC = ctx.createPattern(tempCanvas, 'repeat');
		if (patternC === null) throw new Error();
		this.patternC = patternC;
	}

	// TODO: hook up moveCanvas
	render(ctx: CanvasRenderingContext2D, camera: Camera) {
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
