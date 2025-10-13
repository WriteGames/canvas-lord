/* Canvas Lord v0.6.1 */

import { collide } from './collide.js';
import { Entity } from '../core/entity.js';
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

export type CollisionMatch =
	| ColliderTag
	| ColliderTag[]
	| Entity
	| Entity[]
	| undefined;

interface ICollider {
	type: ColliderType;
	tag?: ColliderTag;
	collidable: boolean;
	parent: ColliderParent;

	x: number;
	y: number;

	render(ctx: Ctx, x: number, y: number): void;

	collideEntity(x: number, y: number): Entity | null;
	collideEntity(x: number, y: number, tag?: ColliderTag): Entity | null;
	collideEntity(x: number, y: number, tags: ColliderTag[]): Entity | null;
	collideEntity(x: number, y: number, entity: Entity): Entity | null;
	collideEntity(x: number, y: number, entities: Entity[]): Entity | null;

	collideEntities(x: number, y: number): Entity[];
	collideEntities(x: number, y: number, tag?: ColliderTag): Entity[];
	collideEntities(x: number, y: number, tags: ColliderTag[]): Entity[];
	collideEntities(x: number, y: number, entity: Entity): Entity[];
	collideEntities(x: number, y: number, entities: Entity[]): Entity[];

	collide(x: number, y: number): boolean;
	collide(x: number, y: number, tag?: ColliderTag): boolean;
	collide(x: number, y: number, tags: ColliderTag[]): boolean;
	collide(x: number, y: number, entity: Entity): boolean;
	collide(x: number, y: number, entities: Entity[]): boolean;
}

export abstract class Collider implements ICollider {
	type: ColliderType = 'point' as const;
	#tags: ColliderTag[] = [];
	collidable = true;
	x: number;
	y: number;
	originX = 0;
	originY = 0;
	#parent?: ColliderParent | null;
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
		return this.width;
	}
	set w(value: number) {
		this.width = value;
	}

	get h(): number {
		return this.height;
	}
	set h(value: number) {
		this.height = value;
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

	hasTag(tag: string): boolean {
		return this.tags.includes(tag);
	}

	hasTags(...tags: string[]): boolean {
		return tags.every((tag) => this.tags.includes(tag));
	}

	removeTag(tag: string): void {
		const index = this.tags.indexOf(tag);
		if (index < 0) return;
		this.tags.splice(index, 1);
	}

	removeTags(...tags: string[]): void {
		tags.forEach((tag) => this.removeTag(tag));
	}

	assignParent(parent: ColliderParent | null): void {
		this.#parent = parent;
	}

	#collideEntity(x: number, y: number, entity: Entity): boolean {
		if (!this.#parent) return false;
		if (!this.collidable) return false;
		if (entity === this.#parent) return false;

		const _x = this.#parent.x;
		const _y = this.#parent.y;

		this.#parent.x = x;
		this.#parent.y = y;

		const result = entity.colliders.some((other) => {
			return collide(this, other);
		});

		this.#parent.x = _x;
		this.#parent.y = _y;

		return result;
	}

	#collide<T extends Entity>(
		x: number,
		y: number,
		match: CollisionMatch,
		earlyOut?: boolean,
	): T[] {
		if (!this.#parent) return [];

		let entities: Entity[] = this.#parent.scene.entities.inScene;
		let tags: ColliderTag[] = [];

		switch (true) {
			case match === undefined:
				break;

			case match instanceof Entity: {
				entities = [match];
				break;
			}

			case typeof match === 'string': {
				tags = [match];
				break;
			}

			case Array.isArray(match): {
				if (match.every((item) => item instanceof Entity)) {
					entities = match;
				} else {
					tags = match;
				}
				break;
			}

			default:
				console.log(match);
				throw new Error('unknown error!!');
		}

		const n = entities.length;
		const collide: T[] = [];
		for (let i = 0; i < n; ++i) {
			const e = entities[i];

			if (tags.length > 0) {
				if (!e.colliders.some((c) => tags.some((t) => c.hasTag(t))))
					continue;
			}

			const collision = this.#collideEntity(x, y, e);

			const result = collision ? e : null;
			if (result === null) continue;

			collide.push(result as T);
			if (earlyOut) break;
		}

		return collide;
	}

	collideEntity<T extends Entity>(x: number, y: number): T | null;
	collideEntity<T extends Entity>(
		x: number,
		y: number,
		tag?: ColliderTag,
	): T | null;
	collideEntity<T extends Entity>(
		x: number,
		y: number,
		tags: ColliderTag[],
	): T | null;
	collideEntity<T extends Entity>(
		x: number,
		y: number,
		entity: Entity,
	): T | null;
	collideEntity<T extends Entity>(
		x: number,
		y: number,
		entities: Entity[],
	): T | null;
	collideEntity<T extends Entity>(
		x: number,
		y: number,
		match?: CollisionMatch,
	): T | null;
	collideEntity<T extends Entity>(
		x: number,
		y: number,
		match?: CollisionMatch,
	): T | null {
		return this.#collide<T>(x, y, match, true)[0] ?? null;
	}

	collideEntities(x: number, y: number): Entity[];
	collideEntities(x: number, y: number, tag?: ColliderTag): Entity[];
	collideEntities(x: number, y: number, tags: ColliderTag[]): Entity[];
	collideEntities(x: number, y: number, entity: Entity): Entity[];
	collideEntities(x: number, y: number, entities: Entity[]): Entity[];
	collideEntities(x: number, y: number, match?: CollisionMatch): Entity[];
	collideEntities(x: number, y: number, match?: CollisionMatch): Entity[] {
		return this.#collide(x, y, match, false);
	}

	collide(x: number, y: number): boolean;
	collide(x: number, y: number, tag?: ColliderTag): boolean;
	collide(x: number, y: number, tags: ColliderTag[]): boolean;
	collide(x: number, y: number, entity: Entity): boolean;
	collide(x: number, y: number, entities: Entity[]): boolean;
	collide(x: number, y: number, match?: CollisionMatch): boolean;
	collide(x: number, y: number, match?: CollisionMatch): boolean {
		return this.#collide(x, y, match, true).length > 0;
	}

	render(_ctx: Ctx, _x: number, _y: number): void {
		throw new Error('render() unimplemented');
	}
}
