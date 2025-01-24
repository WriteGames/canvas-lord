import type { Camera, Input, IRenderable } from '../canvas-lord.js';
import * as Components from './components.js';
import { type ComponentProps } from './components.js';
import type { Scene } from './scene.js';
import type { IEntityComponentType } from './types.js';
import * as Collision from './collision.js';
import { type ColliderTag } from './collision.js';

// TODO: fix this!
type Collider = Collision.Shape;

// TODO(bret): Fix this type lol
type Graphic = IRenderable;

export interface IEntity {
	x: number;
	y: number;
	w: number;
	width: number;
	h: number;
	height: number;
	scene: Scene;
	graphic: Graphic | undefined;
	components: Map<IEntityComponentType, any>;
	collider: Collider | undefined;
	visible: boolean;
	collidable: boolean;
	update: (input: Input) => void;
	// TODO(bret): What about allowing component to take in an array and return an array? IE allow for destructuring instead of multiple calls?
	addComponent: <T extends IEntityComponentType>(
		component: T,
	) => ReturnType<IEntity['component']>;
	component: <T extends IEntityComponentType>(
		component: T,
	) => ComponentProps<T> | undefined;
	collideEntity: (
		x: number,
		y: number,
		tag: ColliderTag | ColliderTag[],
	) => Entity | null;
	collideEntities: (
		x: number,
		y: number,
		tag: ColliderTag | ColliderTag[],
	) => Entity[];
	collide: (
		x: number,
		y: number,
		tag: ColliderTag | ColliderTag[],
	) => boolean;
}

export class Entity implements IEntity, IRenderable {
	scene!: Scene; // NOTE: set by scene
	components = new Map<IEntityComponentType, any>();
	depth = 0;
	collider: Collider | undefined = undefined;
	visible = true;
	collidable = true;
	#graphic: Graphic | undefined = undefined;

	get graphic() {
		return this.#graphic;
	}

	set graphic(graphic) {
		this.#graphic = graphic;
		// TODO(bret): Fix this!!
		// @ts-expect-error
		this.#graphic.entity = this;
	}

	constructor(x: number, y: number) {
		this.addComponent(Components.pos2D);
		this.x = x;
		this.y = y;
	}

	addComponent<C extends IEntityComponentType>(
		component: C,
	): ReturnType<typeof this.component<C>> {
		// TODO: we'll want to make sure we use a deepCopy
		this.components.set(component, Components.copyObject(component.data));
		return this.component(component);
	}

	component<C extends IEntityComponentType>(
		component: C,
	): ComponentProps<C> | undefined {
		const c = this.components.get(component);
		if (!c) return undefined;
		return c as ComponentProps<C>;
	}

	get x() {
		return this.component(Components.pos2D)![0];
	}

	set x(val) {
		this.component(Components.pos2D)![0] = val;
	}

	get y() {
		return this.component(Components.pos2D)![1];
	}

	set y(val) {
		this.component(Components.pos2D)![1] = val;
	}

	// TODO(bret): Set up setters for these as well
	// TODO(bret): Would be good to set up for non-rect shapes :)
	get width() {
		if (this.collider && 'w' in this.collider) return this.collider.w;
		return 0;
	}

	get w() {
		return this.width;
	}

	get height() {
		if (this.collider && 'h' in this.collider) return this.collider.h;
		return 0;
	}

	get h() {
		return this.height;
	}

	update(input: Input): void {}

	render(ctx: CanvasRenderingContext2D, camera: Camera): void {
		// TODO(bret): .visible should probably be on the Graphic, not the Entity itself
		if (this.visible) {
			this.#graphic?.render(ctx, camera);
		}
	}

	_moveCollider(c: Collider, x: number, y: number) {
		switch (c.type) {
			case 'line':
				c.x1 += x;
				c.x2 += x;
				c.y1 += y;
				c.y2 += y;
				break;
			case 'triangle':
				c.x1 += x;
				c.x2 += x;
				c.x3 += x;
				c.y1 += y;
				c.y2 += y;
				c.y3 += y;
				break;
			default:
				c.x += x;
				c.y += y;
		}
	}

	_collide(x: number, y: number, e: Entity): Entity | null {
		if (!this.collidable || !this.collider || !e.collidable || !e.collider)
			return null;
		let result: Entity | null = null;
		this._moveCollider(this.collider, x, y);
		this._moveCollider(e.collider, e.x, e.y);
		if (Collision.collide(this.collider, e.collider)) {
			result = e;
		}
		this._moveCollider(this.collider, -x, -y);
		this._moveCollider(e.collider, -e.x, -e.y);
		return result;
	}

	collideEntity(
		x: number,
		y: number,
		tag: ColliderTag | ColliderTag[],
	): Entity | null {
		if (!this.collidable || !this.collider) return null;

		const tags = tag ? [tag].flat() : [];
		const n = this.scene.entities.inScene.length;
		let collide = null;
		for (let i = 0; !collide && i < n; ++i) {
			const e = this.scene.entities.inScene[i];
			if (e === this) continue;
			if (!e.collidable || !e.collider) continue;
			if (tags.length && !tags.includes(e.collider.tag)) continue;
			collide = this._collide(x, y, e);
		}
		return collide;
	}

	collideEntities(x: number, y: number, tag: ColliderTag | ColliderTag[]) {
		if (!this.collidable || !this.collider) return [];

		const tags = tag ? [tag].flat() : [];
		const n = this.scene.entities.inScene.length;
		let collide = [];
		for (let i = 0; i < n; ++i) {
			const e = this.scene.entities.inScene[i];
			if (e === this) continue;
			if (!e.collidable || !e.collider) continue;
			if (tags.length && !tags.includes(e.collider.type)) continue;
			if (this._collide(x, y, e)) {
				collide.push(e);
			}
		}
		return collide;
	}

	collide(x: number, y: number, tag: ColliderTag | ColliderTag[]) {
		if (!this.collidable || !this.collider) return false;
		return this.collideEntity(x, y, tag) !== null;
	}
}
