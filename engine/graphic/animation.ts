import type { ImageAsset } from '../core/asset-manager';
import type { AtlasFrame } from './atlas';

export type AnimFrameKey = string | number;

export interface Animation {
	name: string;
	frames: AnimFrameKey[];
	frameRate: number;
	loop: boolean;
}

export type Frame =
	| {
			texture: ImageAsset;
			frame: {
				x: number;
				y: number;
				w: number;
				h: number;
			};
	  }
	| AtlasFrame;

export type FrameData = Record<AnimFrameKey, Frame>;
