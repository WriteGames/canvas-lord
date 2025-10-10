/* Canvas Lord v0.6.1 */

import { collide } from './collide.js';
import type { Entity } from '../core/entity.js';
import type { Ctx } from '../util/canvas.js';
import { type DrawOptions } from '../util/draw.js';
import type { CSSColor } from '../util/types.js';

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
	#tags: ColliderTag[] = [];
	collidable = true;
	x: number;
	y: number;
	originX = 0;
	originY = 0;
	#parent?: ColliderParent;
	color: CSSColor = 'red';

	get parent(): ColliderParent {
		if (!this.#parent)
			throw new Error("No entity has been set as this collider's parent");
		return this.#parent;
	}

	get tag(): ColliderTag | undefined {
		return this.tags[0];
	}

	set tag(value: ColliderTag | undefined) {
		this.#tags = value !== undefined ? [value] : [];
	}

	get tags(): ColliderTag[] {
		return this.#tags;
	}

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

	get w(): number {
		throw new Error('not implemented in Collider');
	}
	set w(_value: number) {
		throw new Error('not implemented in Collider');
	}

	get h(): number {
		throw new Error('not implemented in Collider');
	}
	set h(_value: number) {
		throw new Error('not implemented in Collider');
	}

	get width(): number {
		throw new Error('not implemented in Collider');
	}
	set width(_value: number) {
		throw new Error('not implemented in Collider');
	}

	get height(): number {
		throw new Error('not implemented in Collider');
	}
	set height(_value: number) {
		throw new Error('not implemented in Collider');
	}

	get left(): number {
		throw new Error('not implemented in Collider');
	}
	get right(): number {
		throw new Error('not implemented in Collider');
	}
	get top(): number {
		throw new Error('not implemented in Collider');
	}
	get bottom(): number {
		throw new Error('not implemented in Collider');
	}

	addTag(tag: string): void {
		if (this.tags.includes(tag)) return;
		this.tags.push(tag);
	}

	addTags(...tags: string[]): void {
		tags.forEach((tag) => this.addTag(tag));
	}

	removeTag(tag: string): void {
		const index = this.tags.indexOf(tag);
		if (index < 0) return;
		this.tags.splice(index, 1);
	}

	removeTags(...tags: string[]): void {
		tags.forEach((tag) => this.removeTag(tag));
	}

	assignParent(parent: ColliderParent): void {
		this.#parent = parent;
	}

	collide(other: Collider): void {
		collide(this, other);
	}

	render(_ctx: Ctx, _x: number, _y: number): void {
		throw new Error('render() unimplemented');
	}
}
