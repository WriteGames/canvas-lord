/* Canvas Lord v0.6.1 */

import type { Engine } from '../core/engine.js';
import type { Entity } from '../core/entity.js';
import type { Input } from '../core/input.js';
import type { Scene } from '../core/scene.js';
import type { Ctx } from './canvas.js';
import { Vec2 } from '../math/index.js';
import { Camera } from './camera.js';
import { Draw } from './draw.js';
import {
	AnimatedSprite,
	type Graphic,
	type GraphicClass,
	Sprite,
	Tileset,
} from '../graphic/index.js';
import type { ImageAsset } from '../core/asset-manager.js';

interface DebugSceneData {
	scene: Scene;
	originalCamera: Camera;

	dragStart: Vec2;
	camera: Vec2;
	cameraDelta: Vec2;

	selectedEntities: Entity[];
}

export interface Debug {
	engine: Engine;
	graphic: Partial<{
		sprite: Sprite;
		animatedSprite: AnimatedSprite;
	}>;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	hiddenCanvas: OffscreenCanvas;
	hiddenCtx: OffscreenCanvasRenderingContext2D;
	// TODO(bret): Gonna need to support multiple parallel scenes! :S
	sceneData: Map<Scene, DebugSceneData>;
}

const entityRenderH = 28 + 50 + 160;

export class Debug implements Debug {
	#enabled = false;

	// TODO(bret): differentiate between "enabled" and "open"
	get enabled(): boolean {
		return this.#enabled;
	}

	constructor(engine: Engine) {
		this.engine = engine;

		this.sceneData = new Map();
		this.graphic = {};

		{
			const canvas = document.createElement('canvas');
			canvas.width = engine.canvas.width;
			canvas.height = engine.canvas.height;
			canvas.style.width = `${canvas.width}px`;
			canvas.style.height = `${canvas.height}px`;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error();

			this.canvas = canvas;
			this.ctx = ctx;

			this.engine.canvas.after(canvas);
		}

		{
			const canvas = new OffscreenCanvas(1, 1);
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error();

			this.hiddenCanvas = canvas;
			this.hiddenCtx = ctx;
		}
	}

	// TODO: gonna need to release this!
	getGraphic(type: GraphicClass, options: { asset: ImageAsset }): void {
		let graphic: Graphic;
		switch (type) {
			case Sprite:
				graphic = this.graphic.sprite ??= new Sprite(options.asset);
				break;
			case Tileset:
				graphic = this.graphic.sprite ??= new Sprite(options.asset);
				break;
			case AnimatedSprite:
				graphic = this.graphic.animatedSprite ??= new AnimatedSprite(
					options.asset,
					100,
					100,
				);
				break;
			// TODO(bret): NineSlice, Emitter
			default:
				throw new Error('unsupported');
		}

		graphic.reset();
	}

	toggle(): void {
		this.enabled ? this.close() : this.open();
	}

	open(): void {
		this.#enabled = true;
	}

	close(): void {
		this.#enabled = false;

		[...this.sceneData.entries()].forEach(([scene, data]) => {
			scene.camera = data.originalCamera;
		});
		this.sceneData.clear();
	}

	update(input: Input): void {
		if (input.keyPressed('Backquote')) {
			this.toggle();
		}

		if (!this.enabled) return;

		this.engine.currentScenes?.forEach((scene) => {
			let sceneData = this.sceneData.get(scene);
			if (!sceneData) {
				sceneData = {
					scene,
					originalCamera: scene.camera,
					camera: new Vec2(),
					cameraDelta: new Vec2(),
					dragStart: new Vec2(),
					selectedEntities: [],
				};
				this.sceneData.set(scene, sceneData);
				scene.camera = scene.camera.clone();

				sceneData.selectedEntities = scene.entities.inScene
					.filter((e) => e.constructor.name === 'Spike')
					.slice(0, 1);
			}

			const { originalCamera, dragStart, camera, cameraDelta } =
				sceneData;

			// TODO(bret): Multi-scene support for this!
			// aka if (mouseInScene) { ... }
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this is for testing purposes
			if (true) {
				if (input.mousePressed(0)) {
					const entities = scene.entities.inScene.filter((e) => {
						return e.collideMouse(e.x, e.y);
					});
					sceneData.selectedEntities = entities;
				}
				if (input.mousePressed(2)) {
					sceneData.selectedEntities = [];
				}

				if (input.mousePressed(1)) {
					dragStart.set(input.mouse.pos);
				}
				if (input.mouseCheck(1) || input.mouseReleased(1)) {
					cameraDelta.set(dragStart.sub(input.mouse.pos));
				}
				if (input.mouseReleased(1)) {
					sceneData.camera.x += cameraDelta.x;
					sceneData.camera.y += cameraDelta.y;
					cameraDelta.setXY(0, 0);
				}
			}

			scene.camera.set(originalCamera.add(camera).add(cameraDelta));
		});
	}

	renderGraphicWithRect(
		ctx: Ctx,
		graphic: Tileset | Sprite,
		x: number,
		y: number,
		highlightRect?: { x: number; y: number; w: number; h: number },
	): void {
		if (graphic instanceof Tileset || graphic instanceof Sprite) {
			const asset = 'sprite' in graphic ? graphic.sprite : graphic.asset;
			this.graphic.sprite ??= new Sprite(asset);
			const tempSprite = this.graphic.sprite;
			tempSprite.asset = asset;
			tempSprite.x = 0;
			tempSprite.y = 0;
			tempSprite.sourceX = 0;
			tempSprite.sourceY = 0;
			tempSprite.sourceW = undefined;
			tempSprite.sourceH = undefined;
			tempSprite.alpha = 1.0;

			const canvasPadding = 10;
			const { hiddenCanvas: canvas } = this;
			canvas.width = tempSprite.width + canvasPadding * 2;
			canvas.height = tempSprite.height + canvasPadding * 2;

			this.hiddenCtx.save();

			// const maxImageW = canvas.width - canvasPadding * 2;
			// const maxImageH = canvas.height - canvasPadding * 2;

			this.hiddenCtx.fillStyle = 'black';
			this.hiddenCtx.fillRect(0, 0, canvas.width, canvas.height);

			this.hiddenCtx.translate(canvasPadding, canvasPadding);
			this.hiddenCtx.fillStyle = 'black';
			this.hiddenCtx.fillRect(0, 0, tempSprite.width, tempSprite.height);

			const rect = highlightRect ?? {
				x: 0,
				y: 0,
				w: tempSprite.width,
				h: tempSprite.height,
			};

			if (highlightRect) {
				tempSprite.alpha = 0.5;
				tempSprite.render(this.hiddenCtx);

				// Draw full-alpha rect
				this.hiddenCtx.globalCompositeOperation = 'destination-out';
				this.hiddenCtx.fillStyle = 'black';
				this.hiddenCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
				this.hiddenCtx.globalCompositeOperation = 'source-over';
			}

			tempSprite.x = rect.x;
			tempSprite.y = rect.y;
			tempSprite.sourceX = rect.x;
			tempSprite.sourceY = rect.y;
			tempSprite.sourceW = rect.w;
			tempSprite.sourceH = rect.h;

			tempSprite.alpha = 1.0;
			tempSprite.render(this.hiddenCtx, Vec2.zero);

			const lineW = 3;
			const lineP = lineW + 1;
			const offset = lineP * 0.5;
			this.hiddenCtx.lineWidth = lineW;
			this.hiddenCtx.strokeStyle = 'white';
			this.hiddenCtx.strokeRect(
				rect.x - offset + 0.5,
				rect.y - offset + 0.5,
				rect.w ? rect.w + lineP - 1 : 0,
				rect.h ? rect.h + lineP - 1 : 0,
			);

			let drawW = tempSprite.width;
			let drawH = tempSprite.height;
			const maxWidth = 128 - canvasPadding * 2;
			if (tempSprite.width > maxWidth) {
				drawW = maxWidth;
				const ratio = maxWidth / tempSprite.width;
				drawH = tempSprite.height * ratio;
			}

			const fullW = drawW + canvasPadding * 2;
			const drawRect = [
				x - (fullW >> 1),
				y,
				fullW,
				drawH + canvasPadding * 2,
			] as [number, number, number, number];
			ctx.save();
			ctx.fillStyle = 'black';
			ctx.fillRect(...drawRect);
			ctx.drawImage(canvas, ...drawRect);
			drawRect[0] += 0.5;
			drawRect[1] += 0.5;
			ctx.strokeStyle = '#ffffff66';
			ctx.strokeRect(...drawRect);
			ctx.restore();

			this.hiddenCtx.restore();
		}
	}

	renderEntityDebug(
		ctx: CanvasRenderingContext2D,
		entity: Entity,
		y = 0,
	): void {
		const padding = 8;
		const w = 480 - padding * 2;
		const h = entityRenderH;

		const drawX = this.engine.canvas.width - w - 8;
		const drawY = 8 + y;

		const rect = { x: drawX, y: drawY, width: w, height: h };
		Draw.rect(
			ctx,
			{
				type: 'fill',
				color: '#101010',
				alpha: 0.5,
				...rect,
			},
			rect.x,
			rect.y,
			rect.width,
			rect.height,
		);
		Draw.rect(
			ctx,
			{
				type: 'stroke',
				color: 'white',
				alpha: 0.5,
				...rect,
			},
			rect.x,
			rect.y,
			rect.width,
			rect.height,
		);

		const drawText = (
			x: number,
			y: number,
			str: string,
			align?: 'left' | 'right',
		): void => {
			Draw.text(
				ctx,
				{ type: 'fill', color: 'white', size: 16, align },
				x,
				y,
				str,
			);
		};

		drawText(drawX + padding, drawY + padding, entity.constructor.name);

		const posStr = `(${entity.x}, ${entity.y})`;
		drawText(drawX + w - padding, drawY + padding, posStr, 'right');

		const { graphic } = entity;
		if (!graphic) return;

		let assetStr = null;
		// TODO(bret): Fix this shenanigans
		if ('asset' in graphic)
			assetStr = (graphic.asset as { fileName: string }).fileName;
		if ('sprite' in graphic)
			assetStr = (graphic.sprite as { fileName: string }).fileName;
		if (assetStr) assetStr = `("${assetStr}")`;
		const graphicStr = [graphic.constructor.name, assetStr].join(' ');
		drawText(drawX + padding, drawY + padding + 30, graphicStr);

		let rectStr = '???';
		if (graphic instanceof Sprite) {
			if (graphic.sourceW) {
				rectStr = `Size: ${graphic.sourceW}x${graphic.sourceH} | Offset: (${graphic.sourceX}, ${graphic.sourceY})`;
			} else {
				rectStr = `Size: ${graphic.width}x${graphic.height}`;
			}
		}
		drawText(drawX + padding, drawY + padding + 50, rectStr);

		if (graphic instanceof Sprite) {
			const x = drawX + w / 2;
			const y = drawY + padding + padding + 70;
			this.renderGraphicWithRect(ctx, graphic, x, y, {
				x: graphic.sourceX,
				y: graphic.sourceY,
				w: graphic.sourceW ?? graphic.width,
				h: graphic.sourceH ?? graphic.height,
			});
		} else if (graphic instanceof Tileset) {
			const x = drawX + w / 2;
			const y = drawY + padding + padding + 70;
			this.renderGraphicWithRect(ctx, graphic, x, y);
		}

		// TODO(bret): this is soooo dangerous, it gets set in renderGraphicWithRect!!
		if (this.graphic.sprite) {
			this.graphic.sprite.x = 0;
			this.graphic.sprite.y = 0;
			this.graphic.sprite.render(this.ctx, {
				x: -(drawX + w / 6),
				y: -(drawY + padding + padding + 70),
			} as Vec2);
		}

		drawText(
			drawX + padding,
			drawY + padding + 250,
			`Collider: ${entity.collider?.type ?? 'none'}`,
		);

		if (entity.collider) {
			const tag = entity.collider.tag;
			drawText(
				drawX + padding,
				drawY + padding + 270,
				`Tag: ${tag ? `"${tag}"` : '[none]'}`,
			);

			drawText(
				drawX + padding,
				drawY + padding + 290,
				JSON.stringify({
					x: entity.collider.x,
					y: entity.collider.y,
					w: 'width' in entity.collider ? entity.collider.width : 0,
					h: 'height' in entity.collider ? entity.collider.height : 0,
					points:
						'points' in entity.collider
							? entity.collider.points
							: null,
				}),
			);

			drawText(
				drawX + padding,
				drawY + padding + 310,
				JSON.stringify({
					left: 'left' in entity.collider ? entity.collider.left : 0,
					top: 'top' in entity.collider ? entity.collider.top : 0,
					right:
						'right' in entity.collider ? entity.collider.right : 0,
					bottom:
						'bottom' in entity.collider
							? entity.collider.bottom
							: 0,
				}),
			);
		}
	}

	renderSceneDebug(ctx: CanvasRenderingContext2D, scene: Scene): void {
		if (!this.enabled) return;

		const debugData = this.sceneData.get(scene);
		if (!debugData) throw new Error(`Missing scene data for scene`);

		const camera = new Camera(scene.camera.x, scene.camera.y);

		const canvasW = this.engine.canvas.width;
		const canvasH = this.engine.canvas.height;

		const drawRect = (
			x: number,
			y: number,
			width: number,
			height: number,
			type: 'fill' | 'stroke',
			color: string,
		): void => {
			const rect = { x, y, width, height };
			Draw.rect(
				ctx,
				{ type, color, ...rect },
				rect.x,
				rect.y,
				rect.width,
				rect.height,
			);
		};

		if (scene.bounds) {
			const bounds = [...scene.bounds] as typeof scene.bounds;
			bounds[0] -= camera.x;
			bounds[1] -= camera.y;
			drawRect(...bounds, 'stroke', 'yellow');

			if (camera.x < bounds[0]) {
				const w = -camera.x;
				drawRect(0, 0, w, canvasH, 'fill', '#ffff0022');
			}
			if (camera.y < bounds[1]) {
				const x1 = Math.max(0, bounds[0]);
				const x2 = Math.min(canvasW, bounds[0] + bounds[2]);
				const h = -camera.y;
				drawRect(x1, 0, x2 - x1, h, 'fill', '#ffff0022');
			}
			if (camera.x + canvasW >= bounds[2]) {
				const x = bounds[2] - camera.x;
				drawRect(x, 0, canvasW - x, canvasH, 'fill', '#ffff0022');
			}
			if (camera.y + canvasH >= bounds[3]) {
				const x1 = Math.max(0, bounds[0]);
				const x2 = Math.min(canvasW, bounds[0] + bounds[2]);
				const y = bounds[3] - camera.y;
				drawRect(x1, y, x2 - x1, canvasH - y, 'fill', '#ffff0022');
			}
		}

		const rect = {
			x: 0,
			y: 0,
			width: canvasW,
			height: canvasH,
		};
		Draw.rect(
			ctx,
			{ type: 'fill', color: '#20202055', ...rect },
			rect.x,
			rect.y,
			rect.width,
			rect.height,
		);

		scene.entities.inScene.forEach((e) => {
			e.renderCollider(ctx, camera);
		});

		// show origins
		scene.entities.inScene.forEach((e) => {
			const r = 3;
			Draw.circle(
				ctx,
				{ type: 'fill', color: 'lime' },
				e.x - r - camera.x,
				e.y - r - camera.y,
				r,
			);
		});

		debugData.selectedEntities.forEach((e, i) => {
			// render again why not
			// TODO(bret): Would be best to clear out behind entity and then select it

			e.render(ctx, scene.camera);

			this.renderEntityDebug(this.ctx, e, (entityRenderH + 6) * i);
		});
	}

	render(ctx: CanvasRenderingContext2D): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (!this.enabled) {
			// TODO(bret): Draw inactive?
			// TODO(bret): Can the panel update while the game is running?
			// so many questions!
			return;
		}

		this.engine.currentScenes?.forEach((scene) => {
			this.renderSceneDebug(ctx, scene);
		});
	}
}
