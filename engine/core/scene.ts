/* Canvas Lord v0.5.3 */

import type { Engine } from './engine.js';
import { Entity } from './entity.js';
import type { Input } from './input.js';
import { Vec2 } from '../math/index.js';
import { Camera } from '../util/camera.js';
import type { Canvas, Ctx } from '../util/canvas.js';
import { Messages } from '../util/messages.js';
import type {
	IEntitySystem,
	Renderable,
	CSSColor,
	IEntityComponentType,
} from '../util/types.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import type { Graphic } from '../graphic/graphic.js';
import { Delegate } from '../util/delegate.js';

// TODO: it could be good to have a `frame: number` for which frame we're on
// it would increment, well, every frame :)
// TODO: should there be one in Game as well?
export interface Scene {
	backgroundColor?: CSSColor;
	entities: {
		addQueue: Entity[];
		inScene: Entity[];
		removeQueue: Entity[];
	};
	renderables: {
		addQueue: Renderable[];
		inScene: Renderable[];
		removeQueue: Renderable[];
	};
	componentSystemMap: Map<IEntityComponentType, IEntitySystem[]>;
	messages: Messages;
	shouldUpdate: boolean;
	screenPos: Vec2;
	camera: Camera;
	escapeToBlur: boolean;
	allowRefresh: boolean;
	// TODO: we need a Rect type, maybe class?
	bounds: [number, number, number, number] | null;

	canvas: Canvas;
	ctx: Ctx;

	onPreUpdate: Delegate<(input: Input) => void>;
	onUpdate: Delegate<(input: Input) => void>;
	onPostUpdate: Delegate<(input: Input) => void>;
	onRender: Delegate<(ctx: Ctx) => void>;
	onInit: Delegate;
	onBegin: Delegate;
	onEnd: Delegate;
	onResume: Delegate;
	onPause: Delegate;

	render(ctx: Ctx, camera: Camera): void;
}

export class Scene implements Scene {
	#engine!: Engine;

	get engine(): Engine {
		return this.#engine;
	}

	constructor(engine?: Engine) {
		// TODO(bret): this is depreciated, engine now gets set in initInternal()
		if (engine) this.#engine = engine;

		this.componentSystemMap = new Map();

		this.entities = {
			addQueue: [],
			inScene: [],
			removeQueue: [],
		};

		this.renderables = {
			addQueue: [],
			inScene: [],
			removeQueue: [],
		};

		this.shouldUpdate = true;

		this.messages = new Messages();

		this.screenPos = new Vec2(0, 0);
		this.camera = new Camera(0, 0);

		// TODO(bret): Make these false by default
		this.escapeToBlur = true;
		this.allowRefresh = true;

		this.bounds = null;

		this.onPreUpdate = new Delegate();
		this.onUpdate = new Delegate();
		this.onPostUpdate = new Delegate();
		this.onRender = new Delegate();
		this.onInit = new Delegate();
		this.onBegin = new Delegate();
		this.onEnd = new Delegate();
		this.onResume = new Delegate();
		this.onPause = new Delegate();
	}

	#mouse = new Vec2(-1, -1);
	get mouse(): Vec2 {
		const pos = this.engine.input.mouse.pos.add(this.camera);
		this.#mouse.set(pos);
		return this.#mouse;
	}

	// TODO(bret): Gonna nwat to make sure we don't recreate the canvas/ctx on each call
	setCanvasSize(width: number, height: number): void {
		if (!this.canvas as unknown) {
			const { canvas, ctx } = generateCanvasAndCtx(width, height);
			if (!ctx) throw new Error();
			this.canvas = canvas;
			this.ctx = ctx;
		}
	}

	initInternal(engine: Engine): void {
		this.#engine = engine;

		this.onInit.invoke();

		this.init();
	}

	init(): void {
		//
	}

	beginInternal(): void {
		this.engine.onSceneBegin.invoke(this);
		this.onBegin.invoke();

		this.begin();
	}

	begin(): void {
		//
	}

	endInternal(): void {
		this.engine.onSceneEnd.invoke(this);
		this.onEnd.invoke();

		this.end();
	}

	end(): void {
		//
	}

	pauseInternal(): void {
		this.onPause.invoke();

		this.pause();
	}

	pause(): void {
		//
	}

	resumeInternal(): void {
		this.onResume.invoke();

		this.resume();
	}

	resume(): void {
		//
	}

	addGraphic<T extends Graphic>(graphic: T, x = 0, y = 0): Entity {
		const entity = new Entity(x, y);
		entity.graphic = graphic;
		this.addEntity(entity);
		return entity;
	}

	addEntity<T extends Entity>(entity: T, renderable = true): T {
		entity.z__setScene(this);
		this.entities.addQueue.push(entity);
		if (renderable) this.addRenderable(entity);
		return entity;
	}

	addEntities(...entities: Entity[] | Entity[][]): Entity[] {
		const _entities = entities.flat();
		_entities.forEach((e) => this.addEntity(e));
		return _entities;
	}

	#addEntitiesToScene(): void {
		const newEntities = this.entities.addQueue.splice(0);
		for (let i = 0; i < newEntities.length; ++i) {
			const e = newEntities[i];
			if (this.entities.inScene.includes(e)) continue;
			this.entities.inScene.push(e);
			e.addedInternal();
			e.onAdded.invoke();
		}
	}

	addRenderable<T extends Renderable>(renderable: T): T {
		// renderable.scene = this;
		this.renderables.addQueue.push(renderable);
		return renderable;
	}

	addRenderables(...renderables: Entity[] | Entity[][]): Entity[] {
		const _renderables = renderables.flat();
		_renderables.forEach((r) => this.addRenderable(r));
		return _renderables;
	}

	#addRenderablesToScene(): void {
		const newRenderables = this.renderables.addQueue.splice(0);
		for (let i = 0; i < newRenderables.length; ++i) {
			const r = newRenderables[i];
			if (this.renderables.inScene.includes(r)) continue;
			this.renderables.inScene.push(r);
		}
	}

	removeEntity<T extends Entity>(entity: T): T {
		this.entities.removeQueue.push(entity);
		return entity;
	}

	#removeEntitiesFromScene(): void {
		const oldEntities = this.entities.removeQueue.splice(0);
		oldEntities.forEach((e) => {
			const index = this.entities.inScene.indexOf(e);
			this.entities.inScene.splice(index, 1);
			e.onRemoved.invoke();
		});
	}

	removeRenderable<T extends Renderable>(renderable: T): T {
		this.renderables.removeQueue.push(renderable);
		return renderable;
	}

	#removeRenderablesFromScene(): void {
		const oldRenderables = this.renderables.removeQueue.splice(0);
		oldRenderables.forEach((r) => {
			const index = this.renderables.inScene.indexOf(r);
			this.renderables.inScene.splice(index, 1);
		});
	}

	updateLists(): void {
		this.#addEntitiesToScene();
		this.#removeEntitiesFromScene();

		this.#addRenderablesToScene();
		this.#removeRenderablesFromScene();
	}

	preUpdateInternal(input: Input): void {
		this.onPreUpdate.invoke(input);

		this.preUpdate(input);

		this.entities.inScene.forEach((entity) => {
			entity.preUpdateInternal(input);
		});
	}

	preUpdate(_input: Input): void {
		//
	}

	updateInternal(input: Input): void {
		// TODO: move the following two to game probably
		if (this.allowRefresh && input.keyPressed('F5')) location.reload();

		if (this.escapeToBlur && input.keyPressed('Escape'))
			this.engine.canvas.blur();

		if (!this.shouldUpdate) return;

		this.onUpdate.invoke(input);

		this.update(input);

		this.entities.inScene.forEach((entity) => {
			entity.updateInternal(input);
		});
		// this.renderables = this.renderables.filter(e => e).sort();

		this.componentSystemMap.forEach((systems, component) => {
			systems.forEach((system) => {
				const { update } = system;
				if (!update) return;

				const entities = this.entities.inScene.filter((e) =>
					Boolean(e.component(component)),
				);
				entities.forEach((entity) => update(entity, input));
			});
		});
	}

	update(_input: Input): void {
		//
	}

	postUpdateInternal(input: Input): void {
		this.onPostUpdate.invoke(input);

		this.postUpdate(input);

		this.entities.inScene.forEach((entity) => {
			entity.postUpdateInternal(input);
		});
	}

	postUpdate(_input: Input): void {
		//
	}

	renderInternal(gameCtx: Ctx): void {
		const ctx = ((this.ctx as unknown) ?? gameCtx) as Ctx;
		const { canvas } = ctx;

		this.onRender.invoke(ctx);

		// TODO: this should maybe be in pre-render?
		this.renderables.inScene.sort(
			(a, b) => (b.depth ?? 0) - (a.depth ?? 0),
		);

		const { camera } = this;
		let { backgroundColor } = this;

		if (this.ctx as unknown) {
			// set to the engine's background color if this is a standalone canvas
			backgroundColor ??= this.engine.backgroundColor;
		}

		if (backgroundColor) {
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		// TODO(bret): Fix how render/renderInternal works for renderables
		this.renderables.inScene.forEach((entity) =>
			(entity as unknown as Entity).renderInternal(ctx, camera),
		);

		// const width = 2;
		// const posOffset = 0.5;
		// const widthOffset = width;
		// ctx.strokeStyle = '#787878';
		// ctx.lineWidth = (width * 2 - 1);
		// ctx.strokeRect(posOffset, posOffset, canvas.width - 1, canvas.height - 1);

		this.componentSystemMap.forEach((systems, component) => {
			systems.forEach((system) => {
				const { render } = system;
				if (!render) return;

				const entities = this.renderables.inScene.filter((e) =>
					Boolean((e as Entity).component(component)),
				);
				entities.forEach((entity) => {
					render(entity as Entity, ctx, camera);
				});
			});
		});

		this.render(ctx, camera);

		if (ctx !== gameCtx) {
			const [x, y] = this.screenPos;
			gameCtx.drawImage(ctx.canvas, x, y);
		}
	}

	render(_ctx: Ctx, _camera: Camera): void {
		//
	}
}
