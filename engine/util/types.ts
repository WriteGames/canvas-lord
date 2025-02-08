/* Canvas Lord v0.5.3 */

import type { Engine } from '../core/engine';
import type { Entity } from '../core/entity';
import type { Input } from '../core/input';
import type { Camera } from './camera';
import type { Ctx } from './canvas.js';

declare global {
	interface HTMLCanvasElement {
		_engine: Engine;
		_actualWidth: number;
		_actualHeight: number;
		_offsetX: number;
		_offsetY: number;
		_scaleX: number;
		_scaleY: number;
	}

	interface Math {
		clamp: (val: number, min: number, max: number) => number;
		lerp: (a: number, b: number, t: number) => number;
	}
}

export type RequiredAndOmit<T, O extends keyof T> = Required<Omit<T, O>> &
	Pick<T, O>;

export type IEntityComponentType<T = any> = {
	data: T;
	__IEntityComponent: symbol;
};

export interface IEntitySystem {
	update?: (entity: Entity, input: Input) => void;
	render?: (entity: Entity, ctx: Ctx, camera: Camera) => void;
}

export interface IRenderable {
	depth?: number;
	parent?: IRenderable | undefined;
	// TODO(bret): Figure out if we want this to be like this...
	update?: (input: Input) => void;
	render: (ctx: Ctx, camera: Camera) => void;
}

export type Renderable = IRenderable;

export type CSSColor = CanvasRenderingContext2D['fillStyle'];
