interface TPAtlasFrame {
	filename: string;
	rotated: boolean;
	trimmed: boolean;
	sourceSize: { w: number; h: number };
	spriteSourceSize: { x: number; y: number; w: number; h: number };
	frame: { x: number; y: number; w: number; h: number };
	anchor: { x: number; y: number };
}

type TPAtlasFrames = TPAtlasFrame[] | Record<string, TPAtlasFrame>;

interface TPAtlasTexture {
	image: string;
	format: string;
	size: { w: number; h: number };
	scale: number;
	frames: TPAtlasFrames;
}

interface TPAtlasFrameTag {
	name: string;
	from: number;
	to: number;
}

interface TPAtlasMeta {
	app: string;
	version: string;
	smartupdate: string;
	frameTags?: TPAtlasFrameTag[];
	image?: string;
}

export type TPAtlasData = {
	meta: TPAtlasMeta;
} & (
	| {
			frames: TPAtlasFrames;
	  }
	| {
			textures: TPAtlasTexture[];
	  }
);
