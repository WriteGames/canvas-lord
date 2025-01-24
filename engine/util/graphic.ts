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
	}

	centerOO(): void {
		this.centerOrigin();
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera) {}
}

export class Sprite extends Graphic {
	asset: SpriteAsset;
	imageSrc: HTMLImageElement;

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

	constructor(asset: SpriteAsset, x = 0, y = 0) {
		if (!asset.image) throw new Error();
		super(x, y);
		this.asset = asset;
		// TODO: need to do this better
		this.imageSrc = asset.image;
	}

	centerOrigin() {
		this.offsetX = -this.width >> 1;
		this.offsetY = -this.height >> 1;
		this.originX = -this.width >> 1;
		this.originY = -this.height >> 1;
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera) {
		const x = this.x - camera.x + (this.entity?.x ?? 0);
		const y = this.y - camera.y + (this.entity?.y ?? 0);
		// @ts-expect-error
		Draw.image(ctx, this, x, y);
	}
}
