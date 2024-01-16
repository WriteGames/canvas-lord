"use strict";
const hashTuple = (pos) => pos.join(',');
const _tupleMap = new Map();
const Tuple = (...args) => {
    const hash = hashTuple(args);
    if (!_tupleMap.has(hash)) {
        const tuple = Object.freeze(args);
        _tupleMap.set(hash, tuple);
    }
    return _tupleMap.get(hash);
};
// NOTE: This should be able to infer the return type...
Math.clamp = (val, min, max) => {
    if (val < min)
        return min;
    if (val > max)
        return max;
    return val;
};
const EPSILON = 0.000001;
const reduceSum = (acc, v) => acc + v;
const reduceProduct = (acc, v) => acc * v;
const distance = (...dimensions) => Math.abs(Math.sqrt(dimensions.map((d) => d * d).reduce(reduceSum, 0)));
const distanceSq = (...dimensions) => Math.abs(dimensions.map((d) => d * d).reduce(reduceSum, 0));
const isDefined = (v) => Boolean(v);
const interlaceArrays = (a, b) => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);
const compareTuple = (a, b) => hashTuple(a) === hashTuple(b);
const indexToPos = (index, stride) => [
    index % stride,
    Math.floor(index / stride),
];
const posToIndex = ([x, y], stride) => y * stride + x;
const posEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const addPos = (a, b) => {
    return Tuple(...a.map((v, i) => v + (b[i] ?? 0)));
};
const subPos = (a, b) => {
    return Tuple(...a.map((v, i) => v - (b[i] ?? 0)));
};
const scalePos = (p, s) => {
    return Tuple(...p.map((v) => v * s));
};
const mapByOffset = (offset) => {
    return (pos) => addPos(offset, pos);
};
const mapFindOffset = (origin) => {
    return (pos) => subPos(pos, origin);
};
const flatMapByOffsets = (offsets) => {
    return (pos) => offsets.map((offset) => addPos(offset, pos));
};
const posDistance = (a, b) => distance(...subPos(b, a));
const posDistanceSq = (a, b) => distanceSq(...subPos(b, a));
// const pathToSegments = (path) =>
// 	path.map((vertex, i, vertices) => [
// 		vertex,
// 		vertices[(i + 1) % vertices.length],
// 	]);
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
const isPointOnLine = (point, a, b) => Math.abs(posDistance(a, point) + posDistance(point, b) - posDistance(a, b)) < EPSILON;
// TODO(bret): Would be fun to make this work with any dimensions
const isWithinBounds = ([x, y], [x1, y1], [x2, y2]) => x >= x1 && y >= y1 && x < x2 && y < y2;
const filterWithinBounds = (a, b) => (pos) => a.every((p, i) => (pos[i] ?? -Infinity) >= p) &&
    b.every((p, i) => (pos[i] ?? Infinity) < p);
const isPointInsidePath = (point, path) => {
    const wind = path
        .map((vertex) => getAngle(point, vertex))
        .map((angle, i, arr) => getAngleBetween(angle, arr[(i + 1) % arr.length]))
        .reduce(reduceSum, 0);
    return Math.abs(wind) > EPSILON;
};
const v2zero = Tuple(0, 0);
const v2one = Tuple(1, 1);
const createBitEnum = (..._names) => {
    const names = _names.flat();
    const bitEnumObj = {};
    names.forEach((name, i) => {
        const val = 1 << i;
        bitEnumObj[i] = val;
        bitEnumObj[name.toUpperCase()] = val;
    });
    return bitEnumObj;
};
const dirNN = 0;
const [dirRN, dirNU, dirLN, dirND] = Object.freeze(Array.from({ length: 4 }).map((_, i) => 1 << i));
// prettier-ignore
const [dirLU, dirRU, dirLD, dirRD,] = [
    dirLN | dirNU, dirRN | dirNU,
    dirLN | dirND, dirRN | dirND,
];
const createNorm = (norm) => {
    return Tuple(...norm);
};
// prettier-ignore
const [normLU, normNU, normRU, normLN, normNN, normRN, normLD, normND, normRD,] = [
    Tuple(-1, -1),
    Tuple(0, -1),
    Tuple(1, -1),
    Tuple(-1, 0),
    Tuple(0, 0),
    Tuple(1, 0),
    Tuple(-1, 1),
    Tuple(0, 1),
    Tuple(1, 1),
];
const orthogonalNorms = [normRN, normNU, normLN, normND];
const diagonalNorms = [normRU, normLU, normLD, normRD];
const cardinalNorms = interlaceArrays(orthogonalNorms, diagonalNorms);
// Starts right, goes counter-clockwise
const reduceBitFlags = (acc, val) => acc | val;
const cardinalNormStrs = [
    'RN',
    'RU',
    'NU',
    'LU',
    'LN',
    'LD',
    'ND',
    'RD',
];
const CARDINAL_NORM = createBitEnum(...cardinalNormStrs);
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
    [normRD, CARDINAL_NORM.RD],
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(dir, bitFlag));
const orTogetherCardinalDirs = (...dirs) => dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);
const globalSetTile = (tileset, x, y, bitFlag) => {
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
        image.onload = () => {
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
                this.onLoadCallbacks.forEach((callback) => callback(src));
            });
        }
    }
    onLoad(callback) {
        this.onLoadCallbacks.push(callback);
    }
}
const defineUnwritableProperty = (obj, prop, value, attributes = {}) => Object.defineProperty(obj, prop, {
    ...attributes,
    value,
    writable: false,
});
// TODO(bret): 'tabblur', 'tabfocus'
const gameEvents = ['blur', 'focus', 'update'];
class Game {
    gameLoopSettings = {
        update: 'focus',
        render: 'onUpdate',
    };
    constructor(id, gameLoopSettings) {
        const canvas = document.querySelector(`canvas#${id}`);
        if (canvas === null) {
            console.error(`No canvas with id "${id}" was able to be found`);
            return;
        }
        const ctx = canvas.getContext('2d', {
            alpha: false,
        });
        if (ctx === null) {
            console.error(`Context was not able to be created from canvas "#${id}"`);
            return;
        }
        this.canvas = canvas;
        this.ctx = ctx;
        this.focus = false;
        this.listeners = gameEvents.reduce((acc, val) => {
            acc[val] = new Set();
            return acc;
        }, {});
        if (gameLoopSettings)
            this.gameLoopSettings = gameLoopSettings;
        this.sceneStack = [];
        this.backgroundColor = '#323232';
        // TODO(bret): Might also want to listen for styling changes to the canvas element
        const computeCanvasSize = (canvas) => {
            const canvasComputedStyle = getComputedStyle(canvas);
            let width = parseInt(canvasComputedStyle.width, 10);
            let height = parseInt(canvasComputedStyle.height, 10);
            const borderLeft = parseInt(canvasComputedStyle.borderLeftWidth, 10);
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
            defineUnwritableProperty(canvas, '_scaleX', canvas._actualWidth / canvas.width);
            defineUnwritableProperty(canvas, '_scaleY', canvas._actualHeight / canvas.height);
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
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    get currentScenes() {
        return this.sceneStack[0];
    }
    // TODO(bret): We're going to need to make a less clunky interface
    updateGameLoopSettings(newGameLoopSettings) {
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
        this._onGameLoopSettingsUpdate = () => {
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
    addEventListener(element, ...rest) {
        const eventListener = {
            element,
            arguments: rest,
        };
        element.addEventListener(...eventListener.arguments);
        this.eventListeners.push(eventListener);
    }
    startMainLoop() {
        this._lastFrame = performance.now();
        this.frameRequestId = requestAnimationFrame(this.mainLoop);
        // TODO(bret): Do binding
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
    }
    killMainLoop() {
        cancelAnimationFrame(this.frameRequestId);
        this.input.clear();
        this.eventListeners.forEach((eventListener) => {
            const { element } = eventListener;
            element.removeEventListener(...eventListener.arguments);
        });
        this.eventListeners = [];
    }
    // TODO(bret): Also perhaps do this on page/browser focus lost?
    onFocus(focus) {
        this.focus = focus;
        this.sendEvent(focus ? 'focus' : 'blur');
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
        this.sendEvent('update');
    }
    sendEvent(event) {
        this.listeners[event].forEach((c) => c());
    }
    render() {
        const { canvas, ctx } = this;
        if (ctx === undefined)
            return;
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
];
class Input {
    constructor(engine) {
        this.engine = engine;
        const mouse = {
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
                            mouse[posName] = Object.freeze(mouse[posName].map((oldVal, index) => index === i ? val : oldVal));
                        },
                    },
                });
            });
        };
        defineXYProperties(mouse);
        defineXYProperties(mouse, 'real');
        this.mouse = mouse;
        this.clear();
    }
    update() {
        this.mouse._clicked &= ~1;
        _keys.forEach((key) => {
            this.keys[key] &= ~1;
        });
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
        e.preventDefault();
        if (!this.mouseCheck()) {
            this.mouse._clicked = 3;
        }
        return false;
    }
    onMouseUp(e) {
        e.preventDefault();
        if (this.mouseCheck()) {
            this.mouse._clicked = 1;
        }
        return false;
    }
    onKeyDown(e) {
        e.preventDefault();
        const { key } = e;
        if (!this.keyCheck(key)) {
            this.keys[key] = 3;
        }
        return false;
    }
    onKeyUp(e) {
        e.preventDefault();
        const { key } = e;
        if (this.keyCheck(key)) {
            this.keys[key] = 1;
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
    keyPressed(key) {
        if (Array.isArray(key))
            return key.some((k) => this.keyPressed(k));
        return this._checkPressed(this.keys[key]);
    }
    keyCheck(key) {
        if (Array.isArray(key))
            return key.some((k) => this.keyCheck(k));
        return this._checkHeld(this.keys[key]);
    }
    keyReleased(key) {
        if (Array.isArray(key))
            return key.some((k) => this.keyReleased(k));
        return this._checkReleased(this.keys[key]);
    }
    clear() {
        this.keys = _keys.reduce((acc, key) => {
            acc[key] = 0;
            return acc;
        }, {});
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
        const ctx = canvas.getContext('2d');
        if (ctx)
            this.ctx = ctx;
        canvas.width = width;
        canvas.height = height;
    }
    addEntity(entity) {
        entity.scene = this;
        this.entities.push(entity);
        return entity;
    }
    update(input) {
        if (this.engine === null) {
            throw new Error('Scene::engine is not defined');
            return;
        }
        if (this.allowRefresh && input.keyPressed('F5'))
            location.reload();
        if (this.escapeToBlur && input.keyPressed('Escape'))
            this.engine.canvas.blur();
        if (!this.shouldUpdate)
            return;
        this.entities.forEach((entity) => entity.update(input));
        // this.renderables = this.renderables.filter(e => e).sort();
    }
    render(ctx) {
        this.ctx.fillStyle = '#87E1A3';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderables.forEach((entity) => entity.render(this.ctx, this.camera));
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
const drawLine = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};
const pixelCanvas = document.createElement('canvas');
const _pixelCtx = pixelCanvas.getContext('2d');
if (!_pixelCtx) {
    throw Error('pixelCtx failed to create');
}
const pixelCtx = _pixelCtx;
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
    static fromBitmap(assetManager, src, tileW, tileH) {
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
        if (!this.inBounds(x, y))
            return;
        this.data[y * this.columns + x] = value;
    }
    getTile(x, y) {
        if (!this.inBounds(x, y))
            return 0;
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
        if (fill)
            ctx.fillStyle = this.color;
        else
            ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        const drawRect = (...args) => fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);
        const offset = fill ? 0 : 0.5;
        for (let y = 0; y < this.rows; ++y) {
            for (let x = 0; x < this.columns; ++x) {
                if (this.data[y * stride + x] === 1) {
                    drawRect(x * this.tileW + offset - cameraX, y * this.tileH + offset - cameraY, width, height);
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
const rotateNormBy45Deg = (curDir, turns) => {
    const norms = cardinalNorms; // .flatMap(v => [v, v]);
    const index = cardinalNorms.indexOf(curDir);
    if (index === -1) {
        console.error('rotateNormBy45Deg expects a norm array');
        return curDir;
    }
    const n = cardinalNorms.length;
    return cardinalNorms[(index - turns + n) % n];
};
// NOTE: The generic allows it to use V2's orthogonal or diagonal norm types, depending on the `curDir`
const rotateNormBy90Deg = (curDir, turns) => rotateNormBy45Deg(curDir, 2 * turns);
function getGridData(_grid, _columns, _rows) {
    if (_grid instanceof Grid) {
        const { data: grid, columns, rows } = _grid;
        return [grid, columns, rows];
    }
    return [_grid, _columns, _rows];
}
const findAllPolygonsInGrid = (_grid, _columns, _rows) => {
    const [grid, columns, rows] = getGridData(_grid, _columns, _rows);
    const polygons = [];
    const offsets = {
        [hashTuple(normNU)]: [normRU, normNU],
        [hashTuple(normND)]: [normLD, normND],
        [hashTuple(normRN)]: [normRD, normRN],
        [hashTuple(normLN)]: [normLU, normLN],
    };
    const shapes = findAllShapesInGrid(grid, columns, rows);
    shapes.forEach((shape) => {
        const [first] = shape.shapeCells;
        if (first === undefined)
            return;
        const { gridType } = shape;
        let curDir = normND;
        let lastDir = curDir;
        const points = [];
        const polygon = { points };
        polygons.push(polygon);
        const addPointsToPolygon = (points, pos, interior) => {
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
            points.push(addPos(basePos, Tuple(...offset)));
        };
        addPointsToPolygon(points, first, gridType === 1);
        for (let next = first, firstIter = true; firstIter || curDir !== normND || next !== first; firstIter = false) {
            const [p1, p2] = offsets[hashTuple(curDir)]
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
                    addPointsToPolygon(points, next, gridType === 1);
            }
            else {
                curDir = rotateNormBy90Deg(curDir, -1);
                addPointsToPolygon(points, next, gridType === 1);
            }
            lastDir = curDir;
            // if (curDir === normND && next === first) break;
        }
    });
    return polygons;
};
const findAllShapesInGrid = (_grid, _columns, _rows) => {
    const [grid, columns, rows] = getGridData(_grid, _columns, _rows);
    const shapes = [];
    const checked = Array.from({ length: columns * rows }, () => false);
    let nextIndex;
    while ((nextIndex = checked.findIndex((v) => !v)) > -1) {
        const shape = fillShape(indexToPos(nextIndex, columns), checked, grid, columns, rows);
        // Empty shapes must be enclosed
        if (shape.gridType === 0 &&
            (shape.minX === 0 ||
                shape.minY === 0 ||
                shape.maxX >= columns ||
                shape.maxY >= rows))
            continue;
        shapes.push(shape);
    }
    return shapes;
};
const fillShape = (start, checked, _grid, _columns, _rows) => {
    const [grid, columns, rows] = getGridData(_grid, _columns, _rows);
    const stride = columns;
    const gridType = grid[posToIndex(start, columns)];
    const queue = [start];
    const visited = [];
    let next;
    while ((next = queue.pop())) {
        const hash = hashTuple(next);
        if (visited.includes(hash))
            continue;
        const index = posToIndex(next, stride);
        visited.push(hash);
        if (grid[posToIndex(next, columns)] !== gridType)
            continue;
        checked[index] = true;
        const [x, y] = next;
        if (x > 0)
            queue.push([x - 1, y]);
        if (x < columns - 1)
            queue.push([x + 1, y]);
        if (y > 0)
            queue.push([x, y - 1]);
        if (y < rows - 1)
            queue.push([x, y + 1]);
    }
    const shapeCells = visited.map((v) => Tuple(...v.split(',').map((c) => +c)));
    const shapeBounds = shapeCells.reduce((acc, cell) => {
        const [x, y] = cell;
        return {
            minX: Math.min(x, acc.minX),
            maxX: Math.max(x, acc.maxX),
            minY: Math.min(y, acc.minY),
            maxY: Math.max(y, acc.maxY),
        };
    }, {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
    });
    return {
        ...shapeBounds,
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
        if (!this.show)
            return;
        // Draw edges
        if (this.renderOutline) {
            this.polygons.forEach((polygon) => {
                ctx.beginPath();
                ctx.strokeStyle = this.outlineColor;
                ctx.moveTo(...subPos(addPos(polygon.points[0], Tuple(0.5, 0.5)), camera));
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
class Tileset {
    constructor(image, width, height, tileW, tileH) {
        this.width = width;
        this.height = height;
        this.tileW = tileW;
        this.tileH = tileH;
        this.columns = Math.ceil(width / tileW);
        this.rows = Math.ceil(height / tileH);
        this.image = image;
        this.data = Array.from({ length: this.columns * this.rows }, (v) => null);
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
                if (val) {
                    const [tileX, tileY] = val;
                    const srcX = startX + (separation + tileW) * tileX;
                    const srcY = startY + (separation + tileH) * tileY;
                    const dstX = x * tileW - cameraX;
                    const dstY = y * tileH - cameraY;
                    ctx.drawImage(image, srcX, srcY, tileW, tileH, dstX, dstY, tileW * scale, tileH * scale);
                }
            }
        }
    }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
//# sourceMappingURL=canvas-lord.js.map