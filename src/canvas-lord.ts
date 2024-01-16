/* eslint-disable @typescript-eslint/no-unused-vars -- until exports are set up, many of these items are not being used */

declare global {
	interface HTMLCanvasElement {
		_actualWidth: number;
		_actualHeight: number;
		_offsetX: number;
		_offsetY: number;
		_scaleX: number;
		_scaleY: number;
	}

	interface Math {
		clamp: (val: number, min: number, max: number) => number;
	}
}

// type Vector = number[];
type V2 = readonly [x: number, y: number];
type V3 = readonly [x: number, y: number, z: number];
type V4 = readonly [x: number, y: number, z: number, w: number];

type Readable<T> = {
	-readonly [P in keyof T]: T[P];
};

type V2Editable = Readable<V2>;
// type V3Editable = Readable<V2>;
// type V4Editable = Readable<V2>;

type Tuple = V2 | V3 | V4;

type TupleT<T extends Tuple> = T extends V2
	? V2
	: // V3
	T extends V3
	? V3
	: // V4
	T extends V4
	? V4
	: // other
	  never; // could also just return T at this point, or add some extra cases that aren't cool (like [] or [number])

type FuncMapTuple = <A extends Tuple, B extends Tuple>(a: A, b: B) => A;
type FuncMapTupleByScalar = <P extends Tuple>(p: P, s: number) => P;
type FuncReduceTuple = <A extends Tuple, B extends Tuple>(a: A, b: B) => number;

type FuncReduceNumber = (acc: number, v: number) => number;

type TupleToObjectTupleHybrid<A extends readonly PropertyKey[]> = Pick<
	{
		[TIndex in A[number] | keyof A]: number;
	},
	Exclude<keyof A, keyof unknown[]> | A[number]
>;

const hashTuple = (pos: Tuple): string => pos.join(',');

const _tupleMap = new Map<string, V2 | V3 | V4>();
export const Tuple = <V extends Tuple>(...args: V): TupleT<V> => {
	const hash = hashTuple(args);
	if (!_tupleMap.has(hash)) {
		const tuple = Object.freeze(args) as unknown as Tuple;
		_tupleMap.set(hash, tuple);
	}
	return _tupleMap.get(hash) as TupleT<V>;
};

// NOTE: This should be able to infer the return type...
Math.clamp = (val, min, max): number => {
	if (val < min) return min;
	if (val > max) return max;
	return val;
};

export const EPSILON = 0.000001;

const reduceSum: FuncReduceNumber = (acc, v) => acc + v;
const reduceProduct: FuncReduceNumber = (acc, v) => acc * v;

const distance = (...dimensions: Tuple): number =>
	Math.abs(Math.sqrt(dimensions.map((d) => d * d).reduce(reduceSum, 0)));
const distanceSq = (...dimensions: Tuple): number =>
	Math.abs(dimensions.map((d) => d * d).reduce(reduceSum, 0));

const isDefined = <T>(v: T | undefined): v is T => Boolean(v);

const interlaceArrays = <T, U>(
	a: Readonly<T[]>,
	b: Readonly<U[]>,
): Array<T | U> => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);

const compareTuple = (a: Tuple, b: Tuple): boolean =>
	hashTuple(a) === hashTuple(b);
const indexToPos = (index: number, stride: number): V2 => [
	index % stride,
	Math.floor(index / stride),
];
const posToIndex = ([x, y]: V2, stride: number): number => y * stride + x;
const posEqual = (a: Tuple, b: Tuple): boolean =>
	a.length === b.length && a.every((v, i) => v === b[i]);

export const addPos: FuncMapTuple = (a, b) => {
	return Tuple(
		...(a.map((v, i) => v + (b[i] ?? 0)) as unknown as typeof a),
	) as unknown as typeof a;
};

export const subPos: FuncMapTuple = (a, b) => {
	return Tuple(
		...(a.map((v, i) => v - (b[i] ?? 0)) as unknown as typeof a),
	) as unknown as typeof a;
};
export const scalePos: FuncMapTupleByScalar = (p, s) => {
	return Tuple(
		...(p.map((v) => v * s) as unknown as typeof p),
	) as unknown as typeof p;
};
export const mapByOffset = <V extends Tuple>(offset: V): ((pos: V) => V) => {
	return (pos: V): V => addPos(offset, pos);
};
export const mapFindOffset = <V extends Tuple>(origin: V): ((pos: V) => V) => {
	return (pos: V): V => subPos(pos, origin);
};
export const flatMapByOffsets = <V extends Tuple>(
	offsets: V[],
): ((pos: V) => V[]) => {
	return (pos: V): V[] => offsets.map((offset) => addPos(offset, pos));
};
export const posDistance: FuncReduceTuple = (a, b) => distance(...subPos(b, a));
export const posDistanceSq: FuncReduceTuple = (a, b) =>
	distanceSq(...subPos(b, a));

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
const getAngle: FuncReduceTuple = (a, b) =>
	Math.atan2(b[1] - a[1], b[0] - a[0]);
const getAngleBetween: FuncReduceNumber = (a, b) =>
	((b - a + RAD_540) % RAD_360) - RAD_180;

type Line2D = [V2, V2];

const crossProduct2D: FuncReduceTuple = (a, b) => a[0] * b[1] - a[1] * b[0];
const _lineSegmentIntersection = ([a, b]: Line2D, [c, d]: Line2D): V2 => {
	const r = subPos(b, a);
	const s = subPos(d, c);

	const rxs = crossProduct2D(r, s);

	const t = crossProduct2D(subPos(c, a), s) / rxs;
	const u = crossProduct2D(subPos(a, c), r) / -rxs;

	return [t, u];
};
export const checkLineSegmentIntersection = (a: Line2D, b: Line2D): boolean => {
	const [t, u] = _lineSegmentIntersection(a, b);

	// TODO(bret): Play with these values a bit more
	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
export const getLineSegmentIntersection = (a: Line2D, b: Line2D): V2 | null => {
	const [t, u] = _lineSegmentIntersection(a, b);

	return t >= 0 && t <= 1 && u >= 0 && u <= 1
		? addPos(a[0], scalePos(subPos(a[1], a[0]), t))
		: null;
};
export const isPointOnLine = <V extends Tuple>(point: V, a: V, b: V): boolean =>
	Math.abs(
		posDistance(a, point) + posDistance(point, b) - posDistance(a, b),
	) < EPSILON;

// TODO(bret): Would be fun to make this work with any dimensions
const isWithinBounds = ([x, y]: V2, [x1, y1]: V2, [x2, y2]: V2): boolean =>
	x >= x1 && y >= y1 && x < x2 && y < y2;

export const filterWithinBounds =
	<V extends Tuple>(a: V, b: V): ((pos: V) => boolean) =>
	(pos: V): boolean =>
		a.every((p, i) => (pos[i] ?? -Infinity) >= p) &&
		b.every((p, i) => (pos[i] ?? Infinity) < p);

type Path = V2[];

export const isPointInsidePath = (point: V2, path: Path): boolean => {
	const wind = path
		.map((vertex) => getAngle(point, vertex))
		.map((angle, i, arr) =>
			getAngleBetween(angle, arr[(i + 1) % arr.length] as number),
		)
		.reduce(reduceSum, 0);
	return Math.abs(wind) > EPSILON;
};

export const v2zero = Tuple(0, 0);
export const v2one = Tuple(1, 1);

const createBitEnum = <T extends readonly string[]>(
	..._names: T
): TupleToObjectTupleHybrid<T> => {
	const names = _names.flat();
	const bitEnumObj = {} as TupleToObjectTupleHybrid<T>;
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

const createNorm = <V extends readonly [number, number]>(norm: V): V => {
	return Tuple(...norm) as unknown as V;
};

// prettier-ignore
const [
	normLU, normNU, normRU,
	normLN, normNN, normRN,
	normLD, normND, normRD,
] = [
		Tuple(-1, -1) as readonly [-1, -1],
		Tuple(0, -1) as readonly [0, -1],
		Tuple(1, -1) as readonly [1, -1],

		Tuple(-1, 0) as readonly [-1, 0],
		Tuple(0, 0) as readonly [0, 0],
		Tuple(1, 0) as readonly [1, 0],

		Tuple(-1, 1) as readonly [-1, 1],
		Tuple(0, 1) as readonly [0, 1],
		Tuple(1, 1) as readonly [1, 1],
	];

const orthogonalNorms = [normRN, normNU, normLN, normND] as const;
const diagonalNorms = [normRU, normLU, normLD, normRD] as const;
export const cardinalNorms = interlaceArrays(orthogonalNorms, diagonalNorms);

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

export const normToBitFlagMap = new Map<V2CardinalNorm, number>();
[
	[normRN, CARDINAL_NORM.RN] as const, // 1
	[normRU, CARDINAL_NORM.RU] as const, // 2
	[normNU, CARDINAL_NORM.NU] as const, // 4
	[normLU, CARDINAL_NORM.LU] as const, // 8
	[normLN, CARDINAL_NORM.LN] as const, // 16
	[normLD, CARDINAL_NORM.LD] as const, // 32
	[normND, CARDINAL_NORM.ND] as const, // 64
	[normRD, CARDINAL_NORM.RD] as const, // 128
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(dir, bitFlag));

const orTogetherCardinalDirs = (...dirs: CardinalNormStr[]): number =>
	dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);

export const globalSetTile = (
	tileset: Tileset,
	x: number,
	y: number,
	bitFlag: number,
): void => {
	console.log({ bitFlag });
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

export interface AssetManager {
	images: Map<string, HTMLImageElement | null>;
	imagesLoaded: number;
	onLoadCallbacks: AssetManagerOnLoadCallback[];
	prefix: string;
}

export class AssetManager {
	constructor(prefix = '') {
		this.images = new Map();
		this.imagesLoaded = 0;
		this.onLoadCallbacks = [];
		this.prefix = prefix;
	}

	addImage(src: string): void {
		this.images.set(src, null);
	}

	loadImage(src: string): void {
		const image = new Image();
		image.onload = (): void => {
			this.imageLoaded(src);
			this.images.set(src, image);
		};
		image.src = `${this.prefix}${src}`;
	}

	loadAssets(): void {
		[...this.images.keys()].forEach((src) => {
			this.loadImage(src);
		});
	}

	imageLoaded(src: string): void {
		if (++this.imagesLoaded === this.images.size) {
			window.requestAnimationFrame(() => {
				this.onLoadCallbacks.forEach((callback) => callback(src));
			});
		}
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

type CSSColor = string;

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
			update: Exclude<UpdateSettings, 'onEvent'>;
			render: RenderSettings;
	  }
	| {
			update: Extract<UpdateSettings, 'onEvent'>;
			updateOn: UpdateOnEvent[];
			render: RenderSettings;
	  };

// TODO(bret): 'tabblur', 'tabfocus'
const gameEvents = ['blur', 'focus', 'update'] as const;

type GameEvent = (typeof gameEvents)[number];
type EventCallback = () => void;

export interface Game {
	listeners: Record<GameEvent, Set<EventCallback>>;
	focus: boolean;
	gameLoopSettings: GameLoopSettings;
	sceneStack: Scene[][];
	backgroundColor: CSSColor;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	input: Input;
	_lastFrame: number;
	mainLoop: (time: number) => void;
	frameRequestId: number;
	eventListeners: CachedEventListener[];
	_onGameLoopSettingsUpdate?: EventCallback;
}

export type Engine = Game;

export class Game {
	gameLoopSettings: GameLoopSettings = {
		update: 'focus',
		render: 'onUpdate',
	};

	constructor(id: string, gameLoopSettings?: GameLoopSettings) {
		const canvas = document.querySelector<HTMLCanvasElement>(
			`canvas#${id}`,
		);
		if (canvas === null) {
			console.error(`No canvas with id "${id}" was able to be found`);
			return;
		}

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

		this.focus = false;

		this.listeners = gameEvents.reduce((acc, val) => {
			acc[val] = new Set<EventCallback>();
			return acc;
		}, {} as typeof this.listeners);

		if (gameLoopSettings) this.gameLoopSettings = gameLoopSettings;

		this.sceneStack = [];

		this.backgroundColor = '#323232';

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

			defineUnwritableProperty(canvas, '_offsetX', paddingLeft);
			defineUnwritableProperty(canvas, '_offsetY', paddingTop);

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

		const timestep = 1000 / 60;

		this._lastFrame = 0;
		let deltaTime = 0;
		const maxFrames = 5;
		this.mainLoop = (time): void => {
			this.frameRequestId = requestAnimationFrame(this.mainLoop);

			deltaTime += time - this._lastFrame;
			this._lastFrame = time;

			deltaTime = Math.min(deltaTime, timestep * maxFrames + 0.01);

			while (deltaTime >= timestep) {
				this.update();
				this.input.update();
				deltaTime -= timestep;
			}
		};

		this.eventListeners = [];

		window.addEventListener('resize', (e) => {
			computeCanvasSize(this.canvas);
		});

		window.addEventListener('blur', (e) => this.onFocus(false));

		this.canvas.addEventListener('focus', (e) => this.onFocus(true));
		this.canvas.addEventListener('blur', (e) => this.onFocus(false));

		this.updateGameLoopSettings(this.gameLoopSettings);
	}

	get width(): number {
		return this.canvas.width;
	}

	get height(): number {
		return this.canvas.height;
	}

	get currentScenes(): Scene[] | undefined {
		return this.sceneStack[0];
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
		switch (this.gameLoopSettings.update) {
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

		if (this.gameLoopSettings.render === 'onUpdate') {
			this.listeners.update.add(render);
		}

		this._onGameLoopSettingsUpdate = (): void => {
			// Remove existing callbacks
			switch (this.gameLoopSettings.update) {
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

			if (this.gameLoopSettings.render === 'onUpdate') {
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
		this.addEventListener(this.canvas, 'mouseup', onMouseUp);

		// TODO(bret): Find out if we need useCapture here & above
		[
			'mousedown',
			'mouseup',
			'mouseenter',
			'mousemove',
			'mouseexit',
		].forEach((event) => {
			// TODO(bret): Check other HTML5 game engines to see if they attach mouse events to the canvas or the window
			this.addEventListener(this.canvas, event, onMouseMove);
		});

		this.addEventListener(window, 'keydown', onKeyDown, false);
		this.addEventListener(window, 'keyup', onKeyUp, false);
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
		this.focus = focus;
		this.sendEvent(focus ? 'focus' : 'blur');
	}

	pushScene(scene: Scene): void {
		this.pushScenes(scene);
	}

	pushScenes(...scenes: Scene[]): void {
		this.sceneStack.push(scenes);
		scenes.forEach((scene) => {
			scene.engine = this;
		});
	}

	update(): void {
		this.currentScenes?.forEach((scene) => scene.update(this.input));

		this.sendEvent('update');
	}

	sendEvent(event: GameEvent): void {
		this.listeners[event].forEach((c) => c());
	}

	render(): void {
		const { canvas, ctx } = this;

		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, 640, 360);

		this.currentScenes?.forEach((scene) => scene.render(ctx));

		// Splitscreen
		if (this.sceneStack[0]?.length === 2) {
			ctx.strokeStyle = '#323232';
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(canvas.width / 2, 0.5);
			ctx.lineTo(canvas.width / 2, 360.5);
			ctx.stroke();
		}
	}
}

type InputStatus = 0 | 1 | 2 | 3;

interface Mouse {
	pos: V2;
	x: V2[0];
	y: V2[1];
	realPos: V2;
	realX: V2[0];
	realY: V2[1];
	_clicked: InputStatus;
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
			pos: [-1, -1],
			realPos: [-1, -1],
			_clicked: 0,
		};

		const defineXYProperties = (
			mouse: MousePrototype,
			prefix: 'real' | null = null,
		): void => {
			const posName = prefix !== null ? (`${prefix}Pos` as const) : 'pos';
			const xName = prefix !== null ? (`${prefix}X` as const) : 'x';
			const yName = prefix !== null ? (`${prefix}Y` as const) : 'y';

			([xName, yName] as const).forEach((coordName, i) => {
				Object.defineProperties(mouse, {
					[coordName]: {
						get() {
							return mouse[posName][i];
						},
						set(val: number) {
							mouse[posName] = Object.freeze(
								mouse[posName].map((oldVal, index) =>
									index === i ? val : oldVal,
								),
							) as V2;
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
		this.mouse._clicked &= ~1;
		_keys.forEach((key) => {
			this.keys[key] &= ~1;
		});
	}

	// Events
	onMouseMove(e: MouseEvent): void {
		const { canvas } = this.engine;

		this.mouse.realX = e.offsetX - canvas._offsetX;
		this.mouse.realY = e.offsetY - canvas._offsetY;

		this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
		this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
	}

	onMouseDown(e: MouseEvent): boolean {
		e.preventDefault();
		if (!this.mouseCheck()) {
			this.mouse._clicked = 3;
		}

		return false;
	}

	onMouseUp(e: MouseEvent): boolean {
		e.preventDefault();
		if (this.mouseCheck()) {
			this.mouse._clicked = 1;
		}

		return false;
	}

	onKeyDown(e: KeyboardEvent): boolean {
		e.preventDefault();
		const { key } = e as { key: Key };
		if (!this.keyCheck(key)) {
			this.keys[key] = 3;
		}

		return false;
	}

	onKeyUp(e: KeyboardEvent): boolean {
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

	mousePressed(): boolean {
		return this._checkPressed(this.mouse._clicked);
	}

	mouseCheck(): boolean {
		return this._checkHeld(this.mouse._clicked);
	}

	mouseReleased(): boolean {
		return this._checkReleased(this.mouse._clicked);
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

class Camera extends Array {
	constructor(x: V2[0], y: V2[1]) {
		super();
		this.push(x, y);
	}

	get x(): number {
		return this[0] as number;
	}
	set x(val) {
		this[0] = val;
	}

	get y(): number {
		return this[1] as number;
	}
	set y(val) {
		this[1] = val;
	}
}

interface IEntity {
	scene: Scene | null;
	update: (input: Input) => void;
}

interface IRenderable {
	render: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
}

type Entity = IEntity;
type Renderable = IRenderable;

export interface Scene {
	engine: Engine;
	entities: Entity[];
	renderables: Renderable[];
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

		this.entities = [];
		this.renderables = [];

		this.shouldUpdate = true;

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

	addEntity(entity: Entity): Entity {
		entity.scene = this;
		this.entities.push(entity);
		return entity;
	}

	update(input: Input): void {
		if (this.allowRefresh && input.keyPressed('F5')) location.reload();

		if (this.escapeToBlur && input.keyPressed('Escape'))
			this.engine.canvas.blur();

		if (!this.shouldUpdate) return;

		this.entities.forEach((entity) => entity.update(input));
		// this.renderables = this.renderables.filter(e => e).sort();
	}

	render(ctx: CanvasRenderingContext2D): void {
		this.ctx.fillStyle = '#87E1A3';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.renderables.forEach((entity) =>
			entity.render(this.ctx, this.camera),
		);

		// const width = 2;
		// const posOffset = 0.5;
		// const widthOffset = width;
		// this.ctx.strokeStyle = '#787878';
		// this.ctx.lineWidth = (width * 2 - 1);
		// this.ctx.strokeRect(posOffset, posOffset, this.canvas.width - 1, this.canvas.height - 1);

		ctx.drawImage(this.canvas, ...this.screenPos);
	}
}

// TODO(bret): Rounded rectangle https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas

export const drawLine = (
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): void => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
};

const pixelCanvas = new OffscreenCanvas(1, 1);
const _pixelCtx = pixelCanvas.getContext('2d');
if (!_pixelCtx) {
	throw Error('pixelCtx failed to create');
}
const pixelCtx = _pixelCtx;

export interface Grid {
	width: number;
	height: number;
	tileW: number;
	tileH: number;
	columns: number;
	rows: number;
	color: CSSColor;
	renderMode: 0 | 1 | 2;
	data: number[];
}

export class Grid {
	constructor(width: number, height: number, tileW: number, tileH: number) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);

		const size = this.columns * this.rows;

		this.color = 'rgba(255, 0, 0, 0.6)';
		this.renderMode = 2;
		this.data = Array.from({ length: size }, (v) => 0);
	}

	static fromBitmap(
		assetManager: AssetManager,
		src: string,
		tileW: number,
		tileH: number,
	): Grid {
		const image = assetManager.images.get(src);
		if (!image) {
			throw new Error('image is not valid');
		}

		const width = image.width * tileW;
		const height = image.height * tileH;
		const stride = image.width;

		const grid = new Grid(width, height, tileW, tileH);
		grid.forEach((_, [x, y]) => {
			pixelCtx.drawImage(image, -x, -y);
			const { data } = pixelCtx.getImageData(0, 0, 1, 1);
			if (data[0] === 0) {
				grid.setTile(x, y, 1);
			}
		});

		return grid;
	}

	static fromBinary(
		data: [number, number, ...number[]],
		tileW: number,
		tileH: number,
	): Grid {
		const [width, height, ...gridData] = data;

		const grid = new Grid(width * tileW, height * tileH, tileW, tileH);

		const stride = grid.columns;
		gridData
			.flatMap((b) => b.toString(2).padStart(32, '0').split(''))
			.forEach((v, i) => {
				grid.setTile(...indexToPos(i, stride), +v);
			});

		return grid;
	}

	forEach(callback: (val: number, pos: V2) => void): void {
		const stride = this.columns;
		this.data
			.map<[number, V2]>((val, i) => [val, indexToPos(i, stride)])
			.forEach((args) => callback(...args));
	}

	inBounds(x: number, y: number): boolean {
		return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
	}

	setTile(x: number, y: number, value: number): void {
		if (!this.inBounds(x, y)) return;
		this.data[y * this.columns + x] = value;
	}

	getTile(x: number, y: number): number {
		if (!this.inBounds(x, y)) return 0;
		return this.data[y * this.columns + x] as number;
	}

	renderOutline(ctx: CanvasRenderingContext2D, camera: V2): void {
		const stride = this.columns;
		const width = this.tileW;
		const height = this.tileH;

		const [cameraX, cameraY] = camera;

		ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					const x1 = x * this.tileW + 0.5 - cameraX;
					const y1 = y * this.tileH + 0.5 - cameraY;
					const x2 = x1 + width - 1;
					const y2 = y1 + height - 1;
					if (!this.getTile(x - 1, y)) {
						drawLine(ctx, x1, y1, x1, y2);
					}
					if (!this.getTile(x + 1, y)) {
						drawLine(ctx, x2, y1, x2, y2);
					}
					if (!this.getTile(x, y - 1)) {
						drawLine(ctx, x1, y1, x2, y1);
					}
					if (!this.getTile(x, y + 1)) {
						drawLine(ctx, x1, y2, x2, y2);
					}
				}
			}
		}
	}

	renderEachCell(
		ctx: CanvasRenderingContext2D,
		camera: V2,
		fill = false,
	): void {
		const stride = this.columns;
		const width = this.tileW - +!fill;
		const height = this.tileH - +!fill;

		const [cameraX, cameraY] = camera;

		if (fill) ctx.fillStyle = this.color;
		else ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		const drawRect = (...args: Parameters<typeof ctx.fillRect>): void =>
			fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);

		const offset = fill ? 0 : 0.5;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					drawRect(
						x * this.tileW + offset - cameraX,
						y * this.tileH + offset - cameraY,
						width,
						height,
					);
				}
			}
		}
	}

	render(ctx: CanvasRenderingContext2D, camera = v2zero): void {
		switch (this.renderMode) {
			case 0:
				this.renderOutline(ctx, camera);
				break;

			case 1:
				this.renderEachCell(ctx, camera);
				break;

			case 2: {
				const temp = this.color;
				this.color = 'rgba(255, 0, 0, 0.3)';
				this.renderEachCell(ctx, camera, true);
				this.color = temp;
				this.renderEachCell(ctx, camera, false);
				break;
			}
		}
	}
}

// TODO(bret): Rewrite these to use tuples once those are implemented :)
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
		[hashTuple(normNU)]: [normRU, normNU],
		[hashTuple(normND)]: [normLD, normND],
		[hashTuple(normRN)]: [normRD, normRN],
		[hashTuple(normLN)]: [normLU, normLN],
	} as const;

	const shapes = findAllShapesInGrid(grid, columns, rows);
	shapes.forEach((shape) => {
		const [first] = shape.shapeCells;
		if (first === undefined) return;

		const { gridType } = shape;

		let curDir = normND as V2OrthogonalNorm;
		let lastDir = curDir;

		const points: Path = [];
		const polygon = { points };
		polygons.push(polygon);

		const addPointsToPolygon = (
			points: Path,
			pos: V2,
			interior: boolean,
		): void => {
			const origin = interior ? 0 : -1;
			const size = 16;
			const m1 = size - 1;
			const basePos = scalePos(pos, size);

			const [lastX, lastY] = points.length
				? subPos(points[points.length - 1] as V2, basePos)
				: [origin, origin];

			const offset: V2Editable = [0, 0];
			switch (curDir) {
				case normND:
					offset[0] = origin;
					offset[1] = lastY;
					break;

				case normNU:
					offset[0] = m1 - origin;
					offset[1] = lastY;
					break;

				case normRN:
					offset[0] = lastX;
					offset[1] = m1 - origin;
					break;

				case normLN:
					offset[0] = lastX;
					offset[1] = origin;
					break;
			}

			points.push(addPos(basePos, Tuple(...offset)));
		};

		addPointsToPolygon(points, first, gridType === 1);

		for (
			let next = first, firstIter = true;
			firstIter || curDir !== normND || next !== first;
			firstIter = false
		) {
			const [p1, p2] = (
				offsets[hashTuple(curDir)] as [V2CardinalNorm, V2CardinalNorm]
			)
				.map((o) => addPos(next, o))
				.map((p) => {
					return isWithinBounds(p, v2zero, [columns, rows])
						? (grid[posToIndex(p, columns)] as number)
						: 0;
				}) as unknown as V2;

			if (p2 === gridType) {
				if (p1 === gridType) {
					next = addPos(next, curDir as V2);
					curDir = rotateNormBy90Deg(curDir, 1);
				}

				next = addPos(next, curDir as V2);

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
	shapeCells: V2[];
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
	start: V2,
	checked: boolean[],
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): {
	gridType: number;
	shapeCells: V2[];
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
		const hash = hashTuple(next);
		if (visited.includes(hash)) continue;

		const index = posToIndex(next, stride);
		visited.push(hash);
		if (grid[posToIndex(next, columns)] !== gridType) continue;

		checked[index] = true;

		const [x, y] = next;
		if (x > 0) queue.push([x - 1, y]);
		if (x < columns - 1) queue.push([x + 1, y]);
		if (y > 0) queue.push([x, y - 1]);
		if (y < rows - 1) queue.push([x, y + 1]);
	}

	const shapeCells = visited.map((v) =>
		Tuple(...(v.split(',').map((c) => +c) as [number, number])),
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
		this.show = true;

		this.renderOutline = true;
		this.outlineColor = 'red';

		this.renderPoints = true;
		this.pointsColor = 'red';
	}

	computeOutline(grid: Grid): void {
		this.grid = grid;
		this.polygons = findAllPolygonsInGrid(grid);
	}

	render(ctx: CanvasRenderingContext2D, camera: V2 = v2zero): void {
		if (!this.show) return;

		// Draw edges
		if (this.renderOutline) {
			this.polygons.forEach((polygon) => {
				ctx.beginPath();
				ctx.strokeStyle = this.outlineColor;
				ctx.moveTo(
					...subPos(
						addPos(polygon.points[0] as V2, Tuple(0.5, 0.5)),
						camera,
					),
				);
				polygon.points
					.slice(1)
					.map((p) => subPos(p, camera))
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
					.map((p) => subPos(p, camera))
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

	image: HTMLImageElement;

	data: Array<V2 | null>;

	startX: number;
	startY: number;
	separation: number;
}

export class Tileset {
	constructor(
		image: HTMLImageElement,
		width: number,
		height: number,
		tileW: number,
		tileH: number,
	) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);

		this.image = image;

		this.data = Array.from(
			{ length: this.columns * this.rows },
			(v) => null,
		);

		this.startX = 1;
		this.startY = 1;
		this.separation = 1;
	}

	setTile(x: number, y: number, tileX: number, tileY: number): void {
		// TODO(bret): Make sure it's within the bounds
		this.data[y * this.columns + x] = [tileX, tileY];
	}

	render(ctx: CanvasRenderingContext2D, camera = v2zero): void {
		const scale = 1;

		const { image, separation, startX, startY, tileW, tileH } = this;

		const srcCols = Math.floor(this.image.width / tileW);
		const srcRows = Math.floor(this.image.height / tileH);

		const [cameraX, cameraY] = camera;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				const val = this.data[y * this.columns + x];
				if (val) {
					const [tileX, tileY] = val;
					const srcX = startX + (separation + tileW) * tileX;
					const srcY = startY + (separation + tileH) * tileY;
					const dstX = x * tileW - cameraX;
					const dstY = y * tileH - cameraY;
					ctx.drawImage(
						image,
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
