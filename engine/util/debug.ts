import type { Engine } from '../core/engine.js';
import type { Input } from '../core/input.js';
import type { Scene } from '../core/scene.js';
import { Vec2 } from '../math/index.js';
import { Camera } from './camera.js';
import { Draw } from './draw.js';

interface DebugSceneData {
	scene: Scene;
	originalCamera: Camera;

	dragStart: Vec2;
	camera: Vec2;
	cameraDelta: Vec2;
}

export interface Debug {
	engine: Engine;
	// TODO(bret): Gonna need to support multiple parallel scenes! :S
	sceneData: Map<Scene, DebugSceneData>;
}

export class Debug implements Debug {
	#enabled = false;

	get enabled() {
		return this.#enabled;
	}

	constructor(engine: Engine) {
		this.engine = engine;

		this.sceneData = new Map();
	}

	toggle() {
		this.enabled ? this.close() : this.open();
	}

	open() {
		this.#enabled = true;
	}

	close() {
		this.#enabled = false;

		[...this.sceneData.entries()].forEach(([scene, data]) => {
			scene.camera = data.originalCamera;
		});
		this.sceneData.clear();
	}

	update(input: Input) {
		this.engine.currentScenes?.forEach((scene) => {
			let sceneData = this.sceneData.get(scene);
			if (!sceneData) {
				sceneData = {
					scene,
					originalCamera: scene.camera,
					camera: new Vec2(),
					cameraDelta: new Vec2(),
					dragStart: new Vec2(),
				};
				this.sceneData.set(scene, sceneData);
				scene.camera = scene.camera.clone();
			}

			const { originalCamera, dragStart, camera, cameraDelta } =
				sceneData;

			// TODO(bret): Multi-scene support for this!
			// aka if (mouseInScene) { ... }
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

			scene.camera.set(originalCamera.add(camera).add(cameraDelta));
		});
	}

	renderDebug(ctx: CanvasRenderingContext2D, scene: Scene): void {
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
		) => {
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
				{ type: 'fill', color: 'lime', radius: r },
				e.x - r - camera.x,
				e.y - r - camera.y,
				r,
			);
		});
	}

	render(ctx: CanvasRenderingContext2D) {
		this.engine.renderScenes(ctx, this.engine.currentScenes);
		this.engine.currentScenes?.forEach((scene) => {
			this.renderDebug(ctx, scene);
		});
	}
}
