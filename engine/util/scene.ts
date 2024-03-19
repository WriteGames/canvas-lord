import type {
	Engine,
	Entity,
	Input,
	IEntitySystem,
	Renderable,
} from '../canvas-lord.js';
import { Camera } from './camera.js';
import type { V2 } from './math.js';
import { Messages } from './messages.js';
import type { CSSColor, IEntityComponentType } from './types.js';

export interface Scene {
	engine: Engine;
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
	screenPos: V2;
	camera: Camera;
	escapeToBlur: boolean;
	allowRefresh: boolean;
	boundsX: number | null;
	boundsY: number | null;

	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
}

export class Scene {
	constructor(engine: Engine) {
		this.engine = engine;

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

		this.screenPos = [0, 0];
		this.camera = new Camera(0, 0);

		// TODO(bret): Make these false by default
		this.escapeToBlur = true;
		this.allowRefresh = true;

		// this.width = this.height = null;
		this.boundsX = this.boundsY = null;
	}

	// TODO(bret): Gonna nwat to make sure we don't recreate the canvas/ctx on each call
	setCanvasSize(width: number, height: number): void {
		const canvas = (this.canvas = document.createElement('canvas'));
		const ctx = canvas.getContext('2d');
		if (ctx) this.ctx = ctx;
		canvas.width = width;
		canvas.height = height;
	}

	begin(): void {
		this.#addEntitiesToScene();
		this.#addRenderablesToScene();
		// TODO: should we also handle any entities removed? :thinking:
	}

	addEntity(entity: Entity): Entity {
		entity.scene = this;
		this.entities.addQueue.push(entity);
		return entity;
	}

	#addEntitiesToScene(): void {
		const newEntities = this.entities.addQueue.splice(0);
		this.entities.inScene.push(...newEntities);
	}

	addRenderable(renderable: Renderable): Renderable {
		// renderable.scene = this;
		this.renderables.addQueue.push(renderable);
		return renderable;
	}

	#addRenderablesToScene(): void {
		const newRenderables = this.renderables.addQueue.splice(0);
		this.renderables.inScene.push(...newRenderables);
	}

	preUpdate(input: Input): void {
		this.#addEntitiesToScene();
		this.#addRenderablesToScene();
	}

	update(input: Input): void {
		// TODO: move the following two to game probably
		if (this.allowRefresh && input.keyPressed('F5')) location.reload();

		if (this.escapeToBlur && input.keyPressed('Escape'))
			this.engine.canvas.blur();

		if (!this.shouldUpdate) return;

		// remove old entities

		this.entities.inScene.forEach((entity) => entity.update(input));
		// this.renderables = this.renderables.filter(e => e).sort();

		this.componentSystemMap.forEach((systems, component) => {
			systems.forEach((system) => {
				const { update } = system;
				if (!update) return;

				const entities = this.entities.inScene.filter((e) =>
					Boolean(e.component?.(component)),
				);
				entities.forEach((entity) => update(entity, input));
			});
		});
	}

	postUpdate(input: Input): void {}

	render(gameCtx: CanvasRenderingContext2D): void {
		const ctx = this.ctx ?? gameCtx;
		const { canvas } = ctx;
		if (this.backgroundColor) {
			ctx.fillStyle = this.backgroundColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		this.renderables.inScene.forEach((entity) =>
			entity.render(ctx, this.camera),
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

				const entities = this.entities.inScene.filter((e) =>
					Boolean(e.component?.(component)),
				);
				entities.forEach((entity) => {
					render(entity, ctx, this.camera);
				});
			});
		});

		if (ctx !== gameCtx) {
			gameCtx.drawImage(ctx.canvas, ...this.screenPos);
		}
	}
}
