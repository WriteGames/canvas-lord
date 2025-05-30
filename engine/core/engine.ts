/* Canvas Lord v0.6.1 */

import { type AssetManager, Sfx } from './asset-manager.js';
import { Input, type Key } from './input.js';
import type { Scene } from './scene.js';
import type { Ctx } from '../util/canvas.js';
import { Debug } from '../util/debug.js';

import type { CSSColor, RequiredAndOmit } from '../util/types.js';
import { CL } from './CL.js';
import { Delegate } from '../util/delegate.js';

const defineUnwritableProperty: <T>(
	obj: T,
	prop: PropertyKey,
	value: number,
	attributes?: PropertyDescriptor & ThisType<unknown>,
) => T = (obj, prop, value, attributes = {}) =>
	Object.defineProperty(obj, prop, {
		...attributes,
		value,
		writable: false,
	});

// TODO(bret): Rethink this
interface CachedEventListener {
	element: Element | Window;
	arguments: Parameters<Element['addEventListener']>;
}

// TODO(bret): Add 'tabfocus' that ignores blur/focus events, and 'always' that ignores browser blur/focus
type UpdateSettings = 'always' | 'focus' | 'manual' | 'onEvent';
type UpdateOnEvent = Extract<keyof GlobalEventHandlersEventMap, 'mousemove'>;
type RenderSettings = 'manual' | 'onUpdate';

type GameLoopSettings =
	| {
			// everything except 'onEvent'
			updateMode: Exclude<UpdateSettings, 'onEvent'>;
			renderMode: RenderSettings;
	  }
	| {
			// only 'onEvent'
			updateMode: Extract<UpdateSettings, 'onEvent'>;
			updateOn: UpdateOnEvent[];
			renderMode: RenderSettings;
	  };

// TODO(bret): 'tabblur', 'tabfocus'
const gameEvents = ['blur', 'focus', 'update'] as const;

type GameEvent = (typeof gameEvents)[number];
type EventCallback = () => void;

export interface IEngine {
	listeners: Record<GameEvent, Set<EventCallback>>;
	focus: boolean;

	fps: number;
	frameIndex: number;
	recentFrames: number[];
	frameRate: number;

	gameLoopSettings: GameLoopSettings;
	sceneStack: Scene[][];
	backgroundColor: CSSColor;
	focusElement: HTMLElement;
	wrapper: HTMLElement;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	input: Input;
	frameRequestId: number;
	eventListeners: CachedEventListener[];
	assetManager?: AssetManager;
	debug?: Debug;

	// delegates
	onInit: Delegate<(game: Game) => void>;
	onUpdate: Delegate;
	onSceneBegin: Delegate<(scene: Scene) => void>;
	onSceneEnd: Delegate<(scene: Scene) => void>;

	// getters & setters
	readonly width: number;
	readonly halfWidth: number;
	readonly height: number;
	readonly halfHeight: number;
	readonly currentScenes: Scene[] | undefined;

	// methods
	load(assetManager: AssetManager): void;
	start(): void;
	updateGameLoopSettings(newGameLoopSettings: GameLoopSettings): void;
	addEventListener(
		element: Element | Window,
		...rest: CachedEventListener['arguments']
	): void;
	clearScenes(): void;
	pushScene(scene: Scene): void;
	pushScenes(...scenes: Scene[]): void;
	popScenes(): Scene[] | undefined;
	updateScenes(scenes?: Scene[]): void;
	update(): void;
	sendEvent(event: GameEvent): void;
	renderScenes(ctx: Ctx, scenes?: Scene[]): void;
	render(): void;

	registerHTMLButton(
		element: string | HTMLElement,
		...keys: Key[] | Key[][]
	): void;
	unregisterHTMLButton(
		element: string | HTMLElement,
		...keys: Key[] | Key[][]
	): void;
}

export type Engine = IEngine;

interface InitialSettings {
	fps: number;
	backgroundColor?: string; // TODO(bret): Fix type
	gameLoopSettings?: GameLoopSettings;
	assetManager?: AssetManager;
	// TODO(bret): Should we make this non-optional? Or at least do so for Write Games?
	devMode?: boolean;
}

type Settings = RequiredAndOmit<InitialSettings, 'assetManager'>;

const defaultSettings: Settings = {
	fps: 60,
	backgroundColor: '#202020',
	gameLoopSettings: {
		updateMode: 'focus',
		renderMode: 'onUpdate',
	},
	devMode: false, // TODO(bret): Set this to false someday probably
};

export class Game implements Engine {
	gameLoopSettings: GameLoopSettings = {
		updateMode: 'focus',
		renderMode: 'onUpdate',
	};

	listeners: Record<'focus' | 'blur' | 'update', Set<EventCallback>>;
	focus: boolean;

	fps: number;
	frameIndex: number;
	recentFrames: number[];
	frameRate: number;
	_lastUpdate = 0;

	sceneStack: Scene[][];
	backgroundColor: string | CanvasGradient | CanvasPattern;
	focusElement: HTMLElement;
	wrapper: HTMLElement;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	input: Input;
	_lastFrame!: number;
	mainLoop!: (time: number) => void;
	frameRequestId = -1;
	eventListeners: CachedEventListener[];
	assetManager?: AssetManager | undefined;
	debug?: Debug | undefined;

	onInit: Delegate<(game: Game) => void>;
	onUpdate: Delegate;
	onSceneBegin: Delegate<(scene: Scene) => void>;
	onSceneEnd: Delegate<(scene: Scene) => void>;
	// TODO(bret): other delgates from Otter2d

	constructor(id: string, settings?: InitialSettings) {
		const canvas = document.querySelector<HTMLCanvasElement>(
			`canvas#${id}`,
		);
		if (canvas === null) {
			throw new Error(`No canvas with id "${id}" was able to be found`);
		}

		this.onInit = new Delegate();
		this.onUpdate = new Delegate();
		this.onSceneBegin = new Delegate();
		this.onSceneEnd = new Delegate();

		canvas._engine = this;

		const ctx = canvas.getContext('2d', {
			alpha: false,
		});
		if (ctx === null) {
			throw new Error(
				`Context was not able to be created from canvas "#${id}"`,
			);
		}

		this.canvas = canvas;
		this.ctx = ctx;

		// apply defaults to game settings
		const engineSettings: Settings = {
			...defaultSettings,
			...settings,
		};

		engineSettings.gameLoopSettings = {
			...defaultSettings.gameLoopSettings,
			...settings?.gameLoopSettings,
		};

		// render a rectangle ASAP
		this.backgroundColor = engineSettings.backgroundColor;
		ctx.save();
		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();

		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('canvas-lord');

		this.wrapper.tabIndex = -1;
		this.canvas.removeAttribute('tabIndex');

		this.canvas.after(this.wrapper);
		this.wrapper.append(this.canvas);

		this.focus = false;

		this.listeners = gameEvents.reduce((acc, val) => {
			acc[val] = new Set<EventCallback>();
			return acc;
		}, {} as typeof this.listeners);

		this.fps = Math.round(engineSettings.fps);
		if (this.fps <= 0) throw new Error('Invalid FPS');
		const idealDuration = Math.round(1e3 / this.fps);
		this.recentFrames = Array.from(
			{ length: this.fps },
			() => idealDuration,
		);
		this.frameIndex = 0;
		this.frameRate = this.fps;

		this.assetManager = engineSettings.assetManager;

		// TODO(bret): Move this to init?
		if (engineSettings.devMode) this.debug = new Debug(this);

		this.sceneStack = [];

		// TODO(bret): Might also want to listen for styling changes to the canvas element
		const computeCanvasSize = (canvas: HTMLCanvasElement): void => {
			const canvasComputedStyle = getComputedStyle(canvas);

			let width = parseInt(canvasComputedStyle.width, 10);
			let height = parseInt(canvasComputedStyle.height, 10);

			const borderLeft = parseInt(
				canvasComputedStyle.borderLeftWidth,
				10,
			);
			const borderTop = parseInt(canvasComputedStyle.borderTopWidth, 10);

			const paddingLeft = parseInt(canvasComputedStyle.paddingLeft, 10);
			const paddingTop = parseInt(canvasComputedStyle.paddingTop, 10);

			const isBorderBox = canvasComputedStyle.boxSizing === 'border-box';
			if (isBorderBox) {
				width -= 2 * (borderLeft + paddingLeft);
				height -= 2 * (borderTop + paddingTop);
			}

			defineUnwritableProperty(canvas, '_actualWidth', width);
			defineUnwritableProperty(canvas, '_actualHeight', height);

			// TODO(bret): Fix this for different boxSizings
			const offsetX = borderLeft + paddingLeft;
			const offsetY = borderTop + paddingTop;

			defineUnwritableProperty(canvas, '_offsetX', offsetX);
			defineUnwritableProperty(canvas, '_offsetY', offsetY);

			defineUnwritableProperty(
				canvas,
				'_scaleX',
				canvas._actualWidth / canvas.width,
			);
			defineUnwritableProperty(
				canvas,
				'_scaleY',
				canvas._actualHeight / canvas.height,
			);
			defineUnwritableProperty(canvas, '_scale', canvas._scaleX);
		};

		computeCanvasSize(this.canvas);

		// TODO(bret): Add as option
		this.ctx.imageSmoothingEnabled = false;

		this.input = new Input(this);

		this.eventListeners = [];

		window.addEventListener('resize', () => {
			computeCanvasSize(this.canvas);
		});

		window.addEventListener('blur', () => this.onFocus(false));

		// TODO: should we allow folks to customize this to be directly on the canvas?
		this.focusElement = this.wrapper;
		this.focusElement.addEventListener('focusin', () => this.onFocus(true));
		this.focusElement.addEventListener('focusout', () =>
			this.onFocus(false),
		);
	}

	async load(assetManager: AssetManager): Promise<void> {
		return assetManager.loadAssets();
	}

	get width(): number {
		return this.canvas.width;
	}

	get halfWidth(): number {
		return this.canvas.width / 2;
	}

	get height(): number {
		return this.canvas.height;
	}

	get halfHeight(): number {
		return this.canvas.height / 2;
	}

	get currentScenes(): Scene[] | undefined {
		return this.sceneStack.at(-1);
	}

	_onGameLoopSettingsUpdate?: EventCallback | undefined;
	// TODO(bret): We're going to need to make a less clunky interface
	updateGameLoopSettings(newGameLoopSettings: GameLoopSettings): void {
		this._onGameLoopSettingsUpdate?.();

		this.gameLoopSettings = newGameLoopSettings;

		const update = this.update.bind(this);
		const render = this.render.bind(this);
		const startMainLoop = this.startMainLoop.bind(this);
		const killMainLoop = this.killMainLoop.bind(this);

		// Add new callbacks
		switch (this.gameLoopSettings.updateMode) {
			case 'always':
				startMainLoop();
				break;

			case 'focus':
				this.listeners.focus.add(startMainLoop);
				this.listeners.blur.add(killMainLoop);
				break;

			case 'manual':
				break;

			case 'onEvent':
				this.gameLoopSettings.updateOn.forEach((event) => {
					this.canvas.addEventListener(event, update);
				});
				break;
		}

		if (this.gameLoopSettings.renderMode === 'onUpdate') {
			this.listeners.update.add(render);
		}

		this._onGameLoopSettingsUpdate = (): void => {
			// Remove existing callbacks
			switch (this.gameLoopSettings.updateMode) {
				case 'always':
					killMainLoop();
					break;

				case 'focus':
					this.listeners.focus.delete(startMainLoop);
					this.listeners.blur.delete(killMainLoop);
					break;

				case 'manual':
					break;

				case 'onEvent':
					this.gameLoopSettings.updateOn.forEach((event) => {
						this.canvas.removeEventListener(event, update);
					});
					break;
			}

			if (this.gameLoopSettings.renderMode === 'onUpdate') {
				this.listeners.update.delete(render);
			}
		};
	}

	addEventListener(
		element: Element | Window,
		...rest: CachedEventListener['arguments']
	): void {
		const eventListener: CachedEventListener = {
			element,
			arguments: rest,
		};

		element.addEventListener(...eventListener.arguments);

		this.eventListeners.push(eventListener);
	}

	#init(): void {
		this.onInit.invoke(this);
	}

	start(): void {
		this.#init();

		this._lastFrame = 0; // TODO: rename this - this is actually since last mainLoop() call
		let deltaTime = 0;
		const maxFrames = 5;
		let recentFramesSum = this.recentFrames.reduce((a, v) => a + v, 0);
		this.mainLoop = (time): void => {
			const timeStep = 1e3 / this.fps;

			this.frameRequestId = requestAnimationFrame(this.mainLoop);

			const timeSinceLastFrame = time - this._lastFrame;
			deltaTime += timeSinceLastFrame;
			this._lastFrame = time;

			deltaTime = Math.min(deltaTime, timeStep * maxFrames + 0.01);

			const prevFrameIndex = this.frameIndex;
			// should we send a pre-/post- message in case there are
			// multiple updates that happen in a single while?
			CL.useEngine(this, () => {
				while (deltaTime >= timeStep) {
					this.update();
					this.input.update();
					this.onUpdate.invoke();
					deltaTime -= timeStep;
					++this.frameIndex;
				}
			});

			if (prevFrameIndex !== this.frameIndex) {
				const finishedAt = performance.now();
				const { duration } = performance.measure('frame', {
					start: this._lastUpdate,
				});
				recentFramesSum += duration;
				this.recentFrames.push(duration);
				recentFramesSum -= this.recentFrames.shift() ?? 0;
				this.frameRate = Math.round(
					1e3 / (recentFramesSum / this.recentFrames.length),
				);
				this._lastUpdate = finishedAt;
			}
		};

		this.updateGameLoopSettings(this.gameLoopSettings);

		// TODO(bret): We should probably change this to some sort of loading state (maybe in CSS?)
		CL.useEngine(this, () => {
			this.updateScenes();
			this.update();
			this.input.update();
			// NOTE(bret): Hack for Sprite.createRect
			window.requestAnimationFrame(() => {
				this.render();
			});
		});
	}

	startMainLoop(): void {
		this._lastFrame = performance.now();
		this._lastUpdate = performance.now();
		this.frameRequestId = requestAnimationFrame(this.mainLoop);

		// TODO(bret): Do binding
		const onMouseDown: EventListener = (e) =>
			this.input.onMouseDown(e as MouseEvent);
		const onMouseUp: EventListener = (e) =>
			this.input.onMouseUp(e as MouseEvent);
		const onMouseMove: EventListener = (e) =>
			this.input.onMouseMove(e as MouseEvent);
		const onKeyDown: EventListener = (e) =>
			this.input.onKeyDown(e as KeyboardEvent);
		const onKeyUp: EventListener = (e) =>
			this.input.onKeyUp(e as KeyboardEvent);

		this.addEventListener(this.canvas, 'mousedown', onMouseDown);
		this.addEventListener(window, 'mouseup', onMouseUp);

		// TODO(bret): Find out if we need useCapture here & above
		// TODO(bret): Check other HTML5 game engines to see if they attach mouse events to the canvas or the window
		[
			['mousedown', this.canvas] as const,
			['mouseup', this.canvas] as const,
			['mouseenter', this.canvas] as const,
			['mousemove', window] as const,
			['mouseexit', this.canvas] as const,
		].forEach(([event, element]) => {
			this.addEventListener(element, event, onMouseMove);
		});

		this.addEventListener(this.focusElement, 'keydown', onKeyDown, false);
		this.addEventListener(this.focusElement, 'keyup', onKeyUp, false);
	}

	clearScenes(): void {
		CL.useEngine(this, () => {
			while (this.currentScenes) this.popScenes();
		});
	}

	killMainLoop(): void {
		cancelAnimationFrame(this.frameRequestId);
		this.input.clear();

		this.eventListeners.forEach((eventListener) => {
			const { element } = eventListener;
			element.removeEventListener(...eventListener.arguments);
		});
		this.eventListeners = [];
	}

	// TODO(bret): Also perhaps do this on page/browser focus lost?
	onFocus(focus: boolean): void {
		if (this.focus === focus) return;
		if (this.focus) {
			void Sfx.audioCtx.suspend();
		} else {
			void Sfx.audioCtx.resume();
		}
		this.focus = focus;
		this.sendEvent(focus ? 'focus' : 'blur');
		this._lastFrame = performance.now();
		this._lastUpdate = performance.now();
	}

	_forEachScene<T extends Scene>(
		scenes: T[] | undefined,
		callbackfn: (value: T, index: number, array: T[]) => void,
		thisArg?: unknown,
	): void {
		scenes?.forEach((scene, ...args) => {
			CL.useScene(scene, () => {
				callbackfn(scene, ...args);
			});
		}, thisArg);
	}

	pushScene(scene: Scene): void {
		this.pushScenes(scene);
	}

	pushScenes(...scenes: Scene[]): void {
		this._forEachScene(scenes, (scene) => {
			scene.pauseInternal();
		});

		this.sceneStack.push(scenes);

		this._forEachScene(scenes, (scene) => {
			CL.useScene(scene, () => {
				scene.initInternal(this);
				scene.updateLists();
			});
		});
	}

	popScenes(): Scene[] | undefined {
		this._forEachScene(this.currentScenes, (scene) => {
			// TODO(bret): Should we delete scene.engine?
			scene.endInternal();
		});

		const scenes = this.sceneStack.pop();

		this._forEachScene(this.currentScenes, (scene) => {
			scene.updateLists();
			scene.resumeInternal();
		});

		return scenes;
	}

	lastScene?: Scene[];
	updateScenes(scenes?: Scene[]): void {
		if (!scenes) return;
		if (this.lastScene !== scenes) {
			this._forEachScene(scenes, (scene) => {
				scene.beginInternal();
			});
			this.lastScene = scenes;
		}
		this._forEachScene(scenes, (scene) => {
			scene.updateLists();
		});
		this._forEachScene(scenes, (scene) => {
			scene.preUpdateInternal(this.input);
		});
		this._forEachScene(scenes, (scene) => {
			scene.updateInternal(this.input);
		});
		this._forEachScene(scenes, (scene) => {
			scene.postUpdateInternal(this.input);
		});
	}

	update(): void {
		const { debug } = this;

		// reload assets
		if (this.input.keyPressed('F2')) {
			this.assetManager?.reloadAssets();
		}

		debug?.update(this.input);
		if (!debug?.enabled) {
			this.updateScenes(this.currentScenes);
		}

		this.sendEvent('update');
	}

	sendEvent(event: GameEvent): void {
		// TODO: drawOverlay should take in ctx or game
		this.listeners[event].forEach((c) => c());
	}

	renderScenes(ctx: Ctx, scenes?: Scene[]): void {
		if (!scenes) return;

		// TODO(bret): Set this up so scenes can toggle whether or not they're transparent!
		this.sceneStack.forEach((scenes) => {
			this._forEachScene(scenes, (scene) => {
				scene.renderInternal(ctx);
			});
		});

		// Splitscreen
		if (this.sceneStack[0]?.length === 2) {
			ctx.strokeStyle = '#202020';
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(this.width / 2, 0.5);
			ctx.lineTo(this.width / 2, 360.5);
			ctx.stroke();
		}
	}

	render(): void {
		CL.useEngine(this, () => {
			const { ctx } = this;

			ctx.fillStyle = this.backgroundColor;
			ctx.fillRect(0, 0, this.width, this.height);

			const { debug } = this;
			this.renderScenes(ctx, []);
			if (debug?.enabled) debug.render(ctx);
		});
	}

	registerHTMLButton(
		element: string | HTMLElement,
		...keys: Key[] | Key[][]
	): void {
		this.input.registerHTMLButton(element, ...keys);
	}

	unregisterHTMLButton(
		element: string | HTMLElement,
		...keys: Key[] | Key[][]
	): void {
		this.input.unregisterHTMLButton(element, ...keys);
	}
}
