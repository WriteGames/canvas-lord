/* Canvas Lord v0.5.3 */

import type { Input } from './input.js';
import type { Scene } from './scene.js';
import type { Collider } from '../collider/collider.js';
import * as Collide from '../collider/collide.js';
import { PointCollider, type ColliderTag } from '../collider/index.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';
import * as Components from '../util/components.js';
import { type ComponentProps } from '../util/components.js';
import type {
	IRenderable,
	IEntityComponentType,
	RawComponent,
} from '../util/types.js';
import type { Tween } from '../util/tween.js';

// TODO(bret): Fix this type lol
type Graphic = IRenderable;

type ColliderType = ColliderTag | ColliderTag[] | Entity | Entity[];

type ComponentMap = Map<IEntityComponentType, RawComponent>;

export interface IEntity {
	x: number;
	y: number;
	pos: Vec2;
	w: number;
	width: number;
	h: number;
	height: number;
	scene: Scene;
	graphic: Graphic | undefined;
	collider: Collider | undefined;
	components: ComponentMap;
	visible: boolean;

	setPos(x: number, y: number): void;
	setPos(pos: Vec2): void;

	// TODO(bret): What about allowing component to take in an array and return an array? IE allow for destructuring instead of multiple calls?
	addComponent: <T extends IEntityComponentType>(
		component: T,
	) => ReturnType<IEntity['component']>;
	component: <T extends IEntityComponentType>(
		component: T,
	) => ComponentProps<T> | undefined;

	addTween(tween: Tween): Tween;
	removeTween(tween: Tween): Tween;
	clearTweens(): void;

	updateTweens(): void;
	update: (input: Input) => void;

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

	collideMouse(x: number, y: number): boolean;
}

// TODO(bret): hook this up
const _mouseCollider = new PointCollider();

export class Entity implements IEntity, IRenderable {
	scene!: Scene; // NOTE: set by scene
	components: ComponentMap = new Map();
	depth = 0;
	#collider: Collider | undefined = undefined;
	visible = true;
	#graphic: Graphic | undefined = undefined;

	get x(): number {
		return this.component(Components.pos2D)![0];
	}

	set x(val) {
		this.component(Components.pos2D)![0] = val;
	}

	get y(): number {
		return this.component(Components.pos2D)![1];
	}

	set y(val) {
		this.component(Components.pos2D)![1] = val;
	}

	get pos(): Vec2 {
		return this.component(Components.pos2D)!.clone();
	}

	set pos(val: Vec2) {
		this.component(Components.pos2D)!.set(val);
	}

	// TODO(bret): Set up setters for these as well
	// TODO(bret): Would be good to set up for non-rect shapes :)
	get width(): number {
		if (this.collider && 'w' in this.collider)
			// TODO(bret): fix "as number"
			return this.collider.w as number;
		return 0;
	}

	get w(): number {
		return this.width;
	}

	get height(): number {
		if (this.collider && 'h' in this.collider)
			// TODO(bret): fix "as number"
			return this.collider.h as number;
		return 0;
	}

	get h(): number {
		return this.height;
	}

	get graphic(): Graphic | undefined {
		return this.#graphic;
	}

	set graphic(graphic) {
		this.#graphic = graphic;
		if (this.#graphic) this.#graphic.parent = this;
	}

	get collider(): Collider | undefined {
		return this.#collider;
	}

	set collider(value) {
		// TODO(bret): Might be good to do this, not sure yet
		// this.#collider?.assignParent(null);
		this.#collider = value;
		this.#collider?.assignParent(this);
	}

	constructor(x = 0, y = 0) {
		this.addComponent(Components.pos2D);
		this.x = x;
		this.y = y;
	}

	setPos(x: number, y: number): void;
	setPos(pos: Vec2): void;
	setPos(...args: unknown[]): void {
		if (typeof args[0] === 'number' && typeof args[1] === 'number') {
			const [x, y] = args;
			this.x = x;
			this.y = y;
		} else if (args[0] instanceof Vec2) {
			const [vec] = args;
			this.x = vec[0];
			this.y = vec[1];
		}
	}

	addComponent<C extends IEntityComponentType>(
		component: C,
	): ReturnType<typeof this.component<C>> {
		// TODO: we'll want to make sure we use a deepCopy
		this.components.set(component, Components.copyObject(component).data);
		return this.component(component);
	}

	component<C extends IEntityComponentType>(
		component: C,
	): ComponentProps<C> | undefined {
		const c = this.components.get(component);
		if (!c) return undefined;
		return c as ComponentProps<C>;
	}

	tweens: Tween[] = [];

	addTween(tween: Tween): Tween {
		if (tween.parent) throw new Error('Tween already has parent');
		this.tweens.push(tween);
		tween.parent = this;
		return tween;
	}

	removeTween(tween: Tween): Tween {
		const index = this.tweens.indexOf(tween);
		if (index < 0) return tween;
		this.tweens.splice(index, 1);
		return tween;
	}

	clearTweens(): void {
		this.tweens.splice(0, this.tweens.length);
	}

	updateTweens(): void {
		this.tweens.forEach((t) => t.update());
	}

	update(_input: Input): void {
		//
	}

	render(ctx: Ctx, camera: Camera): void {
		// TODO(bret): .visible should probably be on the Graphic, not the Entity itself
		if (this.visible) {
			this.#graphic?.render(ctx, camera);
		}
	}

	renderCollider(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.collider) return;

		this.collider.render(ctx, -camera.x, -camera.y);
	}

	#collide(
		x: number,
		y: number,
		match: ColliderType | undefined,
		earlyOut: boolean,
	): Entity[] {
		if (!this.collider) return [];

		const _x = this.x;
		const _y = this.y;
		this.x = x;
		this.y = y;

		let entities: Entity[] = this.scene.entities.inScene;
		let tags: ColliderTag[] = [];

		switch (true) {
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
				throw new Error('unknown error');
		}

		const n = entities.length;
		const collide: Entity[] = [];
		for (let i = 0; i < n; ++i) {
			const e = entities[i];
			if (e === this) continue;
			if (!e.collider?.collidable) continue;
			if (e.collider.tag && !tags.includes(e.collider.tag)) continue;

			const collision = Collide.collide(this.collider, e.collider);
			const result = collision ? e : null;
			if (result === null) continue;

			collide.push(result);
			if (earlyOut) break;
		}

		this.x = _x;
		this.y = _y;

		return collide;
	}

	collideEntity(x: number, y: number): Entity;
	collideEntity(x: number, y: number, tag?: ColliderTag): Entity;
	collideEntity(x: number, y: number, tags: ColliderTag[]): Entity;
	collideEntity(x: number, y: number, entity: Entity): Entity;
	collideEntity(x: number, y: number, entities: Entity[]): Entity;
	collideEntity(x: number, y: number, match?: unknown): Entity | null {
		return this.#collide(x, y, match as ColliderType, true)[0] ?? null;
	}

	collideEntities(x: number, y: number): Entity[];
	collideEntities(x: number, y: number, tag?: ColliderTag): Entity[];
	collideEntities(x: number, y: number, tags: ColliderTag[]): Entity[];
	collideEntities(x: number, y: number, entity: Entity): Entity[];
	collideEntities(x: number, y: number, entities: Entity[]): Entity[];
	collideEntities(x: number, y: number, match?: unknown): Entity[] {
		return this.#collide(x, y, match as ColliderType, false);
	}

	collide(x: number, y: number): boolean;
	collide(x: number, y: number, tag?: ColliderTag): boolean;
	collide(x: number, y: number, tags: ColliderTag[]): boolean;
	collide(x: number, y: number, entity: Entity): boolean;
	collide(x: number, y: number, entities: Entity[]): boolean;
	collide(x: number, y: number, match?: unknown): boolean {
		return this.#collide(x, y, match as ColliderType, true).length > 0;
	}

	collideMouse(x: number, y: number): boolean {
		if (!this.collider) return false;

		const { input } = this.scene.engine;

		const mouseX = input.mouse.x + this.scene.camera.x;
		const mouseY = input.mouse.y + this.scene.camera.y;

		const _x = this.x;
		const _y = this.y;
		this.x = x;
		this.y = y;
		const res = Collide.collide(
			// TODO(bret): input.mouse.collider or smth
			{
				type: 'point',
				x: mouseX,
				// TODO(bret): fix meeeee
				// @ts-expect-error -- left and top don't exist??
				left: mouseX,
				y: mouseY,
				top: mouseY,
				collidable: true,
			},
			this.collider,
		);
		this.x = _x;
		this.y = _y;
		return res;
	}
}
