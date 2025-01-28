/* Canvas Lord v0.4.4 */
/* eslint-disable @typescript-eslint/no-unused-vars -- until exports are set up, many of these items are not being used */

import {
	V4,
	type Vector,
	addPos,
	subPos,
	scalePos,
	posToIndex,
	indexToPos,
	hashPos,
	posEqual,
	Vec2,
	EPSILON,
	crossProduct2D,
	Line2D,
} from './util/math.js';

import { CSSColor } from './util/types.js';

import { type Scene } from './util/scene.js';
import { type Camera } from './util/camera.js';
import { type Entity } from './util/entity.js';
import { Grid } from './util/grid.js';

export { Draw } from './util/draw.js';

// TODO: only export these from math.js
export {
	V2,
	type Vector,
	addPos,
	subPos,
	scalePos,
	EPSILON,
} from './util/math.js';
export { Scene } from './util/scene.js';
export { Camera } from './util/camera.js';
export * as Collision from './util/collision.js';
export {
	checkLineSegmentIntersection,
	getLineSegmentIntersection,
} from './util/collision.js';
export { Entity } from './util/entity.js';
export { Grid } from './util/grid.js';

declare global {
	interface HTMLCanvasElement {
		_engine: Engine;
		_actualWidth: number;
		_actualHeight: number;
		_offsetX: number;
		_offsetY: number;
		_scaleX: number;
		_scaleY: number;
	}

	interface Math {
		clamp: (val: number, min: number, max: number) => number;
		lerp: (a: number, b: number, t: number) => number;
	}
}

type Writeable<T> = {
	-readonly [P in keyof T]: T[P];
};

type FuncReduceVector = <A extends Vector, B extends Vector>(
	a: Vec2,
	b: Vec2,
) => number;

type FuncReduceNumber = (acc: number, v: number) => number;

type VectorToObjectVectorHybrid<A extends readonly PropertyKey[]> = Pick<
	{
		[TIndex in A[number] | keyof A]: number;
	},
	Exclude<keyof A, keyof unknown[]> | A[number]
>;

const reduceSum: FuncReduceNumber = (acc, v) => acc + v;
const reduceProduct: FuncReduceNumber = (acc, v) => acc * v;

const distance = (dimensions: Vec2): number =>
	Math.abs(Math.sqrt(dimensions.map((d) => d * d).reduce(reduceSum, 0)));
const distanceSq = (dimensions: Vec2): number =>
	Math.abs(dimensions.map((d) => d * d).reduce(reduceSum, 0));

const isDefined = <T>(v: T | undefined): v is T => Boolean(v);

const interlaceArrays = <T, U>(
	a: Readonly<T[]>,
	b: Readonly<U[]>,
): Array<T | U> => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);

export const mapByOffset = <V extends Vector>(
	offset: Vec2,
): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => addPos(offset, pos);
};
export const mapFindOffset = <V extends Vector>(
	origin: Vec2,
): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => subPos(pos, origin);
};
export const flatMapByOffsets = <V extends Vector>(
	offsets: Vec2[],
): ((pos: Vec2) => Vec2[]) => {
	return (pos: Vec2): Vec2[] => offsets.map((offset) => addPos(offset, pos));
};
export const posDistance: FuncReduceVector = (a, b) => distance(subPos(b, a));
export const posDistanceSq: FuncReduceVector = (a, b) =>
	distanceSq(subPos(b, a));

// const pathToSegments = (path) =>
// 	path.map((vertex, i, vertices) => [
// 		vertex,
// 		vertices[(i + 1) % vertices.length],
// 	]);

const RAD_TO_DEG = 180.0 / Math.PI;
const radToDeg = (rad: number): number => rad * RAD_TO_DEG;
const DEG_TO_RAD = Math.PI / 180.0;
const degToRad = (deg: number): number => deg * DEG_TO_RAD;

const RAD_45 = 45 * DEG_TO_RAD;
const RAD_90 = 90 * DEG_TO_RAD;
const RAD_180 = 180 * DEG_TO_RAD;
const RAD_270 = 270 * DEG_TO_RAD;
const RAD_360 = 360 * DEG_TO_RAD;
const RAD_540 = 540 * DEG_TO_RAD;
const RAD_720 = 720 * DEG_TO_RAD;

// const getAngle = (a, b) => Math.atan2(...subPos(b, a)) * 180 / Math.PI;
const getAngle: FuncReduceVector = (a, b) =>
	Math.atan2(b[1] - a[1], b[0] - a[0]);
const getAngleBetween: FuncReduceNumber = (a, b) =>
	((b - a + RAD_540) % RAD_360) - RAD_180;

export const isPointOnLine = <V extends Vector>(
	point: Vec2,
	a: Vec2,
	b: Vec2,
): boolean =>
	Math.abs(
		posDistance(a, point) + posDistance(point, b) - posDistance(a, b),
	) < EPSILON;

// TODO(bret): Would be fun to make this work with any dimensions
export const isWithinBounds = (
	[x, y]: Vec2,
	[x1, y1]: Vec2,
	[x2, y2]: Vec2,
): boolean => x >= x1 && y >= y1 && x < x2 && y < y2;

export const filterWithinBounds =
	<V extends Vector>(a: Vec2, b: Vec2): ((pos: Vec2) => boolean) =>
	(pos: Vec2): boolean =>
		a.every((p, i) => ([...pos][i] ?? -Infinity) >= p) &&
		b.every((p, i) => ([...pos][i] ?? Infinity) < p);

type Path = Vec2[];

export const isPointInsidePath = (point: Vec2, path: Path): boolean => {
	const wind = path
		.map((vertex) => getAngle(point, vertex))
		.map((angle, i, arr) =>
			getAngleBetween(angle, arr[(i + 1) % arr.length] as number),
		)
		.reduce(reduceSum, 0);
	return Math.abs(wind) > EPSILON;
};

const createBitEnum = <T extends readonly string[]>(
	..._names: T
): VectorToObjectVectorHybrid<T> => {
	const names = _names.flat();
	const bitEnumObj = {} as VectorToObjectVectorHybrid<T>;
	names.forEach((name, i) => {
		const val = 1 << i;
		bitEnumObj[i as keyof typeof bitEnumObj] = val;
		bitEnumObj[name.toUpperCase() as keyof typeof bitEnumObj] = val;
	});
	return bitEnumObj;
};

export const dirNN = 0;
export const [dirRN, dirNU, dirLN, dirND] = Object.freeze(
	Array.from({ length: 4 }).map((_, i) => 1 << i),
) as V4;
// prettier-ignore
export const [
	dirLU, dirRU,
	dirLD, dirRD,
] = [
	dirLN | dirNU, dirRN | dirNU,
	dirLN | dirND, dirRN | dirND,
];

let nnn;
{
	// prettier-ignore
	const [
		normLU, normNU, normRU,
		normLN, normNN, normRN,
		normLD, normND, normRD,
	] = [
		new Vec2(-1, -1),
		new Vec2(0, -1),
		new Vec2(1, -1),

		new Vec2(-1, 0),
		new Vec2(0, 0),
		new Vec2(1, 0),

		new Vec2(-1, 1),
		new Vec2(0, 1),
		new Vec2(1, 1),
	];

	// prettier-ignore
	nnn = {
		LU: normLU, NU: normNU, RU: normRU,
		LN: normLN, NN: normNN, RN: normRN,
		LD: normLD, ND: normND, RD: normRD,
	}
}

export const norm = nnn;

const orthogonalNorms = [norm.RN, norm.NU, norm.LN, norm.ND] as const;
const diagonalNorms = [norm.RU, norm.LU, norm.LD, norm.RD] as const;
export const cardinalNorms = interlaceArrays(orthogonalNorms, diagonalNorms);

// TODO: also allow for non-readonly versions :)
type V2OrthogonalNorm = (typeof orthogonalNorms)[number];
type V2DiagonalNorm = (typeof diagonalNorms)[number];
type V2CardinalNorm = V2OrthogonalNorm | V2DiagonalNorm;

// Starts right, goes counter-clockwise
export const reduceBitFlags = (acc: number, val: number): number => acc | val;
const cardinalNormStrs = [
	'RN',
	'RU',
	'NU',
	'LU',
	'LN',
	'LD',
	'ND',
	'RD',
] as const;
type CardinalNormStr = (typeof cardinalNormStrs)[number];
const CARDINAL_NORM = createBitEnum(...cardinalNormStrs);
const mapStrToCardinalDirBitFlag = (str: CardinalNormStr): number =>
	CARDINAL_NORM[str];

class V2Map<K extends Vec2, V> {
	#map = new Map<string, V>();

	constructor() {
		this.#map = new Map();
	}
	delete(key: K): boolean {
		return this.#map.delete(hashPos(key));
	}
	get(key: K): V | undefined {
		return this.#map.get(hashPos(key));
	}
	has(key: K): boolean {
		return this.#map.has(hashPos(key));
	}
	set(key: K, value: V): this {
		this.#map.set(hashPos(key), value);
		return this;
	}
}

export const normToBitFlagMap = new V2Map<V2CardinalNorm, number>();
[
	[norm.RN, CARDINAL_NORM.RN] as const, // 1
	[norm.RU, CARDINAL_NORM.RU] as const, // 2
	[norm.NU, CARDINAL_NORM.NU] as const, // 4
	[norm.LU, CARDINAL_NORM.LU] as const, // 8
	[norm.LN, CARDINAL_NORM.LN] as const, // 16
	[norm.LD, CARDINAL_NORM.LD] as const, // 32
	[norm.ND, CARDINAL_NORM.ND] as const, // 64
	[norm.RD, CARDINAL_NORM.RD] as const, // 128
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(dir, bitFlag));

const orTogetherCardinalDirs = (...dirs: CardinalNormStr[]): number =>
	dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);

export const globalSetTile = (
	tileset: Tileset,
	x: number,
	y: number,
	bitFlag: number,
): void => {
	switch (bitFlag & ~orTogetherCardinalDirs('LD', 'RD', 'LU', 'RU')) {
		case 0:
			tileset.setTile(x, y, 0, 5);
			break;

		case orTogetherCardinalDirs('NU'):
			tileset.setTile(x, y, 0, 7);
			break;

		case orTogetherCardinalDirs('ND'):
			tileset.setTile(x, y, 0, 6);
			break;

		case orTogetherCardinalDirs('LN'):
			tileset.setTile(x, y, 3, 4);
			break;

		case orTogetherCardinalDirs('RN'):
			tileset.setTile(x, y, 1, 4);
			break;

		case orTogetherCardinalDirs('LN', 'RN'):
			tileset.setTile(x, y, 0, 2);
			break;

		case orTogetherCardinalDirs('ND', 'NU'):
			tileset.setTile(x, y, 0, 3);
			break;

		case orTogetherCardinalDirs('RN', 'NU', 'ND'):
			tileset.setTile(x, y, 1, 6);
			break;

		case orTogetherCardinalDirs('NU', 'LN', 'ND'):
			tileset.setTile(x, y, 3, 6);
			break;

		case orTogetherCardinalDirs('RN', 'NU', 'LN', 'ND'):
			tileset.setTile(x, y, 2, 6);
			break;

		case orTogetherCardinalDirs('LN', 'ND'):
			tileset.setTile(x, y, 2, 5);
			break;

		case orTogetherCardinalDirs('LN', 'NU'):
			tileset.setTile(x, y, 3, 7);
			break;

		case orTogetherCardinalDirs('RN', 'ND'):
			tileset.setTile(x, y, 2, 3);
			break;

		case orTogetherCardinalDirs('LN', 'RN', 'ND'):
			tileset.setTile(x, y, 2, 2);
			break;

		case orTogetherCardinalDirs('RN', 'NU'):
			tileset.setTile(x, y, 1, 7);
			break;

		case orTogetherCardinalDirs('RN', 'NU', 'LN'):
			tileset.setTile(x, y, 2, 7);
			break;

		case orTogetherCardinalDirs('NU', 'LN'):
			tileset.setTile(x, y, 3, 7);
			break;
	}
};

type AssetManagerOnLoadCallback = (src: string) => void;

export type Sprite = {
	fileName: string;
} & (
	| {
			image: null;
			loaded: false;
	  }
	| {
			image: HTMLImageElement;
			width: number;
			height: number;
			loaded: true;
	  }
);

export type Audio = {
	fileName: string;
} & (
	| {
			buffer: null;
			loaded: false;
	  }
	| {
			buffer: AudioBuffer;
			duration: number;
			loaded: true;
	  }
);

export class Sfx {
	static audioCtx = new AudioContext();

	static music = new Map<Audio, AudioBufferSourceNode>();

	static play(audio: Audio) {
		const source = Sfx.audioCtx.createBufferSource();
		source.buffer = audio.buffer;
		source.connect(Sfx.audioCtx.destination);
		source.start();
	}

	static loop(audio: Audio) {
		// TODO(bret): Make sure we're not looping twice!
		const source = Sfx.audioCtx.createBufferSource();
		source.buffer = audio.buffer;
		source.connect(Sfx.audioCtx.destination);
		source.loop = true;
		source.start();
		this.music.set(audio, source);
	}

	// TODO(bret): Gonna need this to work for all audio, not just for music
	static stop(audio: Audio) {
		const source = this.music.get(audio);
		if (source) {
			source.stop();
			this.music.delete(audio);
		}
	}
}

export interface AssetManager {
	sprites: Map<string, Sprite>;
	audio: Map<string, Audio>;
	spritesLoaded: number;
	audioFilesLoaded: number;
	onLoadCallbacks: AssetManagerOnLoadCallback[];
	prefix: string;
}

export class AssetManager {
	constructor(prefix = '') {
		this.sprites = new Map();
		this.audio = new Map();
		this.spritesLoaded = 0;
		this.audioFilesLoaded = 0;
		this.onLoadCallbacks = [];
		this.prefix = prefix;
	}

	get progress(): number {
		const assets = [...this.sprites.keys(), ...this.audio.keys()];
		return (this.spritesLoaded + this.audioFilesLoaded) / assets.length;
	}

	addImage(src: string): void {
		this.sprites.set(src, { fileName: src, image: null, loaded: false });
	}

	addAudio(src: string): void {
		this.audio.set(src, {
			fileName: src,
			buffer: null,
			loaded: false,
		});
	}

	async loadAudio(src: string) {
		const fullPath = `${this.prefix}${src}`;

		await fetch(fullPath)
			.then((res) => res.arrayBuffer())
			.then((arrayBuffer) => Sfx.audioCtx.decodeAudioData(arrayBuffer))
			.then((audioBuffer) => {
				const audio = this.audio.get(src);
				if (!audio) {
					throw new Error(
						`Loaded audio that doesn't exist in map ("${src}" / "${fullPath}")`,
					);
				}
				audio.loaded = true;
				if ((audio.buffer = audioBuffer)) {
					audio.duration = audioBuffer.duration;
				}
				this.audioLoaded(src);
			});
	}

	loadImage(src: string): void {
		const image = new Image();
		const fullPath = `${this.prefix}${src}`;
		if (
			fullPath.startsWith('http') &&
			!fullPath.startsWith(location.origin)
		) {
			image.crossOrigin = 'Anonymous';
		}
		image.onload = (): void => {
			const sprite = this.sprites.get(src);
			if (!sprite) {
				throw new Error(
					`Loaded image that doesn't exist in map ("${src}" / "${fullPath}")`,
				);
			}
			sprite.loaded = true;
			if ((sprite.image = image)) {
				sprite.width = image.width;
				sprite.height = image.height;
			}
			this.imageLoaded(src);
		};
		image.src = fullPath;
	}

	async loadAssets() {
		const sprites = [...this.sprites.keys()];
		const audio = [...this.audio.keys()];
		const assets = [...sprites, ...audio];
		if (assets.length === 0) this.emitOnLoad('');
		sprites.forEach((src) => {
			this.loadImage(src);
		});
		// audio.forEach((src) => this.loadAudio(src));
		await Promise.all(audio.map(async (src) => this.loadAudio(src)));
	}

	emitOnLoad(src: string) {
		window.requestAnimationFrame(() => {
			this.onLoadCallbacks.forEach((callback) => callback(src));
		});
	}

	reloadAssets(): void {
		this.spritesLoaded = 0;
		this.audioFilesLoaded = 0;
		const sprites = [...this.sprites.keys()];
		if (sprites.length === 0) this.emitOnLoad('');
		sprites.forEach((src) => {
			this.loadImage(src);
		});
	}

	_checkAllAssetsLoaded() {
		if (
			this.spritesLoaded === this.sprites.size &&
			this.audioFilesLoaded === this.audio.size
		) {
			this.emitOnLoad('');
		}
	}

	imageLoaded(src: string): void {
		++this.spritesLoaded;
		this._checkAllAssetsLoaded();
	}

	audioLoaded(src: string): void {
		++this.audioFilesLoaded;
		this._checkAllAssetsLoaded();
	}

	onLoad(callback: AssetManagerOnLoadCallback): void {
		this.onLoadCallbacks.push(callback);
	}
}

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

export interface Game {
	listeners: Record<GameEvent, Set<EventCallback>>;
	focus: boolean;

	fps: number;
	frameIndex: number;
	recentFrames: number[];
	frameRate: number;
	_lastUpdate: number;

	gameLoopSettings: GameLoopSettings;
	sceneStack: Scene[][];
	backgroundColor: CSSColor;
	focusElement: HTMLElement;
	wrapper: HTMLElement;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	input: Input;
	_lastFrame: number;
	mainLoop: (time: number) => void;
	frameRequestId: number;
	eventListeners: CachedEventListener[];
	_onGameLoopSettingsUpdate?: EventCallback;
	assetManager?: AssetManager;
	debug: boolean;
}

export type Engine = Game;

interface InitialSettings {
	fps: number;
	backgroundColor?: string; // TODO(bret): Fix type
	gameLoopSettings?: GameLoopSettings;
	assetManager?: AssetManager;
}

export class Game {
	gameLoopSettings: GameLoopSettings = {
		updateMode: 'focus',
		renderMode: 'onUpdate',
	};
	debug = false;

	constructor(id: string, settings?: InitialSettings) {
		const canvas = document.querySelector<HTMLCanvasElement>(
			`canvas#${id}`,
		);
		if (canvas === null) {
			console.error(`No canvas with id "${id}" was able to be found`);
			return;
		}

		canvas._engine = this;

		const ctx = canvas.getContext('2d', {
			alpha: false,
		});
		if (ctx === null) {
			console.error(
				`Context was not able to be created from canvas "#${id}"`,
			);
			return;
		}

		this.canvas = canvas;
		this.ctx = ctx;

		// render a rectangle ASAP
		this.backgroundColor = settings?.backgroundColor ?? '#202020';
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

		this.fps = settings?.fps ?? 60;
		const idealDuration = Math.round(1e3 / this.fps);
		this.recentFrames = Array.from(
			{ length: this.fps },
			() => idealDuration,
		);
		this.frameIndex = 0;
		this.frameRate = this.fps;

		if (settings?.gameLoopSettings)
			this.gameLoopSettings = settings.gameLoopSettings;
		this.assetManager = settings?.assetManager;

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

		this.ctx.imageSmoothingEnabled = false;

		// TODO(bret): We should probably change this to some sort of loading state (maybe in CSS?)
		this.render();

		this.input = new Input(this);

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
			while (deltaTime >= timeStep) {
				this.update();
				this.input.update();
				deltaTime -= timeStep;
				++this.frameIndex;
			}

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

		this.eventListeners = [];

		window.addEventListener('resize', (e) => {
			computeCanvasSize(this.canvas);
		});

		window.addEventListener('blur', (e) => this.onFocus(false));

		// TODO: should we allow folks to customize this to be directly on the canvas?
		this.focusElement = this.wrapper;
		this.focusElement.addEventListener('focusin', (e) =>
			this.onFocus(true),
		);
		this.focusElement.addEventListener('focusout', (e) =>
			this.onFocus(false),
		);

		this.updateGameLoopSettings(this.gameLoopSettings);
	}

	load(assetManager: AssetManager) {
		assetManager.loadAssets();
	}

	get width(): number {
		return this.canvas.width;
	}

	get height(): number {
		return this.canvas.height;
	}

	get currentScenes(): Scene[] | undefined {
		return this.sceneStack.at(-1);
	}

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
			Sfx.audioCtx.suspend();
		} else {
			Sfx.audioCtx.resume();
		}
		this.focus = focus;
		this.sendEvent(focus ? 'focus' : 'blur');
		this._lastFrame = performance.now();
		this._lastUpdate = performance.now();
	}

	pushScene(scene: Scene): void {
		this.pushScenes(scene);
	}

	pushScenes(...scenes: Scene[]): void {
		this.currentScenes?.forEach((scene) => {
			scene.pause();
		});

		this.sceneStack.push(scenes);

		scenes.forEach((scene) => {
			scene.engine = this;
			scene.updateLists();
			scene.begin();
		});
	}

	popScenes(): Scene[] | undefined {
		this.currentScenes?.forEach((scene) => {
			// TODO(bret): Should we delete scene.engine?
			scene.end();
		});

		const scenes = this.sceneStack.pop();

		this.currentScenes?.forEach((scene) => {
			scene.updateLists();
			scene.resume();
		});

		return scenes;
	}

	update(): void {
		if (this.input.keyPressed('`')) {
			this.debug = !this.debug;
		}

		const { currentScenes: scenes } = this;
		if (scenes) {
			scenes.forEach((scene) => scene.updateLists());
			scenes.forEach((scene) => scene.preUpdate(this.input));
			scenes.forEach((scene) => scene.update(this.input));
			scenes.forEach((scene) => scene.postUpdate(this.input));
		}

		// reload assets
		if (this.input.keyPressed('F2')) {
			this.assetManager?.reloadAssets();
		}

		this.sendEvent('update');
	}

	sendEvent(event: GameEvent): void {
		// TODO: drawOverlay should take in ctx or game
		this.listeners[event].forEach((c) => c());
	}

	render(): void {
		const { ctx } = this;

		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, this.width, this.height);

		// TODO(bret): Set this up so scenes can toggle whether or not they're transparent!
		this.sceneStack.forEach((scenes) => {
			scenes.forEach((scene) => scene.render(ctx));
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
}

type InputStatus = 0 | 1 | 2 | 3;

interface Mouse {
	pos: Vec2;
	x: Vec2[0];
	y: Vec2[1];
	realPos: Vec2;
	realX: Vec2[0];
	realY: Vec2[1];
	_clicked: [InputStatus, InputStatus, InputStatus, InputStatus, InputStatus];
}

// TODO(bret): Will need to allow for evt.key & evt.which
const _keys = [
	'Unidentified',
	'Alt',
	'AltGraph',
	'CapsLock',
	'Control',
	'Fn',
	'FnLock',
	'Hyper',
	'Meta',
	'NumLock',
	'ScrollLock',
	'Shift',
	'Super',
	'Symbol',
	'SymbolLock',
	'Enter',
	'Tab',
	' ',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowUp',
	'End',
	'Home',
	'PageDown',
	'PageUp',
	'Backspace',
	'Clear',
	'Copy',
	'CrSel',
	'Cut',
	'Delete',
	'EraseEof',
	'ExSel',
	'Insert',
	'Paste',
	'Redo',
	'Undo',
	'Accept',
	'Again',
	'Attn',
	'Cancel',
	'ContextMenu',
	'Escape',
	'Execute',
	'Find',
	'Finish',
	'Help',
	'Pause',
	'Play',
	'Props',
	'Select',
	'ZoomIn',
	'ZoomOut',
	'F1',
	'F2',
	'F3',
	'F4',
	'F5',
	'F6',
	'F7',
	'F8',
	'F9',
	'F10',
	'F11',
	'F12',
	' ',
	'!',
	'"',
	'#',
	'$',
	'%',
	'&',
	"'",
	'(',
	')',
	'*',
	'+',
	',',
	'-',
	'.',
	'/',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	':',
	';',
	'<',
	'=',
	'>',
	'?',
	'@',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
	'[',
	'\\',
	']',
	'^',
	'_',
	'`',
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
	'{',
	'|',
	'}',
	'~',
] as const;

export type Key = (typeof _keys)[number];

export interface Input {
	engine: Engine;
	mouse: Mouse;
	keys: Record<Key, InputStatus>;
}

type MousePrototype = Pick<Mouse, 'pos' | 'realPos' | '_clicked'>;

export class Input {
	constructor(engine: Engine) {
		this.engine = engine;

		const mouse: MousePrototype = {
			pos: new Vec2(-1, -1),
			realPos: new Vec2(-1, -1),
			_clicked: [0, 0, 0, 0, 0],
		};

		const defineXYProperties = (
			mouse: MousePrototype,
			prefix: 'real' | null = null,
		): void => {
			const posName = prefix !== null ? (`${prefix}Pos` as const) : 'pos';
			const xName = prefix !== null ? (`${prefix}X` as const) : 'x';
			const yName = prefix !== null ? (`${prefix}Y` as const) : 'y';

			([xName, yName] as const).forEach((coordName, i: number) => {
				Object.defineProperties(mouse, {
					[coordName]: {
						get() {
							return mouse[posName][i as 0 | 1];
						},
						set(val: number) {
							mouse[posName][i as 0 | 1] = val;
						},
					},
				});
			});
		};

		defineXYProperties(mouse);
		defineXYProperties(mouse, 'real');

		this.mouse = mouse as Mouse;

		this.clear();
	}

	update(): void {
		for (let i = 0; i < 5; ++i) {
			this.mouse._clicked[i] &= ~1;
		}

		_keys.forEach((key) => {
			this.keys[key] &= ~1;
		});
	}

	// Events
	onMouseMove(e: MouseEvent): void {
		if (document.activeElement !== this.engine.focusElement) return;

		const { canvas } = this.engine;

		const realX = e.clientX + Math.round(window.scrollX);
		const realY = e.clientY + Math.round(window.scrollY);

		this.mouse.realX = realX - canvas.offsetLeft - canvas._offsetX;
		this.mouse.realY = realY - canvas.offsetTop - canvas._offsetY;

		this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
		this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
	}

	onMouseDown(e: MouseEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		if (!this.mouseCheck(e.button)) {
			this.mouse._clicked[e.button] = 3;
		}

		return false;
	}

	onMouseUp(e: MouseEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		if (this.mouseCheck(e.button)) {
			this.mouse._clicked[e.button] = 1;
		}

		return false;
	}

	onKeyDown(e: KeyboardEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		const { key } = e as { key: Key };
		if (!this.keyCheck(key)) {
			this.keys[key] = 3;
		}

		return false;
	}

	onKeyUp(e: KeyboardEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		const { key } = e as { key: Key };
		if (this.keyCheck(key)) {
			this.keys[key] = 1;
		}

		return false;
	}

	// Checks
	_checkPressed(value: InputStatus): boolean {
		return value === 3;
	}

	_checkHeld(value: InputStatus): boolean {
		return (value & 2) > 0;
	}

	_checkReleased(value: InputStatus): boolean {
		return value === 1;
	}

	mousePressed(button: number = 0): boolean {
		return this._checkPressed(this.mouse._clicked[button]);
	}

	mouseCheck(button: number = 0): boolean {
		return this._checkHeld(this.mouse._clicked[button]);
	}

	mouseReleased(button: number = 0): boolean {
		return this._checkReleased(this.mouse._clicked[button]);
	}

	keyPressed(key: Key | Key[]): boolean {
		if (Array.isArray(key)) return key.some((k) => this.keyPressed(k));
		return this._checkPressed(this.keys[key]);
	}

	keyCheck(key: Key | Key[]): boolean {
		if (Array.isArray(key)) return key.some((k) => this.keyCheck(k));
		return this._checkHeld(this.keys[key]);
	}

	keyReleased(key: Key | Key[]): boolean {
		if (Array.isArray(key)) return key.some((k) => this.keyReleased(k));
		return this._checkReleased(this.keys[key]);
	}

	clear(): void {
		this.keys = _keys.reduce((acc, key) => {
			acc[key] = 0;
			return acc;
		}, {} as typeof this.keys);
	}
}

export interface IEntitySystem {
	update?: (entity: Entity, input: Input) => void;
	render?: (
		entity: Entity,
		ctx: CanvasRenderingContext2D,
		camera: Camera,
	) => void;
}

export interface IRenderable {
	depth?: number;
	parent?: IRenderable | undefined;
	// TODO(bret): Figure out if we want this to be like this...
	update?: (input: Input) => void;
	render: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
}

export type Renderable = IRenderable;

// TODO(bret): Rewrite these to use Vectors once those are implemented :)
const rotateNormBy45Deg = (
	curDir: V2CardinalNorm,
	turns: number,
): V2CardinalNorm => {
	const norms = cardinalNorms; // .flatMap(v => [v, v]);
	const index = cardinalNorms.indexOf(curDir);
	if (index === -1) {
		console.error('rotateNormBy45Deg expects a norm array');
		return curDir;
	}

	const n = cardinalNorms.length;
	return cardinalNorms[(index - turns + n) % n] as V2CardinalNorm;
};

// NOTE: The generic allows it to use V2's orthogonal or diagonal norm types, depending on the `curDir`
const rotateNormBy90Deg = <V extends V2CardinalNorm>(
	curDir: V,
	turns: number,
): V => rotateNormBy45Deg(curDir, 2 * turns) as V;

type GridOrData = Grid | Grid['data'];

interface Polygon {
	points: Path;
}

function getGridData(
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): [Grid['data'], number, number] {
	if (_grid instanceof Grid) {
		const { data: grid, columns, rows } = _grid;
		return [grid, columns, rows];
	}
	return [_grid, _columns as number, _rows as number];
}

export const findAllPolygonsInGrid = (
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): Polygon[] => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const polygons: Polygon[] = [];

	const offsets = {
		[hashPos(norm.NU)]: [norm.RU, norm.NU],
		[hashPos(norm.ND)]: [norm.LD, norm.ND],
		[hashPos(norm.RN)]: [norm.RD, norm.RN],
		[hashPos(norm.LN)]: [norm.LU, norm.LN],
	} as const;

	const shapes = findAllShapesInGrid(grid, columns, rows);
	shapes.forEach((shape) => {
		const [first] = shape.shapeCells;
		if (first === undefined) return;

		const { gridType } = shape;

		let curDir = norm.ND as V2OrthogonalNorm;
		let lastDir = curDir;

		const points: Path = [];
		const polygon = { points };
		polygons.push(polygon);

		const addPointsToPolygon = (
			points: Path,
			pos: Vec2,
			interior: boolean,
		): void => {
			const origin = interior ? 0 : -1;
			const size = 16;
			const m1 = size - 1;
			const basePos = scalePos(pos, size);

			const [lastX, lastY] = points.length
				? subPos(points[points.length - 1]!, basePos)
				: [origin, origin];

			const offset = new Vec2(0, 0);
			switch (curDir) {
				case norm.ND:
					offset[0] = origin;
					offset[1] = lastY;
					break;

				case norm.NU:
					offset[0] = m1 - origin;
					offset[1] = lastY;
					break;

				case norm.RN:
					offset[0] = lastX;
					offset[1] = m1 - origin;
					break;

				case norm.LN:
					offset[0] = lastX;
					offset[1] = origin;
					break;
			}

			points.push(addPos(basePos, offset));
		};

		addPointsToPolygon(points, first, gridType === 1);

		for (
			let next = first, firstIter = true;
			firstIter || !posEqual(curDir, norm.ND) || !posEqual(next, first);
			firstIter = false
		) {
			const [p1, p2] = (
				offsets[hashPos(curDir)] as [V2CardinalNorm, V2CardinalNorm]
			)
				.map((o) => addPos(next, o))
				.map((p) => {
					return isWithinBounds(p, Vec2.zero, new Vec2(columns, rows))
						? (grid[posToIndex(p, columns)] as number)
						: 0;
				});

			if (p2 === gridType) {
				if (p1 === gridType) {
					next = addPos(next, curDir);
					curDir = rotateNormBy90Deg(curDir, 1);
				}

				next = addPos(next, curDir);

				if (lastDir !== curDir)
					addPointsToPolygon(points, next, gridType === 1);
			} else {
				curDir = rotateNormBy90Deg(curDir, -1);
				addPointsToPolygon(points, next, gridType === 1);
			}

			lastDir = curDir;

			// if (curDir === normND && next === first) break;
		}
	});

	return polygons;
};

interface Shape {
	gridType: number;
	shapeCells: Vec2[];
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

const findAllShapesInGrid = (
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): Shape[] => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const shapes = [];
	const checked = Array.from({ length: columns * rows }, () => false);

	let nextIndex;
	while ((nextIndex = checked.findIndex((v) => !v)) > -1) {
		const shape = fillShape(
			indexToPos(nextIndex, columns),
			checked,
			grid,
			columns,
			rows,
		);

		// Empty shapes must be enclosed
		if (
			shape.gridType === 0 &&
			(shape.minX === 0 ||
				shape.minY === 0 ||
				shape.maxX >= columns ||
				shape.maxY >= rows)
		)
			continue;

		shapes.push(shape);
	}

	return shapes;
};

const fillShape = (
	start: Vec2,
	checked: boolean[],
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): {
	gridType: number;
	shapeCells: Vec2[];
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
} => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const stride = columns;

	const gridType = grid[posToIndex(start, columns)] as number;

	const queue = [start];
	const visited: string[] = [];

	let next;
	while ((next = queue.pop())) {
		const hash = hashPos(next);
		if (visited.includes(hash)) continue;

		const index = posToIndex(next, stride);
		visited.push(hash);
		if (grid[posToIndex(next, columns)] !== gridType) continue;

		checked[index] = true;

		const [x, y] = next;
		if (x > 0) queue.push(new Vec2(x - 1, y));
		if (x < columns - 1) queue.push(new Vec2(x + 1, y));
		if (y > 0) queue.push(new Vec2(x, y - 1));
		if (y < rows - 1) queue.push(new Vec2(x, y + 1));
	}

	const shapeCells = visited.map(
		(v) => new Vec2(...v.split(',').map((c) => +c)),
	);

	const shapeBounds = shapeCells.reduce(
		(acc, cell) => {
			const [x, y] = cell;
			return {
				minX: Math.min(x, acc.minX),
				maxX: Math.max(x, acc.maxX),
				minY: Math.min(y, acc.minY),
				maxY: Math.max(y, acc.maxY),
			};
		},
		{
			minX: Number.POSITIVE_INFINITY,
			maxX: Number.NEGATIVE_INFINITY,
			minY: Number.POSITIVE_INFINITY,
			maxY: Number.NEGATIVE_INFINITY,
		},
	);

	return {
		...shapeBounds,
		gridType,
		shapeCells,
	};
};

export interface GridOutline {
	grid: Grid | null;
	polygons: Polygon[];
	show: boolean;

	renderOutline: boolean;
	outlineColor: CSSColor;

	renderPoints: boolean;
	pointsColor: CSSColor;
}

export class GridOutline {
	constructor() {
		this.grid = null;
		this.polygons = [];
		this.show = false;

		this.renderOutline = true;
		this.outlineColor = 'red';

		this.renderPoints = true;
		this.pointsColor = 'red';
	}

	computeOutline(grid: Grid): void {
		this.grid = grid;
		this.polygons = findAllPolygonsInGrid(grid);
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera): void {
		if (!this.show) return;

		// Draw edges
		if (this.renderOutline) {
			this.polygons.forEach((polygon) => {
				ctx.beginPath();
				ctx.strokeStyle = this.outlineColor;
				const start = addPos(polygon.points[0]!, [0.5, 0.5]);
				const cameraPos = new Vec2(camera[0], camera[1]);
				const [_x, _y] = subPos(start, cameraPos);
				ctx.moveTo(_x, _y);
				polygon.points
					.slice(1)
					.map((p) => subPos(p, camera as Vector))
					.forEach(([x, y]) => {
						ctx.lineTo(x + 0.5, y + 0.5);
					});
				ctx.closePath();
				ctx.stroke();
			});
		}

		// Draw points
		if (this.renderPoints) {
			ctx.fillStyle = this.pointsColor;
			this.polygons.forEach((polygon) => {
				polygon.points
					.map((p) => subPos(p, camera as Vector))
					.forEach(([x, y]) => {
						ctx.fillRect(x - 1, y - 1, 3, 3);
					});
			});
		}
	}
}

export interface Tileset {
	width: number;
	height: number;
	tileW: number;
	tileH: number;
	columns: number;
	rows: number;

	sprite: Sprite;
	// TODO(bret): Update this to use Graphic's Parent
	parent: Entity | undefined;

	data: Array<Vec2 | null>;

	startX: number;
	startY: number;
	separation: number;
}

export interface TilesetOptions {
	startX?: number;
	startY?: number;
	separation?: number;
}

export class Tileset {
	constructor(
		sprite: Sprite,
		width: number,
		height: number,
		tileW: number,
		tileH: number,
		options: TilesetOptions = {},
	) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);

		this.sprite = sprite;

		this.data = Array.from(
			{ length: this.columns * this.rows },
			(v) => null,
		);

		this.startX = options.startX ?? 1;
		this.startY = options.startY ?? 1;
		this.separation = options.separation ?? 1;
	}

	setTile(x: number, y: number, tileX: number, tileY: number): void {
		if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) return;
		this.data[y * this.columns + x] = new Vec2(tileX, tileY);
	}

	getTile(x: number, y: number): Tileset['data'][number] {
		if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) return null;
		return this.data[y * this.columns + x];
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera): void {
		const scale = 1;

		const {
			sprite: image,
			separation,
			startX,
			startY,
			tileW,
			tileH,
		} = this;

		if (!image.image) throw new Error('Tileset is missing an image');

		const srcCols = Math.floor(image.width / tileW);
		const srcRows = Math.floor(image.height / tileH);

		const [cameraX, cameraY] = camera;

		const offsetX = this.parent?.x ?? 0;
		const offsetY = this.parent?.y ?? 0;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				const val = this.data[y * this.columns + x];
				if (val) {
					const [tileX, tileY] = val;
					const srcX = startX + (separation + tileW) * tileX;
					const srcY = startY + (separation + tileH) * tileY;
					const dstX = x * tileW - cameraX + offsetX;
					const dstY = y * tileH - cameraY + offsetY;
					ctx.drawImage(
						image.image,
						srcX,
						srcY,
						tileW,
						tileH,
						dstX,
						dstY,
						tileW * scale,
						tileH * scale,
					);
				}
			}
		}
	}
}

/* eslint-enable @typescript-eslint/no-unused-vars -- until exports are set up, many of these items are not being used */
