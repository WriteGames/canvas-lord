import type { AtlasAsset, ImageAsset } from '../core/asset-manager.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import { Graphic } from './graphic.js';

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

interface AtlasFrameTag {
	name: string;
	from: number;
	to: number;
}

interface AtlasMeta {
	app: string;
	version: string;
	smartupdate: string;
	frameTags?: AtlasFrameTag[];
}

export type AtlasData = {
	meta: AtlasMeta;
} & (
	| {
			frames: AtlasFrames;
	  }
	| {
			textures: AtlasTexture[];
	  }
);

interface Animation {
	name: string;
	frames: string[];
	frameRate: number;
	loop: boolean;
}

export const createAnim = (tag: string, length: number): Animation => ({
	name: tag,
	frames: Array.from({ length }, (_, i) => `${tag}-${i}`),
	frameRate: 5,
	loop: true,
});

// TODO(bret): implements ISpriteLike
export class Atlas extends Graphic {
	texture: ImageAsset;
	data: AtlasAsset;

	frame = -1;
	frameId = 0;

	anim: Animation;
	anims: Record<string, Animation>;

	constructor(texture: ImageAsset, data: AtlasAsset) {
		super();

		this.texture = texture;
		this.data = data;

		if (!data.loaded) throw new Error();

		const tags = data.data.meta.frameTags ?? [];

		this.anims = Object.fromEntries(
			tags.map(({ name, to, from }) => [
				name,
				createAnim(name, to - from + 1),
			]),
		);

		const anim = 'punch';
		this.anim = this.anims[anim];
	}

	update(): void {
		++this.frame;

		this.frameId = Math.floor(this.frame / 5);
	}

	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.visible) return;

		if (!this.data.loaded) throw new Error();

		const texture = this.data.data;

		let frame: AtlasFrame | undefined;
		if ('frames' in texture) {
			if ((false as boolean) && Array.isArray(texture.frames)) {
				for (
					let frameId = 0;
					frameId < texture.frames.length;
					++frameId
				) {
					const frame = texture.frames[frameId];

					renderAtlas(
						ctx,
						this.texture,
						frame,
						frame.frame.x - frame.spriteSourceSize.x,
						frame.frame.y - frame.spriteSourceSize.y,
					);
				}
			}

			const { frames } = this.anim;
			const curFilename = frames[this.frameId % frames.length];
			if (Array.isArray(texture.frames)) {
				frame = texture.frames.find(
					({ filename }) => filename === curFilename,
				);
			} else {
				frame = texture.frames[curFilename];
			}
		}

		if (!frame) return;

		let x = this.x - camera.x * this.scrollX;
		let y = this.y - camera.y * this.scrollY;
		if (this.relative) {
			x += this.parent?.x ?? 0;
			y += this.parent?.y ?? 0;
		}

		renderAtlas(ctx, this.texture, frame, x, y);
	}
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
