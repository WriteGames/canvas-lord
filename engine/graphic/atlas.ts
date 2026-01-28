import type { ImageAsset } from '../core/asset-manager.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

interface AtlasFrame {
	filename: string;
	rotated: boolean;
	trimmed: boolean;
	sourceSize: { w: number; h: number };
	spriteSourceSize: { x: number; y: number; w: number; h: number };
	frame: { x: number; y: number; w: number; h: number };
	anchor: { x: number; y: number };
}

type AtlasFrames = AtlasFrame[] | Record<string, AtlasFrame>;

interface AtlasTexture {
	image: string;
	format: string;
	size: { w: number; h: number };
	scale: number;
	frames: AtlasFrames;
}

interface AtlasMeta {
	app: string;
	version: string;
	smartupdate: string;
}

type AtlasData = {
	meta: AtlasMeta;
} & (
	| {
			frames: AtlasFrames;
	  }
	| {
			textures: AtlasTexture[];
	  }
);

export async function loadAtlas(src: string): Promise<AtlasData> {
	return fetch(src).then((res) => res.json() as unknown as AtlasData);
}

export function renderAtlas(
	ctx: Ctx,
	asset: ImageAsset,
	frame: AtlasFrame,
	x = 0,
	y = 0,
): void {
	const { anchor = { x: 0, y: 0 } } = frame;

	const originX = anchor.x * frame.frame.w;
	const originY = anchor.y * frame.frame.h;

	let drawX = x + originX;
	let drawY = y + originY;
	if (frame.trimmed) {
		drawX += frame.spriteSourceSize.x;
		drawY += frame.spriteSourceSize.y;
	}

	const sourceX = frame.frame.x;
	const sourceY = frame.frame.y;
	const w = frame.frame.w;
	const h = frame.frame.h;

	Draw.image(
		ctx,
		{
			imageSrc: asset.image,
			originX,
			originY,
		},
		drawX,
		drawY,
		sourceX,
		sourceY,
		w,
		h,
	);

	if (true as boolean) {
		Draw.rect(
			ctx,
			{
				color: 'lime',
				type: 'stroke',
			},
			x,
			y,
			frame.sourceSize.w,
			frame.sourceSize.h,
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
}
