/* Canvas Lord v0.4.4 */
import type {
	Engine,
	Entity,
	IEntitySystem,
	Renderable,
} from '../canvas-lord.js';
import { Draw } from './draw.js';
import { Camera } from './camera.js';
import { Vec2 } from './math.js';
import { Messages } from './messages.js';
import type { Input } from './input.js';
import type { CSSColor, IEntityComponentType } from './types.js';

interface Debug {
	dragStart: Vec2;
	camera: Vec2;
	cameraDelta: Vec2;
}

// TODO: it could be good to have a `frame: number` for which frame we're on
// it would increment, well, every frame :)
// TODO: should there be one in Game as well?
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
	screenPos: Vec2;
	camera: Camera;
	escapeToBlur: boolean;
	allowRefresh: boolean;
	// TODO: we need a Rect type, maybe class?
	bounds: [number, number, number, number] | null;

	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	debug?: Debug;
}

export class Scene implements Scene {
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

		this.screenPos = new Vec2(0, 0);
		this.camera = new Camera(0, 0);

		// TODO(bret): Make these false by default
		this.escapeToBlur = true;
		this.allowRefresh = true;

		this.bounds = null;
	}

	// TODO(bret): Gonna nwat to make sure we don't recreate the canvas/ctx on each call
	setCanvasSize(width: number, height: number): void {
		const canvas = (this.canvas = document.createElement('canvas'));
		const ctx = canvas.getContext('2d');
		if (ctx) this.ctx = ctx;
		canvas.width = width;
		canvas.height = height;
	}

	begin(): void {}

	end(): void {}

	pause(): void {}

	resume(): void {}

	addEntity<T extends Entity>(entity: T): T {
		entity.scene = this;
		this.entities.addQueue.push(entity);
		return entity;
	}

	#addEntitiesToScene(): void {
		const newEntities = this.entities.addQueue.splice(0);
		this.entities.inScene.push(...newEntities);
	}

	addRenderable<T extends Renderable>(renderable: T): T {
		// renderable.scene = this;
		this.renderables.addQueue.push(renderable);
		return renderable;
	}

	#addRenderablesToScene(): void {
		const newRenderables = this.renderables.addQueue.splice(0);
		this.renderables.inScene.push(...newRenderables);
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

	preUpdate(input: Input): void {}

	update(input: Input): void {
		// TODO: move the following two to game probably
		if (this.allowRefresh && input.keyPressed('F5')) location.reload();

		if (this.escapeToBlur && input.keyPressed('Escape'))
			this.engine.canvas.blur();

		if (!this.shouldUpdate) return;

		if (this.engine.debug) {
			this.debug ??= this.createDebug();

			const { dragStart, cameraDelta } = this.debug;

			if (input.mousePressed(1)) {
				dragStart.set(input.mouse.pos);
			}
			if (input.mouseCheck(1) || input.mouseReleased(1)) {
				cameraDelta.set(dragStart.sub(input.mouse.pos));
			}
			if (input.mouseReleased(1)) {
				this.debug.camera.x += cameraDelta.x;
				this.debug.camera.y += cameraDelta.y;
				cameraDelta.setXY(0, 0);
			}
			return;
		}

		this.entities.inScene.forEach((entity) => entity.update(input));
		this.entities.inScene.forEach((entity) =>
			entity.graphic?.update?.(input),
		);
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
		// TODO: this should maybe be in pre-render?
		this.renderables.inScene.sort(
			(a, b) => (b.depth ?? 0) - (a.depth ?? 0),
		);

		const ctx = this.ctx ?? gameCtx;
		const { canvas } = ctx;

		let { camera, backgroundColor } = this;
		if (this.engine.debug) {
			this.debug ??= this.createDebug();
			camera = new Camera(camera.x, camera.y);
			camera.x += this.debug.camera.x + this.debug.cameraDelta.x;
			camera.y += this.debug.camera.y + this.debug.cameraDelta.y;
		}

		if (this.ctx) {
			// set to the engine's background color if this is a standalone canvas
			backgroundColor ??= this.engine.backgroundColor;
		}

		if (backgroundColor) {
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		this.renderables.inScene.forEach((entity) =>
			entity.render(ctx, camera),
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
					Boolean((e as Entity).component?.(component)),
				);
				entities.forEach((entity) => {
					render(entity as Entity, ctx, camera);
				});
			});
		});

		if (ctx !== gameCtx) {
			const [x, y] = this.screenPos;
			gameCtx.drawImage(ctx.canvas, x, y);
		}

		if (this.engine.debug) {
			const canvasW = this.engine.canvas.width;
			const canvasH = this.engine.canvas.height;
			const rect = { x: 0, y: 0, width: canvasW, height: canvasH };
			Draw.rect(
				ctx,
				{ type: 'fill', color: '#20202055', ...rect },
				rect.x,
				rect.y,
				rect.width,
				rect.height,
			);

			this.entities.inScene.forEach((e) => {
				e.renderCollider(ctx, camera);
			});

			// show origins
			this.entities.inScene.forEach((e) => {
				const r = 3;
				Draw.circle(
					ctx,
					{ type: 'fill', color: 'lime', radius: r },
					e.x - r - camera.x,
					e.y - r - camera.y,
					r,
				);
			});
		}
	}

	createDebug(): Debug {
		return {
			dragStart: new Vec2(),
			camera: new Vec2(),
			cameraDelta: new Vec2(),
		};
	}
}
