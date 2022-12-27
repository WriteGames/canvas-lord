Math.clamp = (val, min, max) => {
	if (val < min) return min;
	if (val > max) return max;
	return val;
};

const EPSILON = 0.000001;

const interlaceArrays = (a, b) => a.flatMap((v, i) => [v, b[i]]);

const hashTuple = (pos) => pos.join(',');
const compareTuple = (a, b) => hashTuple(a) === hashTuple(b);
const indexToPos = (index, stride) => [
	index % stride,
	Math.floor(index / stride),
];
const posToIndex = ([x, y], stride) => y * stride + x;
const posEqual = (a, b) =>
	a.length === b.length && a.every((v, i) => v === b[i]);
// TODO(bret): Create a better name for this (ask on Twitter, duh)
const posInteger = (pos) => pos.map((v) => Math.floor(v));

const distance = (x, y) => Math.abs(Math.sqrt(x * x + y * y));
const distanceSq = (x, y) => Math.abs(x * x + y * y);

const addPos = (a, b) => a.map((v, i) => v + b[i]);
const subPos = (a, b) => a.map((v, i) => v - b[i]);
const scalePos = (p, s) => p.map((v) => v * s);
const mapByOffset = (offset) => (pos) => addPos(offset, pos);
const mapFindOffset = (origin) => (pos) => subPos(pos, origin);
const flatMapByOffsets = (offsets) => (pos) =>
	offsets.map((offset) => addPos(offset, pos));
const posDistance = (a, b) => distance(...subPos(b, a));
// const posDistanceSq = (a, b) => distanceSq(subPos(b, a));

const reduceSum = (acc, v) => acc + v;
const reduceProduct = (acc, v) => acc * v;

reduceSum2();

const pathToSegments = (path) =>
	path.map((vertex, i, vertices) => [
		vertex,
		vertices[(i + 1) % vertices.length],
	]);

const RAD_TO_DEG = 180.0 / Math.PI;
const radToDeg = (rad) => rad * RAD_TO_DEG;
const DEG_TO_RAD = Math.PI / 180.0;
const degToRad = (deg) => deg * DEG_TO_RAD;

const RAD_45 = 45 * DEG_TO_RAD;
const RAD_90 = 90 * DEG_TO_RAD;
const RAD_180 = 180 * DEG_TO_RAD;
const RAD_270 = 270 * DEG_TO_RAD;
const RAD_360 = 360 * DEG_TO_RAD;
const RAD_540 = 540 * DEG_TO_RAD;
const RAD_720 = 720 * DEG_TO_RAD;

// const getAngle = (a, b) => Math.atan2(...subPos(b, a)) * 180 / Math.PI;
const getAngle = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const getAngleBetween = (a, b) => ((b - a + RAD_540) % RAD_360) - RAD_180;

const crossProduct2D = (a, b) => a[0] * b[1] - a[1] * b[0];
const _lineSegmentIntersection = ([a, b], [c, d]) => {
	const r = subPos(b, a);
	const s = subPos(d, c);

	const rxs = crossProduct2D(r, s);

	const t = crossProduct2D(subPos(c, a), s) / rxs;
	const u = crossProduct2D(subPos(a, c), r) / -rxs;

	return [t, u];
};
const checkLineSegmentIntersection = (a, b) => {
	const [t, u] = _lineSegmentIntersection(a, b);

	// TODO(bret): Play with these values a bit more
	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
const getLineSegmentIntersection = (a, b) => {
	const [t, u] = _lineSegmentIntersection(a, b);

	return t >= 0 && t <= 1 && u >= 0 && u <= 1
		? addPos(a[0], scalePos(subPos(a[1], a[0]), t))
		: null;
};
const isPointOnLine = (point, a, b) =>
	Math.abs(
		posDistance(a, point) + posDistance(point, b) - posDistance(a, b),
	) < EPSILON;

const isWithinBounds = ([x, y], [x1, y1], [x2, y2]) =>
	x >= x1 && y >= y1 && x < x2 && y < y2;

const filterWithinBounds = (a, b) => (pos) =>
	a.every((p, i) => pos[i] >= p) && b.every((p, i) => pos[i] < p);

const isPointInsidePath = (point, path) => {
	const wind = path
		.map((vertex) => getAngle(point, vertex))
		.map((angle, i, arr) =>
			getAngleBetween(angle, arr[(i + 1) % arr.length]),
		)
		.reduce(reduceSum, 0);
	return Math.abs(wind) > EPSILON;
};

const v2zero = Object.freeze([0, 0]);
const v2one = Object.freeze([1, 1]);

const createBitEnum = (prefix, ..._names) => {
	const names = _names.flat();
	const bitEnumObj = (globalThis[prefix.toUpperCase()] = []);
	names.forEach((name, i) => {
		const val = 1 << i;
		bitEnumObj.push(val);
		bitEnumObj[name.toUpperCase()] = val;
	});
	return bitEnumObj;
};

const reduceBitFlags = (acc, val) => acc | val;

const dirNN = 0;
const [dirRN, dirNU, dirLN, dirND] = Array.from({ length: 4 }).map(
	(_, i) => 1 << i,
);
// prettier-ignore
const [
	dirLU, dirRU,
	dirLD, dirRD,
] = [
	dirLN | dirNU, dirRN | dirNU,
	dirLN | dirND, dirRN | dirND,
];

// prettier-ignore
const [
	normLU, normNU, normRU,
	normLN, normNN, normRN,
	normLD, normND, normRD,
] = [
	[-1, -1], [ 0, -1], [ 1, -1],
	[-1,  0], [ 0,  0], [ 1,  0],
	[-1,  1], [ 0,  1], [ 1,  1],
];

const orthogalNorms = [normRN, normNU, normLN, normND];
const diagonalNorms = [normRU, normLU, normLD, normRD];
const cardinalNorms = interlaceArrays(orthogalNorms, diagonalNorms);

// Starts right, goes counter-clockwise
const cardinalNormStrs = ['RN', 'RU', 'NU', 'LU', 'LN', 'LD', 'ND', 'RD'];
const CARDINAL_NORM = createBitEnum('CARDINAL_NORM', cardinalNormStrs);
const mapStrToCardinalDirBitFlag = (str) => CARDINAL_NORM[str];

const normToBitFlagMap = new Map();
[
	[normRN, CARDINAL_NORM.RN], // 1
	[normRU, CARDINAL_NORM.RU], // 2
	[normNU, CARDINAL_NORM.NU], // 4
	[normLU, CARDINAL_NORM.LU], // 8
	[normLN, CARDINAL_NORM.LN], // 16
	[normLD, CARDINAL_NORM.LD], // 32
	[normND, CARDINAL_NORM.ND], // 64
	[normRD, CARDINAL_NORM.RD], // 128
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(hashTuple(dir), bitFlag));

const orTogetherCardinalDirs = (...dirs) =>
	dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);

const setTile = (tileset, x, y, bitFlag) => {
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

class AssetManager {
	constructor(prefix = '') {
		this.images = new Map();
		this.imagesLoaded = 0;
		this.onLoadCallbacks = [];
		this.prefix = prefix;
	}

	addImage(src) {
		this.images.set(src, null);
	}

	loadImage(src) {
		const image = new Image();
		image.onload = (e) => {
			this.imageLoaded(src);
			this.images.set(src, image);
		};
		image.src = `${this.prefix}${src}`;
	}

	loadAssets() {
		[...this.images.keys()].forEach((src) => {
			this.loadImage(src);
		});
	}

	imageLoaded(src) {
		if (++this.imagesLoaded === this.images.size) {
			window.requestAnimationFrame(() => {
				this.onLoadCallbacks.forEach((callback) => callback());
			});
		}
	}

	onLoad(callback) {
		this.onLoadCallbacks.push(callback);
	}
}

const initGrid = () => {
	const grid = new Grid(320, 180, 16, 16);

	for (let y = 1; y < grid.rows; ++y) {
		grid.setTile(0, y, 1);
		grid.setTile(grid.columns - 1, y, 1);
	}

	grid.setTile(1, 4, 1);
	grid.setTile(1, 5, 1);

	for (let x = 0; x < grid.columns; ++x) {
		grid.setTile(x, 10, 1);
		grid.setTile(x, 11, 1);
	}

	for (let x = 8; x <= 11; ++x) {
		grid.setTile(x, 9, 1);
	}

	for (let x = 4; x <= 5; ++x) {
		grid.setTile(x, 7, 1);
		grid.setTile(x, 8, 1);
		// grid.setTile(x, 9, 1);
	}

	for (let y = 6; y <= 9; ++y) {
		for (let x = 17; x <= 18; ++x) {
			grid.setTile(x, y, 1);
		}
	}

	grid.setTile(15, 8, 1);
	grid.setTile(15, 9, 1);

	for (let y = 3, yn = y + 2; y < yn; ++y) {
		for (let x = 9, n = x + 4; x < n; ++x) {
			grid.setTile(x, y, 1);
		}
	}
	grid.setTile(9, 5, 1);
	grid.setTile(12, 5, 1);

	return grid;
};

const initGrid2 = () => {
	const grid = initGrid();

	Array.from({ length: 4 }, (_, i) => grid.setTile(9 + i, 6, 1));

	grid.setTile(8, 5, 1);
	grid.setTile(8 + 5, 5, 1);

	return grid;
};

const initTileset = (grid) => {
	const tileset = new Tileset(grid.width, grid.height, 16, 16);

	const setCloud1 = (x, y) => tileset.setTile(x, y, 4, 3);
	const setCloud2 = (x, y) =>
		[0, 1].forEach((v) => tileset.setTile(x + v, y, 5 + v, 3));
	const setCloud3 = (x, y) =>
		[0, 1, 2].forEach((v) => tileset.setTile(x + v, y, 4 + v, 4));

	setCloud1(7, 1);
	setCloud1(14, 2);

	setCloud2(4, 3);
	setCloud2(9, 7);
	setCloud2(0, 8);

	setCloud3(5, 5);
	setCloud3(15, 6);
	setCloud3(-1, 2);

	const filterWithinGridBounds = filterWithinBounds(
		[0, 0],
		[grid.columns, grid.rows],
	);
	for (let y = 0; y < grid.rows; ++y) {
		for (let x = 0; x < grid.columns; ++x) {
			const pos = [x, y];

			if (grid.getTile(...pos) === 0) continue;

			const val = cardinalNorms
				.map(mapByOffset(pos))
				.filter(filterWithinGridBounds)
				.filter((pos) => grid.getTile(...pos))
				.map(mapFindOffset(pos))
				.map((offset) => normToBitFlagMap.get(hashTuple(offset)))
				.reduce(reduceBitFlags, 0);

			setTile(tileset, x, y, val);
		}
	}

	return tileset;
};

Object.prototype.definePropertyUnwriteable = (
	obj,
	prop,
	value,
	descriptor = {},
) => {
	Object.defineProperty(obj, prop, {
		...descriptor,
		value,
		writeable: false,
	});
};

class Game {
	constructor(id) {
		this.focus = false;

		this.sceneStack = [];

		this.backgroundColor = '#323232';

		this.canvas = document.querySelector(`canvas#${id}`);
		if (this.canvas === null) {
			console.error(`No canvas with id "${id}" was able to be found`);
			return;
		}

		this.ctx = this.canvas.getContext('2d', {
			alpha: false,
		});

		// TODO(bret): Might also want to listen for styling changes to the canvas element
		const computeCanvasSize = (canvas) => {
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

			const isBorderBox =
				canvasComputedStyle['box-sizing'] === 'border-box';
			if (isBorderBox) {
				width -= 2 * (borderLeft + paddingLeft);
				height -= 2 * (borderTop + paddingTop);
			}

			Object.definePropertyUnwriteable(canvas, '_actualWidth', width);
			Object.definePropertyUnwriteable(canvas, '_actualHeight', height);

			Object.definePropertyUnwriteable(canvas, '_offsetX', paddingLeft);
			Object.definePropertyUnwriteable(canvas, '_offsetY', paddingTop);

			Object.definePropertyUnwriteable(
				canvas,
				'_scaleX',
				canvas._actualWidth / canvas.width,
			);
			Object.definePropertyUnwriteable(
				canvas,
				'_scaleY',
				canvas._actualHeight / canvas.height,
			);
			Object.definePropertyUnwriteable(canvas, '_scale', canvas._scaleX);
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
		this.mainLoop = (time) => {
			this.frameRequestId = requestAnimationFrame(this.mainLoop);

			deltaTime += time - this._lastFrame;
			this._lastFrame = time;

			deltaTime = Math.min(deltaTime, timestep * maxFrames + 0.01);

			while (deltaTime >= timestep) {
				this.update();
				this.input.update();
				deltaTime -= timestep;
			}

			this.render();
		};

		this.eventListeners = [];

		window.addEventListener('resize', (e) => {
			computeCanvasSize(this.canvas);
		});

		// TODO(bret): Is the below TODO already done?
		// TODO(bret): We should have an event sent out to the game to let it know that the window just regained focus :)
		// Maybe add something like that for when the canvas regains focus, too?
		window.addEventListener('blur', (e) => this.onFocus(false));

		this.canvas.addEventListener('focus', (e) => this.onFocus(true));
		this.canvas.addEventListener('blur', (e) => this.onFocus(false));
	}

	get width() {
		return this.canvas.width;
	}

	get height() {
		return this.canvas.height;
	}

	get currentScenes() {
		return this.sceneStack[0];
	}

	addEventListener(element, type, listener, options) {
		const eventListener = {
			element,
			arguments: [type, listener, options],
		};

		element.addEventListener(...eventListener.arguments);

		this.eventListeners.push(eventListener);
	}

	// TODO(bret): Also perhaps do this on page/browser focus lost?
	onFocus(focus) {
		this.focus = focus;

		if (focus === true) {
			this._lastFrame = performance.now();
			this.frameRequestId = requestAnimationFrame(this.mainLoop);

			const onMouseDown = (e) => this.input.onMouseDown(e);
			const onMouseUp = (e) => this.input.onMouseUp(e);
			const onMouseMove = (e) => this.input.onMouseMove(e);
			const onKeyDown = (e) => this.input.onKeyDown(e);
			const onKeyUp = (e) => this.input.onKeyUp(e);

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
		} else {
			this.render();
			cancelAnimationFrame(this.frameRequestId);
			this.input.clear();

			this.eventListeners.forEach((eventListener) => {
				const { element } = eventListener;
				element.removeEventListener(...eventListener.arguments);
			});
			this.eventListeners = [];
		}
	}

	pushScene(scene) {
		this.pushScenes(scene);
	}

	pushScenes(...scenes) {
		this.sceneStack.push(scenes);
		scenes.forEach((scene) => {
			scene.engine = this;
		});
	}

	update() {
		this.currentScenes?.forEach((scene) => scene.update(this.input));
	}

	render() {
		const { canvas, ctx } = this;

		if (ctx === undefined) return;

		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, 640, 360);

		this.currentScenes?.forEach((scene) => scene.render(this.ctx));

		// Splitscreen
		if (this.sceneStack[0]?.length === 2) {
			ctx.strokeStyle = '#323232';
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(canvas.width / 2, 0.5);
			ctx.lineTo(canvas.width / 2, 360.5);
			ctx.stroke();
		}

		if (this.focus === false) {
			ctx.fillStyle = 'rgba(32, 32, 32, 0.5)';
			ctx.fillRect(0, 0, 640, 360);
		}
	}
}

class Input {
	constructor(engine) {
		this.engine = engine;

		this.mouse = {
			pos: [-1, -1],
			realPos: [-1, -1],
			_clicked: 0,
		};

		const defineXYProperties = (mouse, prefix = null) => {
			const posName = prefix !== null ? `${prefix}Pos` : 'pos';
			const xName = prefix !== null ? `${prefix}X` : 'x';
			const yName = prefix !== null ? `${prefix}Y` : 'y';

			[xName, yName].forEach((coordName, i) => {
				Object.defineProperties(mouse, {
					[coordName]: {
						get() {
							return mouse[posName][i];
						},
						set(val) {
							mouse[posName][i] = val;
						},
					},
				});
			});
		};

		defineXYProperties(this.mouse);
		defineXYProperties(this.mouse, 'real');

		this.keys = Array.from({ length: 128 }, (v) => 0);
	}

	update() {
		this.mouse._clicked &= ~1;
		for (let k = 0, n = this.keys.length; k < n; ++k) {
			this.keys[k] &= ~1;
		}
	}

	// Events
	onMouseMove(e) {
		const { canvas } = this.engine;

		this.mouse.realX = e.offsetX - canvas._offsetX;
		this.mouse.realY = e.offsetY - canvas._offsetY;

		this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
		this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
	}

	onMouseDown(e) {
		// TODO(bret): Do we want these to work even if the user clicks outside of the canvas?
		if (this.engine.focus === false) return true;

		e.preventDefault();
		if (this.mouseCheck() === false) {
			this.mouse._clicked = 3;
		}

		return false;
	}

	onMouseUp(e) {
		// TODO(bret): Do we want these to work even if the user clicks outside of the canvas?
		if (this.engine.focus === false) return true;

		e.preventDefault();
		if (this.mouseCheck() === true) {
			this.mouse._clicked = 1;
		}

		return false;
	}

	onKeyDown(e) {
		if (this.engine.focus === false) return true;

		e.preventDefault();
		if (this.keyCodeCheck(e.keyCode) === false) {
			this.keys[e.keyCode] = 3;
		}

		return false;
	}

	onKeyUp(e) {
		if (this.engine.focus === false) return true;

		e.preventDefault();
		if (this.keyCodeCheck(e.keyCode) === true) {
			this.keys[e.keyCode] = 1;
		}

		return false;
	}

	// Checks
	_checkPressed(value) {
		return value === 3;
	}

	_checkHeld(value) {
		return (value & 2) > 0;
	}

	_checkReleased(value) {
		return value === 1;
	}

	mousePressed() {
		return this._checkPressed(this.mouse._clicked);
	}

	mouseCheck() {
		return this._checkHeld(this.mouse._clicked);
	}

	mouseReleased() {
		return this._checkReleased(this.mouse._clicked);
	}

	keyCodePressed(key) {
		if (Array.isArray(key))
			return key.some((k) => this.keyCodePressed(k) === true);
		return this._checkPressed(this.keys[key]);
	}

	keyCodeCheck(key) {
		if (Array.isArray(key))
			return key.some((k) => this.keyCodeCheck(k) === true);
		return this._checkHeld(this.keys[key]);
	}

	keyCodeReleased(key) {
		if (Array.isArray(key))
			return key.some((k) => this.keyCodeReleased(k) === true);
		return this._checkReleased(this.keys[key]);
	}

	clear() {
		this.keys = this.keys.map((v) => 0);
	}
}

class Camera extends Array {
	constructor(x, y) {
		super();
		this.push(x, y);
	}

	get x() {
		return this[0];
	}
	set x(val) {
		this[0] = val;
	}

	get y() {
		return this[1];
	}
	set y(val) {
		this[1] = val;
	}
}

const updateCamera = (scene, player) => {
	const newX = player.x + player.width / 2 - scene.canvas.width / 2;
	scene.camera.x = Math.clamp(newX, 0, scene.width - scene.canvas.width);
};

class Scene {
	constructor() {
		this.engine = null;

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
	setCanvasSize(width, height) {
		const canvas = (this.canvas = document.createElement('canvas'));
		const ctx = (this.ctx = canvas.getContext('2d'));
		canvas.width = width;
		canvas.height = height;
	}

	addEntity(entity) {
		entity.scene = this;
		this.entities.push(entity);
		return entity;
	}

	update(input) {
		if (this.allowRefresh === true && input.keyCodePressed(116) === true)
			location.reload();

		if (this.escapeToBlur === true && input.keyCodePressed(27) === true)
			this.engine.canvas.blur();

		if (this.shouldUpdate === false) return;

		this.entities.forEach((entity) => entity.update(input));
		// this.renderables = this.renderables.filter(e => e).sort();
	}

	render(ctx) {
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

class LineSegmentScene extends Scene {
	constructor() {
		super();

		this.origin = [0, 0];
		this.target = [0, 0];

		const shapes = [
			[
				[0, 16],
				[0, 191],
				[319, 191],
				[319, 16],
				[304, 16],
				[304, 96],
				[272, 96],
				[272, 160],
				[255, 160],
				[255, 128],
				[240, 128],
				[240, 160],
				[191, 160],
				[191, 144],
				[128, 144],
				[128, 160],
				[15, 160],
				[15, 95],
				[31, 95],
				[31, 64],
				[15, 64],
				[15, 16],
			],
			[
				[64, 16],
				[64, 47],
				[79, 47],
				[79, 16],
			],
			[
				[240, 16],
				[240, 31],
				[255, 31],
				[255, 16],
			],
			[
				[144, 48],
				[144, 80],
				[128, 80],
				[128, 95],
				[144, 95],
				[144, 111],
				[207, 111],
				[207, 95],
				[223, 95],
				[223, 80],
				[207, 80],
				[207, 48],
			],
			[
				[159, 79],
				[159, 96],
				[192, 96],
				[192, 79],
			],
			[
				[64, 112],
				[64, 143],
				[95, 143],
				[95, 112],
			],
		];

		this.shapes = shapes;

		this.square = shapes[shapes.length - 1];
		this.innerSquare = shapes[shapes.length - 2];

		this.windingPoint = v2zero;
		this.windingPointInsideShape = false;

		this.points = shapes.flat();

		this.lines = shapes.flatMap((shape) => {
			return shape.map((point, i, arr) => [
				point,
				arr[(i + 1) % arr.length],
			]);
		});

		this.intersecting = this.lines.map((line) => false);
		this.intersections = this.lines.map((line) => null);
	}

	update(input) {
		super.update(input);

		const { mouse } = input;

		const record = input.mousePressed();

		if (record === true) console.time('intersection');
		this.target = [...mouse.pos];

		this.intersecting = this.lines.map((line) => {
			return checkLineSegmentIntersection(
				[this.origin, this.target],
				line,
			);
		});

		this.intersections = this.lines.map((line) => {
			return getLineSegmentIntersection([this.origin, this.target], line);
		});
		if (record === true) console.timeEnd('intersection');

		if (input.mousePressed()) {
			console.time('winding');
			this.windingPoint = [...mouse.pos];

			const shapesInside = this.shapes.filter((shape) =>
				isPointInsidePath(this.windingPoint, shape),
			);

			if (shapesInside.length % 2 === 1) {
				this.windingPointInsideShape = true;
			} else {
				// Whether or not we're overlapping any edges
				this.windingPointInsideShape = this.shapes.some((shape) =>
					shape.some((vertex, i, arr) => {
						return isPointOnLine(
							this.windingPoint,
							vertex,
							arr[(i + 1) % arr.length],
						);
					}),
				);
			}

			console.timeEnd('winding');
		}
	}

	render(ctx) {
		ctx.lineWidth = 1;

		const correction = [0.5, 0.5];

		this.lines.forEach((line, i) => {
			ctx.strokeStyle = this.intersecting[i] ? 'red' : 'white';

			ctx.beginPath();
			ctx.moveTo(...addPos(line[0], correction));
			ctx.lineTo(...addPos(line[1], correction));
			ctx.closePath();
			ctx.stroke();
		});

		const inside = this.intersecting.filter((v) => v).length % 2 === 1;
		ctx.strokeStyle = inside ? 'lime' : 'white';

		ctx.beginPath();
		ctx.moveTo(...addPos(this.origin, correction));
		ctx.lineTo(...addPos(this.target, correction));
		ctx.closePath();
		ctx.stroke();

		this.intersections.forEach((i) => {
			if (i !== null) {
				ctx.strokeStyle = 'lime';
				ctx.beginPath();
				ctx.arc(...addPos(i, correction), 5, 0, 2 * Math.PI);
				ctx.closePath();
				ctx.stroke();
			}
		});

		const pointColor = this.windingPointInsideShape ? '#00E0A7' : '#FF2C55';
		ctx.fillStyle = pointColor;
		ctx.beginPath();
		ctx.arc(...addPos(this.windingPoint, correction), 0.5, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();

		if (true) {
			ctx.strokeStyle = pointColor;
			ctx.beginPath();
			ctx.arc(
				...addPos(this.windingPoint, correction),
				8,
				0,
				2 * Math.PI,
			);
			ctx.closePath();
			ctx.stroke();
		}
	}
}

class ContourTracingScene extends Scene {
	constructor() {
		super();

		this.columns = 20;
		this.rows = 12;

		this.tileW = 16;
		this.tileH = 16;

		// prettier-ignore
		this.gridData = [
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1,
			1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1,
			1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1,
			1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
			1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
			1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1,
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		];

		this.crawler = {
			pos: [0, 0],
			dir: dirND,
		};

		this.polygons = findAllPolygonsInGrid(
			this.gridData,
			this.columns,
			this.rows,
		);

		this.timer = 0;
		this.timeout = 60;
	}

	update(input) {
		super.update(input);

		if (++this.timer < this.timeout) return;
		this.timer = 0;

		// Do shit
		console.log('y0oooo');
	}

	isSolidAt(x, y) {
		return this.gridData[y * this.columns + x] > 0;
	}

	render(ctx) {
		ctx.strokeStyle = 'gray';

		const correction = [0.5, 0.5];

		for (let y = 0; y < this.rows; ++y) {
			let yy = y * this.tileH + 0.5;
			drawLine(ctx, 0.5, yy, this.columns * this.tileW + 0.5, yy);
			yy += this.tileH - 1;
			drawLine(ctx, 0.5, yy, this.columns * this.tileW + 0.5, yy);
		}

		for (let x = 0; x < this.columns; ++x) {
			let xx = x * this.tileW + 0.5;
			drawLine(ctx, xx, 0.5, xx, this.rows * this.tileH + 0.5);
			xx += this.tileW - 1;
			drawLine(ctx, xx, 0, xx, this.rows * this.tileH);
		}

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.isSolidAt(x, y)) {
					ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
					ctx.fillRect(
						x * this.tileW + 0.5,
						y * this.tileH + 0.5,
						this.tileW - 1,
						this.tileH - 1,
					);
				} else if (false) {
					// ctx.strokeStyle = 'gray';
				}
			}
		}

		this.polygons.forEach((polygon) => {
			ctx.beginPath();
			ctx.strokeStyle = 'red';
			ctx.moveTo(
				...subPos(addPos(polygon.points[0], [0.5, 0.5]), this.camera),
			);
			polygon.points
				.slice(1)
				.map((p) => subPos(p, this.camera))
				.forEach(([x, y]) => {
					ctx.lineTo(x + 0.5, y + 0.5);
				});
			ctx.closePath();
			ctx.stroke();
		});
	}
}

class PlayerScene extends Scene {
	constructor(Player) {
		super();

		// this.player = this.addEntity(new Player(160, 120));
		this.player = this.addEntity(new Player(160 + 100, 120));

		this.grid = Grid.fromBitmap('grid.bmp', 16, 16);
		// this.grid = Grid.fromBinary([
		// 	20,
		// 	12,
		// 	2048,
		// 	25165848,
		// 	125943928,
		// 	470598016,
		// 	2021179399,
		// 	2348906511,
		// 	402653183,
		// 	4294901760
		// ], 16, 16);
		this.width = this.grid.width;
		this.height = this.grid.height;

		this.boundsX = [0, this.width];

		this.tileset = initTileset(this.grid);
		this.gridOutline = new GridOutline();
		this.gridOutline.computeOutline(this.grid);

		this.renderables.push(this.tileset);
		// this.renderables.push(this.grid);
		this.renderables.push(this.gridOutline);
		this.renderables.push(this.player);
	}

	setCanvasSize(width, height) {
		super.setCanvasSize(width, height);

		updateCamera(this, this.player);
	}

	update(input) {
		super.update(input);

		updateCamera(this, this.player);
	}
}

class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;

		this.scene = null;

		this.facing = 1;

		this.xspeed = 0;
		this.xRemainder = 0;
		this.yspeed = 0;
		this.yRemainder = 0;

		this.width = 12;
		this.height = 16;

		this.aspeed = 0.05; // acceleration
		this.fspeed = 0.05; // friction

		this.mspeed = 2.5; // max speed
		this.gspeed = 0.12; // gravity
		this.jspeed = -3.95; // initial jump velocity

		this.image = assetManager.images.get('radiohead_spritesheet.png');

		this.coyote = 0;
		this.coyoteLimit = 6;

		this.jumpInput = 0;
		this.jumpInputLimit = 8;

		this.timer = 0;
		this.timeout = 5;
		this.frame = 0;
	}

	update(input) {
		const leftKeys = [37, 65];
		const rightKeys = [39, 68];
		const jumpKeys = [32, 38, 87, 90];

		const keyLeftCheck = input.keyCodeCheck(leftKeys);
		const keyRightCheck = input.keyCodeCheck(rightKeys);
		const keyJumpCheck = input.keyCodeCheck(jumpKeys);

		const keyJumpPressed = input.keyCodePressed(jumpKeys);

		const grounded = this.collide(this.x, this.y + 1);

		// See if the player is trying to move left or right
		const xdir = keyRightCheck - keyLeftCheck;
		this.facing = xdir || this.facing;

		if (this.coyote > 0) --this.coyote;
		if (this.jumpInput > 0) --this.jumpInput;

		// Either increase xspeed or apply friction
		if (xdir !== 0) {
			if (Math.sign(this.xspeed) === Math.sign(xdir)) {
				this.xspeed += this.aspeed * xdir;
			} else {
				this.xspeed += this.aspeed * xdir * 2;
			}
		} else {
			if (Math.abs(this.xspeed) < this.fspeed) {
				this.xspeed = 0;
			} else {
				this.xspeed -= this.fspeed * Math.sign(this.xspeed);
			}
		}

		// Make sure xspeed does not exceed mspeed;
		this.xspeed = Math.clamp(this.xspeed, -this.mspeed, this.mspeed);

		// See if we're on the ground
		if (grounded === true) {
			// Set coyote to the limit!
			this.coyote = this.coyoteLimit;
		}

		if (keyJumpPressed) {
			// Set jumpInput to the limit!
			this.jumpInput = this.jumpInputLimit;
		}

		// Try jumping
		if (this.coyote > 0 && this.jumpInput > 0) {
			this.yspeed = this.jspeed;
			this.coyote = 0;
			this.jumpInput = 0;
		}

		// Apply gravity
		this.yspeed += this.gspeed;

		// Variable jump height
		if (this.yspeed < 0 && !keyJumpCheck) this.yspeed += this.gspeed;

		// Actually move
		this.moveX();
		this.moveY();

		// Handle animation
		this.updateSprite(xdir);
	}

	moveX() {
		const grounded = this.collide(this.x, this.y + 1);
		const ledgeBoostHeights = Array.from({ length: 2 }, (_, i) => i + 1);

		this.xRemainder += this.xspeed;

		let moveX = Math.round(this.xRemainder);

		if (moveX !== 0) {
			this.xRemainder -= moveX;

			const sign = Math.sign(moveX);
			for (let xx = 0, n = Math.abs(moveX); xx < n; ++xx) {
				if (this.collide(this.x + sign, this.y)) {
					const yy =
						grounded === false &&
						this.yspeed >= 0 &&
						(ledgeBoostHeights.find(
							(y) => !this.collide(this.x + sign, this.y - y),
						) ??
							false);

					if (yy === false) {
						moveX = 0;
						this.xspeed =
							Math.min(Math.abs(this.xspeed), 1.0) * sign;
						this.xRemainder = 0;
						break;
					}

					this.y -= yy;
				}

				this.x += sign;
			}
		}
	}

	moveY() {
		this.yRemainder += this.yspeed;
		let moveY = Math.round(this.yRemainder);

		if (moveY !== 0) {
			this.yRemainder -= moveY;

			const sign = Math.sign(moveY);
			for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
				if (this.collide(this.x, this.y + sign)) {
					moveY = 0;
					this.yspeed = 0;
				} else {
					this.y += sign;
				}
			}
		}
	}

	// TODO(bret): See if you could write this functionally :)
	collide(_x, _y) {
		const { width: w, height: h, scene } = this;

		const { grid } = scene;

		const x = Math.round(_x);
		const y = Math.round(_y);

		// TODO(bret): Should this exist as part of the Scene, or part of the grid?
		if (
			scene.boundsX !== null &&
			(x < scene.boundsX[0] || x + w > scene.boundsX[1])
		)
			return true;

		if (
			scene.boundsY !== null &&
			(y < scene.boundsY[0] || y + h > scene.boundsY[1])
		)
			return true;

		const minX = Math.clamp(
			Math.floor(x / grid.tileW),
			0,
			grid.columns - 1,
		);
		const minY = Math.clamp(Math.floor(y / grid.tileH), 0, grid.rows - 1);

		const maxX = Math.clamp(
			Math.floor((x + w - 1) / grid.tileW),
			0,
			grid.columns - 1,
		);
		const maxY = Math.clamp(
			Math.floor((y + h - 1) / grid.tileH),
			0,
			grid.rows - 1,
		);

		for (let yy = minY; yy <= maxY; ++yy) {
			for (let xx = minX; xx <= maxX; ++xx) {
				if (grid.getTile(xx, yy) === 1) {
					return true;
				}
			}
		}

		return false;
	}

	updateSprite(xdir) {
		const numFrames = 4;
		if (xdir !== 0 || this.xspeed !== 0) {
			this.timer += Math.abs(this.xspeed * 0.5);
			if (this.timer >= this.timeout) {
				this.timer = 0;
				this.frame = (this.frame + 1) % numFrames;
			}
		} else {
			this.frame = 0;
			this.timer = this.timeout - 1;
		}
	}

	render(ctx, camera = v2zero) {
		const flipped = this.facing === -1;
		const scaleX = flipped ? -1 : 1;

		const [cameraX, cameraY] = camera;

		const drawX = this.x - cameraX;
		const drawY = this.y - cameraY;

		const drawW = this.image.width / 4;
		const drawH = this.image.height;

		const offsetX = -10;

		if (flipped) {
			ctx.save();
			ctx.scale(-1, 1);
		}

		ctx.drawImage(
			this.image,
			this.frame * 32,
			0,
			32,
			32,
			scaleX * (drawX + offsetX),
			drawY - 11,
			scaleX * drawW,
			drawH,
		);

		if (flipped) ctx.restore();

		const drawHitbox = false;
		if (drawHitbox === true) {
			ctx.strokeStyle = 'red';
			ctx.strokeRect(
				drawX + 0.5,
				drawY + 0.5,
				this.width - 1,
				this.height - 1,
			);
		}
	}
}

// TODO(bret): Rounded rectangle https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas

const drawLine = (ctx, x1, y1, x2, y2) => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
};

const pixelCanvas = document.createElement('canvas');
const pixelCtx = pixelCanvas.getContext('2d');
class Grid {
	constructor(width, height, tileW, tileH) {
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

	static fromBitmap(src, tileW, tileH) {
		const image = assetManager.images.get(src);

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

	static fromBinary(data, tileW, tileH) {
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

	forEach(callback) {
		const stride = this.columns;
		this.data
			.map((val, i) => [val, indexToPos(i, stride)])
			.forEach((args) => callback(...args));
	}

	inBounds(x, y) {
		return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
	}

	setTile(x, y, value) {
		if (this.inBounds(x, y) === false) return;
		this.data[y * this.columns + x] = value;
	}

	getTile(x, y) {
		if (this.inBounds(x, y) === false) return 0;
		return this.data[y * this.columns + x];
	}

	renderOutline(ctx, camera) {
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

	renderEachCell(ctx, camera, fill = false) {
		const stride = this.columns;
		const width = this.tileW - +!fill;
		const height = this.tileH - +!fill;

		const [cameraX, cameraY] = camera;

		if (fill === true) ctx.fillStyle = this.color;
		else ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		const drawRect = (...args) =>
			fill === true ? ctx.fillRect(...args) : ctx.strokeRect(...args);

		const offset = fill === true ? 0 : 0.5;

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

	render(ctx, camera = v2zero) {
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
const rotateNormBy45Deg = (curDir, dir) => {
	const norms = cardinalNorms; // .flatMap(v => [v, v]);
	const index = cardinalNorms.indexOf(curDir);
	if (index === -1) {
		console.error('rotateNormBy45Deg expects a norm array');
		return curDir;
	}

	const n = cardinalNorms.length;
	return cardinalNorms[(index - dir + n) % n];
};

const rotateNormBy90Deg = (curDir, dir) => rotateNormBy45Deg(curDir, 2 * dir);

const findAllPolygonsInGrid = (_grid, _columns, _rows) => {
	let grid = _grid,
		columns = _columns,
		rows = _rows;
	if (grid instanceof Grid) {
		({ data: grid, columns, rows } = grid);
	}

	const polygons = [];

	const offsets = {
		[normNU]: [normRU, normNU],
		[normND]: [normLD, normND],
		[normRN]: [normRD, normRN],
		[normLN]: [normLU, normLN],
	};

	const shapes = findAllShapesInGrid(grid, columns, rows);
	shapes.forEach((shape) => {
		const first = [...shape.shapeCells[0]];

		const { gridType } = shape;

		let curDir = normND;
		let lastDir = curDir;

		const points = [];
		const polygon = { points };
		polygons.push(polygon);

		const addPointToPolygon = (points, pos, interior) => {
			const origin = interior ? 0 : -1;
			const size = 16;
			const m1 = size - 1;
			const basePos = scalePos(pos, size);

			const [lastX, lastY] = points.length
				? subPos(points[points.length - 1], basePos)
				: [origin, origin];

			const offset = [0, 0];
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

			points.push(addPos(basePos, offset));
		};

		addPointToPolygon(points, first, gridType === 1);

		let next = first;
		const firstHash = hashTuple(first);
		for (;;) {
			const [p1, p2] = offsets[curDir]
				.map((o) => addPos(next, o))
				.map((p) => {
					return isWithinBounds(p, v2zero, [columns, rows])
						? grid[posToIndex(p, columns)]
						: 0;
				});

			if (p2 === gridType) {
				if (p1 === gridType) {
					next = addPos(next, curDir);
					curDir = rotateNormBy90Deg(curDir, 1);
				}

				next = addPos(next, curDir);

				if (lastDir !== curDir)
					addPointToPolygon(points, next, gridType === 1);
			} else {
				curDir = rotateNormBy90Deg(curDir, -1);
				addPointToPolygon(points, next, gridType === 1);
			}

			lastDir = curDir;

			if (curDir === normND && hashTuple(next) === firstHash) break;
		}
	});

	return polygons;
};

const findAllShapesInGrid = (_grid, _columns, _rows) => {
	let grid = _grid,
		columns = _columns,
		rows = _rows;
	if (grid instanceof Grid) {
		({ data: grid, columns, rows } = grid);
	}

	const shapes = [];
	const checked = Array.from({ length: columns * rows }).map((v) => false);

	let nextIndex;
	while ((nextIndex = checked.findIndex((v) => v === false)) > -1) {
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

const fillShape = (start, checked, _grid, _columns, _rows) => {
	let grid = _grid,
		columns = _columns,
		rows = _rows;
	if (grid instanceof Grid) {
		({ data: grid, columns, rows } = grid);
	}

	const stride = columns;

	const gridType = grid[posToIndex(start, columns)];

	const queue = [start];
	const visited = [];

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

	const shapeCells = visited.map((v) => v.split(',').map((c) => +c));

	const shape = shapeCells.reduce(
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
		...shape,
		gridType,
		shapeCells,
	};
};

class GridOutline {
	constructor() {
		this.grid = null;
		this.polygons = [];
		this.show = true;

		this.renderOutline = true;
		this.outlineColor = 'red';

		this.renderPoints = true;
		this.pointsColor = 'red';
	}

	computeOutline(grid) {
		this.grid = grid;
		this.polygons = findAllPolygonsInGrid(grid);
	}

	render(ctx, camera = v2zero) {
		if (this.show === false) return;

		// Draw edges
		if (this.renderOutline === true) {
			this.polygons.forEach((polygon) => {
				ctx.beginPath();
				ctx.strokeStyle = this.outlineColor;
				ctx.moveTo(
					...subPos(addPos(polygon.points[0], [0.5, 0.5]), camera),
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
		if (this.renderPoints === true) {
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

class Tileset {
	constructor(width, height, tileW, tileH) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);

		this.image = assetManager.images.get('tileset.png');

		this.data = Array.from(
			{ length: this.columns * this.rows },
			(v) => null,
		);

		this.startX = 1;
		this.startY = 1;
		this.separation = 1;
	}

	setTile(x, y, tileX, tileY) {
		// TODO(bret): Make sure it's within the bounds
		this.data[y * this.columns + x] = [tileX, tileY];
	}

	render(ctx, camera = v2zero) {
		const scale = 1;

		const { image, separation, startX, startY, tileW, tileH } = this;

		const srcCols = Math.floor(this.image.width / tileW);
		const srcRows = Math.floor(this.image.height / tileH);

		const [cameraX, cameraY] = camera;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				const val = this.data[y * this.columns + x];
				if (val !== null) {
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

let assetManager;
const initGames = () => {
	const game1 = new Game('basic');
	// const game2 = new Game('second');
	const lineSegmentGame = new Game('line-segment');
	const contourTracingGame = new Game('contour-tracing');
	const games = [game1];

	assetManager = new AssetManager('img/');
	assetManager.addImage('grid.bmp');
	assetManager.addImage('radiohead_spritesheet.png');
	assetManager.addImage('tileset.png');
	assetManager.onLoad(() => {
		console.log('== AssetManager::onLoad()');

		const splitScreen = true;

		games.forEach((game) => {
			game.backgroundColor = '#87E1A3';

			const sceneWidth = game.canvas.width / 2;

			const sceneLeft = new PlayerScene(Player);
			sceneLeft.player.x = 40;
			if (splitScreen === true) {
				sceneLeft.setCanvasSize(sceneWidth, game.canvas.height);
			} else {
				sceneLeft.setCanvasSize(game.canvas.width, game.canvas.height);
			}

			if (splitScreen === true) {
				const sceneRight = new PlayerScene(Player);
				sceneRight.screenPos[0] = sceneWidth;
				sceneRight.setCanvasSize(sceneWidth, game.canvas.height);
				sceneRight.shouldUpdate = false;

				game.pushScenes(sceneLeft, sceneRight);
			} else {
				game.pushScenes(sceneLeft);
			}

			game.render();
		});

		if (true) {
			const lineSegmentScene = new LineSegmentScene();
			lineSegmentGame.pushScenes(lineSegmentScene);
			lineSegmentGame.render();
		}

		if (true) {
			const contourTracingScene = new ContourTracingScene();
			contourTracingGame.pushScenes(contourTracingScene);
			contourTracingGame.render();
		}
	});
	assetManager.loadAssets();
};
