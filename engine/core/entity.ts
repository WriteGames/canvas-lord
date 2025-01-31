/* Canvas Lord v0.4.4 */
import type { Input } from './input.js';
import type { Scene } from './scene.js';
import type { Camera } from '../util/camera.js';
import { Collider } from '../collider/collider.js';
import * as Collide from '../collider/collide.js';
import { PointCollider, type ColliderTag } from '../collider/index.js';
import * as Components from '../util/components.js';
import { type ComponentProps } from '../util/components.js';
import { Draw } from '../util/draw.js';
import type { IRenderable, IEntityComponentType } from '../util/types.js';

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

const mouseCollider = new PointCollider();

export class Entity implements IEntity, IRenderable {
	scene!: Scene; // NOTE: set by scene
	components = new Map<IEntityComponentType, any>();
	depth = 0;
	collider: Collider | undefined = undefined;
	visible = true;
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
		if (this.collider && 'w' in this.collider)
			// TODO(bret): fix "as number"
			return this.collider.w as number;
		return 0;
	}

	get w() {
		return this.width;
	}

	get height() {
		if (this.collider && 'h' in this.collider)
			// TODO(bret): fix "as number"
			return this.collider.h as number;
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

		const drawX = this.x - camera.x;
		const drawY = this.y - camera.y;
		this.collider.render?.(ctx, drawX, drawY);
	}

	_moveCollider(c: Collider, x: number, y: number) {
		c.x += x;
		c.y += y;
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
			if (!e.collider?.collidable) continue;
			if (tags.length && !tags.includes(e.collider.tag)) continue;

			this._moveCollider(this.collider, x, y);
			this._moveCollider(e.collider, e.x, e.y);
			const collision = Collide.collide(this.collider, e.collider);
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

		return Collide.collide(
			// TODO(bret): input.mouse.collider or smth
			// @ts-expect-error
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
