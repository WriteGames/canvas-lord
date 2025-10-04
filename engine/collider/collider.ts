/* Canvas Lord v0.6.1 */

import { collide } from './collide.js';
import type { Entity } from '../core/entity.js';
import type { Ctx } from '../util/canvas.js';
import { type DrawOptions } from '../util/draw.js';
import { CSSColor } from '../util/types.js';

export type ColliderType =
	| 'point'
	| 'line'
	| 'box'
	| 'circle'
	| 'right-triangle'
	| 'polygon'
	| 'grid';
export type ColliderTag = string;

type ColliderParent = Entity;

interface ICollider {
	type: ColliderType;
	tag?: ColliderTag;
	collidable: boolean;
	parent: ColliderParent;

	x: number;
	y: number;

	render(ctx: Ctx, x: number, y: number): void;
}

// TODO(bret): getters for left/right/top/bottom :)

export abstract class Collider implements ICollider {
	type: ColliderType = 'point' as const;
	tag?: ColliderTag;
	collidable = true;
	x: number;
	y: number;
	originX = 0;
	originY = 0;
	parent!: ColliderParent; // NOTE(bret): This gets set via Entity
	color: CSSColor = 'red';

	static #optionsCollidable: DrawOptions = {
		type: 'stroke',
		color: 'red',
	};

	static #optionsNonCollidable: DrawOptions = {
		type: 'stroke',
		color: 'gray',
	};

	get options(): DrawOptions {
		return this.collidable
			? Collider.#optionsCollidable
			: Collider.#optionsNonCollidable;
	}

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	assignParent(parent: ColliderParent): void {
		this.parent = parent;
	}

	collide(other: Collider): void {
		collide(this, other);
	}

	render(_ctx: Ctx, _x: number, _y: number): void {
		throw new Error('render() unimplemented');
	}
}
