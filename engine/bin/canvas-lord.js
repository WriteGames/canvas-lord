/* eslint-disable @typescript-eslint/no-unused-vars -- until exports are set up, many of these items are not being used */
import { addPos, subPos, scalePos, posToIndex, indexToPos, hashPos, posEqual, Vec2, EPSILON, } from './util/math.js';
import { Grid } from './util/grid.js';
export { Draw } from './util/draw.js';
// TODO: only export these from math.js
export { V2, addPos, subPos, scalePos, EPSILON, } from './util/math.js';
export { Scene } from './util/scene.js';
export { Camera } from './util/camera.js';
export * as Collision from './util/collision.js';
export { checkLineSegmentIntersection, getLineSegmentIntersection, } from './util/collision.js';
export { Entity } from './util/entity.js';
export { Grid } from './util/grid.js';
// NOTE: This should be able to infer the return type...
Math.clamp = (val, min, max) => {
    if (val < min)
        return min;
    if (val > max)
        return max;
    return val;
};
const reduceSum = (acc, v) => acc + v;
const reduceProduct = (acc, v) => acc * v;
const distance = (dimensions) => Math.abs(Math.sqrt(dimensions.map((d) => d * d).reduce(reduceSum, 0)));
const distanceSq = (dimensions) => Math.abs(dimensions.map((d) => d * d).reduce(reduceSum, 0));
const isDefined = (v) => Boolean(v);
const interlaceArrays = (a, b) => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);
export const mapByOffset = (offset) => {
    return (pos) => addPos(offset, pos);
};
export const mapFindOffset = (origin) => {
    return (pos) => subPos(pos, origin);
};
export const flatMapByOffsets = (offsets) => {
    return (pos) => offsets.map((offset) => addPos(offset, pos));
};
export const posDistance = (a, b) => distance(subPos(b, a));
export const posDistanceSq = (a, b) => distanceSq(subPos(b, a));
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
export const isPointOnLine = (point, a, b) => Math.abs(posDistance(a, point) + posDistance(point, b) - posDistance(a, b)) < EPSILON;
// TODO(bret): Would be fun to make this work with any dimensions
const isWithinBounds = ([x, y], [x1, y1], [x2, y2]) => x >= x1 && y >= y1 && x < x2 && y < y2;
export const filterWithinBounds = (a, b) => (pos) => a.every((p, i) => ([...pos][i] ?? -Infinity) >= p) &&
    b.every((p, i) => ([...pos][i] ?? Infinity) < p);
export const isPointInsidePath = (point, path) => {
    const wind = path
        .map((vertex) => getAngle(point, vertex))
        .map((angle, i, arr) => getAngleBetween(angle, arr[(i + 1) % arr.length]))
        .reduce(reduceSum, 0);
    return Math.abs(wind) > EPSILON;
};
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
export const dirNN = 0;
export const [dirRN, dirNU, dirLN, dirND] = Object.freeze(Array.from({ length: 4 }).map((_, i) => 1 << i));
// prettier-ignore
export const [dirLU, dirRU, dirLD, dirRD,] = [
    dirLN | dirNU, dirRN | dirNU,
    dirLN | dirND, dirRN | dirND,
];
let nnn;
{
    // prettier-ignore
    const [normLU, normNU, normRU, normLN, normNN, normRN, normLD, normND, normRD,] = [
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
    };
}
export const norm = nnn;
const orthogonalNorms = [norm.RN, norm.NU, norm.LN, norm.ND];
const diagonalNorms = [norm.RU, norm.LU, norm.LD, norm.RD];
export const cardinalNorms = interlaceArrays(orthogonalNorms, diagonalNorms);
// Starts right, goes counter-clockwise
export const reduceBitFlags = (acc, val) => acc | val;
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
class V2Map {
    #map = new Map();
    constructor() {
        this.#map = new Map();
    }
    delete(key) {
        return this.#map.delete(hashPos(key));
    }
    get(key) {
        return this.#map.get(hashPos(key));
    }
    has(key) {
        return this.#map.has(hashPos(key));
    }
    set(key, value) {
        this.#map.set(hashPos(key), value);
        return this;
    }
}
export const normToBitFlagMap = new V2Map();
[
    [norm.RN, CARDINAL_NORM.RN], // 1
    [norm.RU, CARDINAL_NORM.RU], // 2
    [norm.NU, CARDINAL_NORM.NU], // 4
    [norm.LU, CARDINAL_NORM.LU], // 8
    [norm.LN, CARDINAL_NORM.LN], // 16
    [norm.LD, CARDINAL_NORM.LD], // 32
    [norm.ND, CARDINAL_NORM.ND], // 64
    [norm.RD, CARDINAL_NORM.RD],
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(dir, bitFlag));
const orTogetherCardinalDirs = (...dirs) => dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);
export const globalSetTile = (tileset, x, y, bitFlag) => {
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
export class AssetManager {
    constructor(prefix = '') {
        this.sprites = new Map();
        this.spritesLoaded = 0;
        this.onLoadCallbacks = [];
        this.prefix = prefix;
    }
    addImage(src) {
        this.sprites.set(src, { fileName: src, image: null, loaded: false });
    }
    loadImage(src) {
        const image = new Image();
        const fullPath = `${this.prefix}${src}`;
        if (fullPath.startsWith('http') &&
            !fullPath.startsWith(location.origin)) {
            image.crossOrigin = 'Anonymous';
        }
        image.onload = () => {
            this.imageLoaded(src);
            const sprite = this.sprites.get(src);
            if (!sprite) {
                throw new Error(`Loaded image that doesn't exist in map ("${src}" / "${fullPath}")`);
            }
            sprite.loaded = true;
            if ((sprite.image = image)) {
                sprite.width = image.width;
                sprite.height = image.height;
            }
        };
        image.src = fullPath;
    }
    loadAssets() {
        [...this.sprites.keys()].forEach((src) => {
            this.loadImage(src);
        });
    }
    reloadAssets() {
        this.spritesLoaded = 0;
        [...this.sprites.keys()].forEach((src) => {
            this.loadImage(src);
        });
    }
    imageLoaded(src) {
        if (++this.spritesLoaded === this.sprites.size) {
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
export class Game {
    gameLoopSettings = {
        updateMode: 'focus',
        renderMode: 'onUpdate',
    };
    constructor(id, settings) {
        const canvas = document.querySelector(`canvas#${id}`);
        if (canvas === null) {
            console.error(`No canvas with id "${id}" was able to be found`);
            return;
        }
        canvas._engine = this;
        const ctx = canvas.getContext('2d', {
            alpha: false,
        });
        if (ctx === null) {
            console.error(`Context was not able to be created from canvas "#${id}"`);
            return;
        }
        this.canvas = canvas;
        this.ctx = ctx;
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('canvas-lord');
        this.wrapper.tabIndex = -1;
        this.canvas.removeAttribute('tabIndex');
        this.canvas.after(this.wrapper);
        this.wrapper.append(this.canvas);
        this.focus = false;
        this.listeners = gameEvents.reduce((acc, val) => {
            acc[val] = new Set();
            return acc;
        }, {});
        this.fps = settings?.fps ?? 60;
        const idealDuration = Math.round(1e3 / this.fps);
        this.recentFrames = Array.from({ length: this.fps }, () => idealDuration);
        this.frameIndex = 0;
        this.frameRate = this.fps;
        if (settings?.gameLoopSettings)
            this.gameLoopSettings = settings.gameLoopSettings;
        this.assetManager = settings?.assetManager;
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
        this._lastFrame = 0; // TODO: rename this - this is actually since last mainLoop() call
        let deltaTime = 0;
        const maxFrames = 5;
        let recentFramesSum = this.recentFrames.reduce((a, v) => a + v, 0);
        this.mainLoop = (time) => {
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
                this.frameRate = Math.round(1e3 / (recentFramesSum / this.recentFrames.length));
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
        this.focusElement.addEventListener('focusin', (e) => this.onFocus(true));
        this.focusElement.addEventListener('focusout', (e) => this.onFocus(false));
        this.updateGameLoopSettings(this.gameLoopSettings);
    }
    load(assetManager) {
        assetManager.loadAssets();
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
        this._onGameLoopSettingsUpdate = () => {
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
        this._lastUpdate = performance.now();
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
        this.addEventListener(this.focusElement, 'keydown', onKeyDown, false);
        this.addEventListener(this.focusElement, 'keyup', onKeyUp, false);
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
        if (this.focus === focus)
            return;
        this.focus = focus;
        this.sendEvent(focus ? 'focus' : 'blur');
        this._lastFrame = performance.now();
        this._lastUpdate = performance.now();
    }
    pushScene(scene) {
        this.pushScenes(scene);
    }
    pushScenes(...scenes) {
        this.sceneStack.push(scenes);
        scenes.forEach((scene) => {
            scene.engine = this;
            scene.updateLists();
            scene.begin();
        });
    }
    update() {
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
    sendEvent(event) {
        // TODO: drawOverlay should take in ctx or game
        this.listeners[event].forEach((c) => c());
    }
    render() {
        const { ctx } = this;
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);
        this.currentScenes?.forEach((scene) => scene.render(ctx));
        // Splitscreen
        if (this.sceneStack[0]?.length === 2) {
            ctx.strokeStyle = '#323232';
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.moveTo(this.width / 2, 0.5);
            ctx.lineTo(this.width / 2, 360.5);
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
export class Input {
    constructor(engine) {
        this.engine = engine;
        const mouse = {
            pos: new Vec2(-1, -1),
            realPos: new Vec2(-1, -1),
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
        if (document.activeElement !== this.engine.focusElement)
            return;
        const { canvas } = this.engine;
        this.mouse.realX = e.offsetX - canvas._offsetX;
        this.mouse.realY = e.offsetY - canvas._offsetY;
        this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
        this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
    }
    onMouseDown(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        if (!this.mouseCheck()) {
            this.mouse._clicked = 3;
        }
        return false;
    }
    onMouseUp(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        if (this.mouseCheck()) {
            this.mouse._clicked = 1;
        }
        return false;
    }
    onKeyDown(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        const { key } = e;
        if (!this.keyCheck(key)) {
            this.keys[key] = 3;
        }
        return false;
    }
    onKeyUp(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
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
// TODO(bret): Rewrite these to use Vectors once those are implemented :)
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
export const findAllPolygonsInGrid = (_grid, _columns, _rows) => {
    const [grid, columns, rows] = getGridData(_grid, _columns, _rows);
    const polygons = [];
    const offsets = {
        [hashPos(norm.NU)]: [norm.RU, norm.NU],
        [hashPos(norm.ND)]: [norm.LD, norm.ND],
        [hashPos(norm.RN)]: [norm.RD, norm.RN],
        [hashPos(norm.LN)]: [norm.LU, norm.LN],
    };
    const shapes = findAllShapesInGrid(grid, columns, rows);
    shapes.forEach((shape) => {
        const [first] = shape.shapeCells;
        if (first === undefined)
            return;
        const { gridType } = shape;
        let curDir = norm.ND;
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
        for (let next = first, firstIter = true; firstIter || !posEqual(curDir, norm.ND) || !posEqual(next, first); firstIter = false) {
            const [p1, p2] = offsets[hashPos(curDir)]
                .map((o) => addPos(next, o))
                .map((p) => {
                return isWithinBounds(p, Vec2.zero, new Vec2(columns, rows))
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
        const hash = hashPos(next);
        if (visited.includes(hash))
            continue;
        const index = posToIndex(next, stride);
        visited.push(hash);
        if (grid[posToIndex(next, columns)] !== gridType)
            continue;
        checked[index] = true;
        const [x, y] = next;
        if (x > 0)
            queue.push(new Vec2(x - 1, y));
        if (x < columns - 1)
            queue.push(new Vec2(x + 1, y));
        if (y > 0)
            queue.push(new Vec2(x, y - 1));
        if (y < rows - 1)
            queue.push(new Vec2(x, y + 1));
    }
    const shapeCells = visited.map((v) => new Vec2(...v.split(',').map((c) => +c)));
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
    computeOutline(grid) {
        this.grid = grid;
        this.polygons = findAllPolygonsInGrid(grid);
    }
    render(ctx, camera) {
        if (!this.show)
            return;
        // Draw edges
        if (this.renderOutline) {
            this.polygons.forEach((polygon) => {
                ctx.beginPath();
                ctx.strokeStyle = this.outlineColor;
                const start = addPos(polygon.points[0], [0.5, 0.5]);
                const cameraPos = new Vec2(camera[0], camera[1]);
                const [_x, _y] = subPos(start, cameraPos);
                ctx.moveTo(_x, _y);
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
export class Tileset {
    constructor(sprite, width, height, tileW, tileH) {
        this.width = width;
        this.height = height;
        this.tileW = tileW;
        this.tileH = tileH;
        this.columns = Math.ceil(width / tileW);
        this.rows = Math.ceil(height / tileH);
        this.sprite = sprite;
        this.data = Array.from({ length: this.columns * this.rows }, (v) => null);
        this.startX = 1;
        this.startY = 1;
        this.separation = 1;
    }
    setTile(x, y, tileX, tileY) {
        // TODO(bret): Make sure it's within the bounds
        this.data[y * this.columns + x] = new Vec2(tileX, tileY);
    }
    render(ctx, camera) {
        const scale = 1;
        const { sprite: image, separation, startX, startY, tileW, tileH, } = this;
        if (!image.image)
            throw new Error('Tileset is missing an image');
        const srcCols = Math.floor(image.width / tileW);
        const srcRows = Math.floor(image.height / tileH);
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
                    ctx.drawImage(image.image, srcX, srcY, tileW, tileH, dstX, dstY, tileW * scale, tileH * scale);
                }
            }
        }
    }
}
/* eslint-enable @typescript-eslint/no-unused-vars -- until exports are set up, many of these items are not being used */
//# sourceMappingURL=canvas-lord.js.map