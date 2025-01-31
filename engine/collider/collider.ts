/* Canvas Lord v0.4.4 */
import { type DrawOptions } from '../util/draw.js';
import { collide } from './collide.js';

export type ColliderType =
	| 'point'
	| 'line'
	| 'rect'
	| 'circle'
	| 'triangle'
	| 'right-triangle'
	| 'grid';
export type ColliderTag = string | undefined;

interface ICollider {
	type: ColliderType;
	tag?: ColliderTag;
	collidable: boolean;

	x: number;
	y: number;

	render(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

// TODO(bret): getters for left/right/top/bottom :)

export abstract class Collider implements ICollider {
	type: ColliderType = 'point' as const;
	tag?: ColliderTag;
	collidable = true;
	x: number;
	y: number;

	static #optionsCollidable: DrawOptions = {
		type: 'stroke',
		color: 'red',
	};

	static #optionsNonCollidable: DrawOptions = {
		type: 'stroke',
		color: 'gray',
	};

	get options() {
		return this.collidable
			? Collider.#optionsCollidable
			: Collider.#optionsNonCollidable;
	}

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	collide(other: Collider) {
		collide(this, other);
	}

	render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		throw new Error('render() unimplemented');
	}
}
