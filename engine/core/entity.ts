/* Canvas Lord v0.6.1 */

import * as Collide from '../collider/collide.js';
import type { Collider } from '../collider/collider.js';
import type { ColliderTag } from '../collider/index.js';
import type { Graphic } from '../graphic/graphic.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';
import * as Components from '../util/components.js';
import { type ComponentProps } from '../util/components.js';
import { Delegate } from '../util/delegate.js';
import type { Tween } from '../util/tween.js';
import type {
	IEntityComponentType,
	IRenderable,
	RawComponent,
} from '../util/types.js';
import type { Input } from './input.js';
import type { Scene } from './scene.js';

type CollisionMatch = ColliderTag | ColliderTag[] | Entity | Entity[];

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
// const _mouseCollider = new PointCollider();

export class Entity<TScene extends Scene = Scene>
	implements IEntity<TScene>, IRenderable
{
	#scene!: TScene; // NOTE: set by scene
	components: ComponentMap = new Map();
	depth = 0;
	#collider: Collider | undefined = undefined;
	#colliders: Collider[] = [];
	visible = true;
	colliderVisible = false;
	#graphic: Graphic | undefined = undefined;
	#graphics: Graphic[] = [];

	onAdded = new Delegate();
	onPreUpdate = new Delegate<(input: Input) => void>();
	onUpdate = new Delegate<(input: Input) => void>();
	onPostUpdate = new Delegate<(input: Input) => void>();
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

	get width(): number {
		return this.collider?.w ?? 0;
	}
	set width(value) {
		if (this.collider) this.collider.width = value;
	}

	get w(): number {
		return this.width;
	}
	set w(value) {
		this.width = value;
	}

	get height(): number {
		return this.collider?.h ?? 0;
	}
	set height(value) {
		if (this.collider) this.collider.height = value;
	}

	get h(): number {
		return this.height;
	}
	set h(value) {
		this.height = value;
	}

	get graphic(): Graphic | undefined {
		return this.#graphic;
	}
	set graphic(graphic) {
		this.#graphic = graphic;
		if (this.#graphic) this.#graphic.parent = this;
	}

	get collider(): Collider | undefined {
		return this.#colliders[0];
	}
	set collider(value) {
		this.#colliders[0]?.assignParent(null);
		this.#colliders = value ? [value] : [];
		this.#colliders[0]?.assignParent(this);
	}

	get colliders(): Collider[] {
		return this.#colliders;
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

	addCollider(collider: Collider): void {
		if (this.colliders.includes(collider)) return;
		this.colliders.push(collider);
		collider.assignParent(this);
	}

	addColliders(...colliders: Collider[]): void {
		colliders.forEach((collider) => this.addCollider(collider));
	}

	removeCollider(collider: Collider): void {
		const index = this.colliders.indexOf(collider);
		if (index < 0) return;
		this.colliders.splice(index, 1);
		collider.assignParent(null);
	}

	removeColliders(...colliders: Collider[]): void {
		colliders.forEach((collider) => this.removeCollider(collider));
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
		this.preUpdate(input);
		this.onPreUpdate.invoke(input);
	}

	preUpdate(_input: Input): void {
		//
	}

	updateInternal(input: Input): void {
		this.updateTweens();
		this.update(input);
		this.onUpdate.invoke(input);
	}

	update(_input: Input): void {
		//
	}

	postUpdateInternal(input: Input): void {
		this.postUpdate(input);
		this.onPostUpdate.invoke(input);

		this.graphic?.update(input);
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
		this.colliders.forEach((collider) => {
			collider.render(ctx, -camera.x, -camera.y);
		});
	}

	removedInternal(): void {
		this.removed();
		this.onRemoved.invoke();
	}

	removed(): void {
		//
	}

	#collide<T extends Entity>(
		x: number,
		y: number,
		match: CollisionMatch | undefined,
		earlyOut: boolean,
	): T[] {
		if (!this.collider) return [];

		const n = this.colliders.length;
		if (earlyOut) {
			for (let i = 0; i < n; ++i) {
				const collider = this.colliders[i];
				const collisions = collider.collide<T>(x, y, match, earlyOut);
				if (collisions.length > 0) return collisions;
			}
			return [];
		}

		const entities: T[] = [];
		for (let i = 0; i < n; ++i) {
			const collider = this.colliders[i];
			const collisions = collider.collide<T>(x, y, match, earlyOut);
			for (let j = 0; j < collisions.length; ++j) {
				if (entities.includes(collisions[j])) continue;
				entities.push(collisions[j]);
			}
		}
		return entities;
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
		return this.#collide<T>(x, y, match as CollisionMatch, true)[0] ?? null;
	}

	collideEntities(x: number, y: number): Entity[];
	collideEntities(x: number, y: number, tag?: ColliderTag): Entity[];
	collideEntities(x: number, y: number, tags: ColliderTag[]): Entity[];
	collideEntities(x: number, y: number, entity: Entity): Entity[];
	collideEntities(x: number, y: number, entities: Entity[]): Entity[];
	collideEntities(x: number, y: number, match?: unknown): Entity[] {
		return this.#collide(x, y, match as CollisionMatch, false);
	}

	collide(x: number, y: number): boolean;
	collide(x: number, y: number, tag?: ColliderTag): boolean;
	collide(x: number, y: number, tags: ColliderTag[]): boolean;
	collide(x: number, y: number, entity: Entity): boolean;
	collide(x: number, y: number, entities: Entity[]): boolean;
	collide(x: number, y: number, match?: unknown): boolean {
		return this.#collide(x, y, match as CollisionMatch, true).length > 0;
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
				left: mouseX,
				y: mouseY,
				top: mouseY,
				collidable: true,
			} as Collider,
			this.collider,
		);
		this.x = _x;
		this.y = _y;
		return res;
	}
}
