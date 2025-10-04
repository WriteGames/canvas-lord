/* Canvas Lord v0.6.1 */

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
import { Delegate } from '../util/delegate.js';

// TODO(bret): Fix this type lol
type Graphic = IRenderable;

type ColliderType = ColliderTag | ColliderTag[] | Entity | Entity[];

type ComponentMap = Map<IEntityComponentType, RawComponent>;

export interface IEntity<TScene extends Scene = Scene> {
	x: number;
	y: number;
	pos: Vec2;
	w: number;
	width: number;
	h: number;
	height: number;
	scene: TScene;
	graphic: Graphic | undefined;
	collider: Collider | undefined;
	components: ComponentMap;
	visible: boolean;
	colliderVisible: boolean;

	onAdded: Delegate;
	onPreUpdate: Delegate<(input: Input) => void>;
	onUpdate: Delegate<(input: Input) => void>;
	onPostUpdate: Delegate<(input: Input) => void>;
	onRemoved: Delegate;
	onRender: Delegate<(ctx: Ctx, camera: Camera) => void>;

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
	preUpdate(input: Input): void;
	update: (input: Input) => void;
	postUpdate(input: Input): void;

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

export class Entity<TScene extends Scene = Scene>
	implements IEntity<TScene>, IRenderable
{
	#scene!: TScene; // NOTE: set by scene
	components: ComponentMap = new Map();
	depth = 0;
	#collider: Collider | undefined = undefined;
	visible = true;
	colliderVisible = false;
	#graphic: Graphic | undefined = undefined;
	#graphics: Graphic[] = [];

	// TODO(bret): below
	onAdded = new Delegate();
	onPreUpdate = new Delegate<(input: Input) => void>();
	onUpdate = new Delegate<(input: Input) => void>();
	onPostUpdate = new Delegate<(input: Input) => void>();
	// TODO(bret): below
	onRemoved = new Delegate();
	onRender = new Delegate<(ctx: Ctx, camera: Camera) => void>();

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

	get scene(): TScene {
		return this.#scene;
	}

	z__setScene(value: TScene): void {
		this.#scene = value;
	}

	constructor(x = 0, y = 0, graphic?: Graphic, collider?: Collider) {
		this.addComponent(Components.pos2D);
		this.x = x;
		this.y = y;
		this.graphic = graphic;
		this.collider = collider;
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

	resetComponent<C extends IEntityComponentType>(
		component: C,
	): ReturnType<typeof this.component<C>> {
		if (!this.components.has(component)) return undefined;

		// TODO(bret): We might want to be smarter about this and not create a new object each time
		this.components.set(component, Components.copyObject(component).data);
		return this.component(component);
	}

	removeComponent<C extends IEntityComponentType>(
		component: C,
	): ReturnType<typeof this.component<C>> {
		if (!this.components.has(component)) return undefined;

		const comp = this.component(component);
		this.components.delete(component);
		return comp;
	}

	addGraphic<T extends Graphic>(graphic: T): T {
		this.#graphics.push(graphic);
		graphic.parent = this;
		return graphic;
	}

	addGraphics<T extends Graphic[]>(graphics: T): T {
		graphics.forEach((g) => this.addGraphic(g));
		return graphics;
	}

	removeGraphic<T extends Graphic>(graphic: T): T {
		const index = this.#graphics.indexOf(graphic);
		if (index < 0) return graphic;
		this.#graphics.splice(index, 1);
		return graphic;
	}

	removeGraphics<T extends Graphic[]>(graphics: T): T {
		graphics.forEach((g) => this.removeGraphic(g));
		return graphics;
	}

	getScene<T extends TScene>(): T {
		return this.#scene as T;
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

	addedInternal(): void {
		this.added();
	}

	added(): void {
		//
	}

	preUpdateInternal(input: Input): void {
		this.onPreUpdate.invoke(input);
		this.preUpdate(input);
	}

	preUpdate(_input: Input): void {
		//
	}

	updateInternal(input: Input): void {
		this.onUpdate.invoke(input);
		this.updateTweens();
		this.update(input);
	}

	update(_input: Input): void {
		//
	}

	postUpdateInternal(input: Input): void {
		this.postUpdate(input);
		this.onPostUpdate.invoke(input);

		this.graphic?.update?.(input);
	}

	postUpdate(_input: Input): void {
		//
	}

	renderInternal(ctx: Ctx, camera: Camera): void {
		// TODO(bret): .visible should probably be on the Graphic, not the Entity itself
		if (!this.visible) return;

		this.#graphic?.render(ctx, camera);
		this.#graphics.forEach((g) => g.render(ctx, camera));
		this.render(ctx, camera);
		if (this.colliderVisible) this.renderCollider(ctx, camera);
		this.onRender.invoke(ctx, camera);
	}

	render(_ctx: Ctx, _camera: Camera): void {
		//
	}

	renderCollider(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.collider) return;

		this.collider.render(ctx, -camera.x, -camera.y);
	}

	#collide<T extends Entity>(
		x: number,
		y: number,
		match: ColliderType | undefined,
		earlyOut: boolean,
	): T[] {
		if (!this.collider) return [];

		const _x = this.x;
		const _y = this.y;
		this.x = x;
		this.y = y;

		let entities: Entity[] = this.#scene.entities.inScene;
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
			if (e === this) continue;
			if (!e.collider?.collidable) continue;
			if (tags.length > 0) {
				if (!e.collider.tag) continue;
				if (!tags.includes(e.collider.tag)) continue;
			}

			const collision = Collide.collide(this.collider, e.collider);
			const result = collision ? e : null;
			if (result === null) continue;

			collide.push(result as T);
			if (earlyOut) break;
		}

		this.x = _x;
		this.y = _y;

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
		match?: unknown,
	): T | null {
		return this.#collide<T>(x, y, match as ColliderType, true)[0] ?? null;
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

	collideMouse(x: number, y: number, cameraRelative = true): boolean {
		if (!this.collider) return false;

		const { input } = this.#scene.engine;

		const mouseX =
			input.mouse.x + (cameraRelative ? this.#scene.camera.x : 0);
		const mouseY =
			input.mouse.y + (cameraRelative ? this.#scene.camera.y : 0);

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
