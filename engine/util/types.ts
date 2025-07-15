/* Canvas Lord v0.6.1 */

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

export type RawComponent = object | unknown[];
export interface IEntityComponentType<T = RawComponent> {
	data: T;
	__IEntityComponent: symbol;
}

// Systems
export interface IEntitySystem {
	update?: (entity: Entity, input: Input) => void;
	render?: (entity: Entity, ctx: Ctx, camera: Camera) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- we need it here
type Any = any;
type UpdateMethod = Exclude<IEntitySystem['update'], undefined>;
type Parameters2<T extends (t: Any, ...args: Any[]) => Any> = T extends (
	t: Any,
	...args: infer P
) => Any
	? P
	: never;
export type GetSystemUpdate<
	T extends IEntitySystem,
	U = Exclude<T['update'], undefined>,
> = U extends UpdateMethod ? (...args: Parameters2<U>) => ReturnType<U> : never;

// IRenderable
export interface IRenderable {
	depth?: number;
	parent?: IRenderable | undefined;
	// TODO(bret): Figure out if we want this to be like this...
	update?: (input: Input) => void;
	render: (ctx: Ctx, camera: Camera) => void;
}

export type Renderable = IRenderable;

export type CSSColor = CanvasRenderingContext2D['fillStyle'];
