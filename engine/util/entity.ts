/* Canvas Lord v0.4.4 */
import type { Camera, Input, IRenderable } from '../canvas-lord.js';
import * as Components from './components.js';
import { type ComponentProps } from './components.js';
import type { Scene } from './scene.js';
import type { IEntityComponentType } from './types.js';
import * as Collision from './collision.js';
import { type ColliderTag } from './collision.js';
import { Draw } from './draw.js';

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
	collideMouse: (x: number, y: number) => boolean;
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
		if (this.#graphic) this.#graphic.parent = this;
	}

	constructor(x: number = 0, y: number = 0) {
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

	renderCollider(ctx: CanvasRenderingContext2D, camera: Camera): void {
		if (!this.collider) return;

		const color = this.collidable ? 'red' : 'gray';
		switch (this.collider.type) {
			case 'rect':
				const rect = {
					x: this.x + this.collider.x - camera.x,
					y: this.y + this.collider.y - camera.y,
					width: this.collider.w,
					height: this.collider.h,
				};
				Draw.rect(
					ctx,
					{ type: 'stroke', color, ...rect },
					rect.x,
					rect.y,
					rect.width - 1,
					rect.height - 1,
				);
				break;
			case 'triangle':
				Draw.polygon(
					ctx,
					// @ts-ignore
					{ type: 'stroke', color },
					this.x - camera.x,
					this.y - camera.y,
					[
						[this.collider.x1, this.collider.y1],
						[this.collider.x2, this.collider.y2],
						[this.collider.x3, this.collider.y3],
					],
				);
				break;
			case 'grid':
				// @ts-ignore
				this.collider.color = color;
				// @ts-ignore
				this.collider.renderOutline(ctx, camera, this.x, this.y);
				break;
			// default:
			// 	console.warn('not supported');
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

	_collide(
		x: number,
		y: number,
		tag: ColliderTag | ColliderTag[],
		earlyOut: boolean,
	): Entity[] {
		if (!this.collider) return [];

		const tags = tag ? [tag].flat() : [];
		const n = this.scene.entities.inScene.length;
		let collide = [];
		for (let i = 0; i < n; ++i) {
			const e = this.scene.entities.inScene[i];
			if (e === this) continue;
			if (!e.collidable || !e.collider) continue;
			if (tags.length && !tags.includes(e.collider.tag)) continue;

			this._moveCollider(this.collider, x, y);
			this._moveCollider(e.collider, e.x, e.y);
			const collision = Collision.collide(this.collider, e.collider);
			const result = collision ? e : null;
			this._moveCollider(this.collider, -x, -y);
			this._moveCollider(e.collider, -e.x, -e.y);
			if (result === null) continue;

			collide.push(result);
			if (earlyOut) break;
		}
		return collide;
	}

	collideEntity(
		x: number,
		y: number,
		tag: ColliderTag | ColliderTag[],
	): Entity | null {
		return this._collide(x, y, tag, true)[0] ?? null;
	}

	collideEntities(x: number, y: number, tag: ColliderTag | ColliderTag[]) {
		return this._collide(x, y, tag, false);
	}

	collide(x: number, y: number, tag: ColliderTag | ColliderTag[]) {
		if (!this.collider) return false;
		return this.collideEntity(x, y, tag) !== null;
	}

	collideMouse(x: number, y: number) {
		if (!this.collider) return false;

		const { input } = this.scene.engine;

		const mouseX = input.mouse.x + this.scene.camera.x;
		const mouseY = input.mouse.y + this.scene.camera.y;

		return Collision.collide(
			{
				type: 'point',
				x: mouseX - x,
				y: mouseY - y,
				collidable: true,
			},
			this.collider,
		);
	}
}
