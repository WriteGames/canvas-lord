import type { Entity } from '../core/entity';
import type { Input } from '../core/input';
import type { Camera } from './camera';

/* Canvas Lord v0.4.4 */
export type IEntityComponentType<T = any> = {
	data: T;
	__IEntityComponent: symbol;
};

export interface IEntitySystem {
	update?: (entity: Entity, input: Input) => void;
	render?: (
		entity: Entity,
		ctx: CanvasRenderingContext2D,
		camera: Camera,
	) => void;
}

export interface IRenderable {
	depth?: number;
	parent?: IRenderable | undefined;
	// TODO(bret): Figure out if we want this to be like this...
	update?: (input: Input) => void;
	render: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
}

export type Renderable = IRenderable;

export type CSSColor = string;
