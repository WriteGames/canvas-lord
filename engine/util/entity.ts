import type { Input, IRenderable } from '../canvas-lord.js';
import * as Components from './components.js';
import { type ComponentProps } from './components.js';
import type { Scene } from './scene.js';
import type { IEntityComponentType } from './types.js';
import * as Collision from './collision.js';
import { type ColliderTag } from './collision.js';

// TODO: fix this!
type Collider = Collision.Shape;

export interface IEntity {
	x: number;
	y: number;
	scene: Scene;
	components: Map<IEntityComponentType, any>;
	collider: Collider | undefined;
	update: (input: Input) => void;
	// TODO(bret): What about allowing component to take in an array and return an array? IE allow for destructuring instead of multiple calls?
	addComponent: <T extends IEntityComponentType>(
		component: T,
	) => ReturnType<IEntity['component']>;
	component: <T extends IEntityComponentType>(
		component: T,
	) => ComponentProps<T> | undefined;
}

export class Entity implements IEntity, IRenderable {
	scene!: Scene; // NOTE: set by scene
	components = new Map<IEntityComponentType, any>();
	depth = 0;
	collider: Collider | undefined = undefined;

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

	collideEntity(x: number, y: number, tag: ColliderTag | ColliderTag[]) {
		if (!this.collider) return null;
		// TODO(bret): Remove this hack
		if (this.collider.type === 'line' || this.collider.type === 'triangle')
			return null;

		const tags = tag ? [tag].flat() : [];
		const n = this.scene.entities.inScene.length;
		let collide = null;
		for (let i = 0; !collide && i < n; ++i) {
			const e = this.scene.entities.inScene[i];
			if (e === this) continue;
			if (!e.collider) continue;
			// TODO(bret): Remove this hack
			if (e.collider.type === 'line' || e.collider.type === 'triangle')
				return null;
			if (tags.length && !tags.includes(e.collider.tag)) continue;
			this.collider.x += x;
			this.collider.y += y;
			e.collider.x += e.x;
			e.collider.y += e.y;
			if (Collision.collide(this.collider, e.collider)) {
				collide = e;
			}

			this.collider.x -= x;
			this.collider.y -= y;
			e.collider.x -= e.x;
			e.collider.y -= e.y;
		}
		return collide;
	}

	collideEntities(x: number, y: number, tag: ColliderTag | ColliderTag[]) {
		if (!this.collider) return [];
		// TODO(bret): Remove this hack
		if (this.collider.type === 'line' || this.collider.type === 'triangle')
			return null;

		const tags = tag ? [tag].flat() : [];
		const n = this.scene.entities.inScene.length;
		let collide = [];
		for (let i = 0; i < n; ++i) {
			const e = this.scene.entities.inScene[i];
			if (e === this) continue;
			if (!e.collider) continue;
			// TODO(bret): Remove this hack
			if (e.collider.type === 'line' || e.collider.type === 'triangle')
				return null;
			if (tags.length && !tags.includes(e.collider.type)) continue;
			this.collider.x += x;
			this.collider.y += y;
			e.collider.x += e.x;
			e.collider.y += e.y;
			if (Collision.collide(this.collider, e.collider)) {
				collide.push(e);
			}

			this.collider.x -= x;
			this.collider.y -= y;
			e.collider.x -= e.x;
			e.collider.y -= e.y;
		}
		return collide;
	}

	collide(x: number, y: number, tag: ColliderTag | ColliderTag[]) {
		if (!this.collider) return false;
		return this.collideEntity(x, y, tag) !== null;
	}

	update(input: Input): void {}

	render(ctx: CanvasRenderingContext2D): void {}
}
