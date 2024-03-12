"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars -- until exports are set up, many of these items are not being used */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tileset = exports.GridOutline = exports.findAllPolygonsInGrid = exports.Grid = exports.Scene = exports.Input = exports.Game = exports.AssetManager = exports.globalSetTile = exports.normToBitFlagMap = exports.reduceBitFlags = exports.cardinalNorms = exports.dirRD = exports.dirLD = exports.dirRU = exports.dirLU = exports.dirND = exports.dirLN = exports.dirNU = exports.dirRN = exports.dirNN = exports.isPointInsidePath = exports.filterWithinBounds = exports.isPointOnLine = exports.getLineSegmentIntersection = exports.checkLineSegmentIntersection = exports.posDistanceSq = exports.posDistance = exports.flatMapByOffsets = exports.mapFindOffset = exports.mapByOffset = exports.scalePos = exports.subPos = exports.addPos = exports.EPSILON = exports.Tuple = exports.v2one = exports.v2zero = void 0;
var math_js_1 = require("./util/math.js");
var draw_js_1 = require("./util/draw.js");
// TODO: only export these from math.js
var math_js_2 = require("./util/math.js");
Object.defineProperty(exports, "v2zero", { enumerable: true, get: function () { return math_js_2.v2zero; } });
Object.defineProperty(exports, "v2one", { enumerable: true, get: function () { return math_js_2.v2one; } });
Object.defineProperty(exports, "Tuple", { enumerable: true, get: function () { return math_js_2.Tuple; } });
// NOTE: This should be able to infer the return type...
Math.clamp = function (val, min, max) {
    if (val < min)
        return min;
    if (val > max)
        return max;
    return val;
};
exports.EPSILON = 0.000001;
var reduceSum = function (acc, v) { return acc + v; };
var reduceProduct = function (acc, v) { return acc * v; };
var distance = function () {
    var dimensions = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        dimensions[_i] = arguments[_i];
    }
    return Math.abs(Math.sqrt(dimensions.map(function (d) { return d * d; }).reduce(reduceSum, 0)));
};
var distanceSq = function () {
    var dimensions = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        dimensions[_i] = arguments[_i];
    }
    return Math.abs(dimensions.map(function (d) { return d * d; }).reduce(reduceSum, 0));
};
var isDefined = function (v) { return Boolean(v); };
var interlaceArrays = function (a, b) { return a.flatMap(function (v, i) { return [v, b[i]]; }).filter(isDefined); };
var compareTuple = function (a, b) {
    return (0, math_js_1.hashTuple)(a) === (0, math_js_1.hashTuple)(b);
};
var indexToPos = function (index, stride) { return [
    index % stride,
    Math.floor(index / stride),
]; };
var posToIndex = function (_a, stride) {
    var x = _a[0], y = _a[1];
    return y * stride + x;
};
var posEqual = function (a, b) {
    return a.length === b.length && a.every(function (v, i) { return v === b[i]; });
};
var addPos = function (a, b) {
    return math_js_1.Tuple.apply(void 0, a.map(function (v, i) { var _a; return v + ((_a = b[i]) !== null && _a !== void 0 ? _a : 0); }));
};
exports.addPos = addPos;
var subPos = function (a, b) {
    return math_js_1.Tuple.apply(void 0, a.map(function (v, i) { var _a; return v - ((_a = b[i]) !== null && _a !== void 0 ? _a : 0); }));
};
exports.subPos = subPos;
var scalePos = function (p, s) {
    return math_js_1.Tuple.apply(void 0, p.map(function (v) { return v * s; }));
};
exports.scalePos = scalePos;
var mapByOffset = function (offset) {
    return function (pos) { return (0, exports.addPos)(offset, pos); };
};
exports.mapByOffset = mapByOffset;
var mapFindOffset = function (origin) {
    return function (pos) { return (0, exports.subPos)(pos, origin); };
};
exports.mapFindOffset = mapFindOffset;
var flatMapByOffsets = function (offsets) {
    return function (pos) { return offsets.map(function (offset) { return (0, exports.addPos)(offset, pos); }); };
};
exports.flatMapByOffsets = flatMapByOffsets;
var posDistance = function (a, b) { return distance.apply(void 0, (0, exports.subPos)(b, a)); };
exports.posDistance = posDistance;
var posDistanceSq = function (a, b) {
    return distanceSq.apply(void 0, (0, exports.subPos)(b, a));
};
exports.posDistanceSq = posDistanceSq;
// const pathToSegments = (path) =>
// 	path.map((vertex, i, vertices) => [
// 		vertex,
// 		vertices[(i + 1) % vertices.length],
// 	]);
var RAD_TO_DEG = 180.0 / Math.PI;
var radToDeg = function (rad) { return rad * RAD_TO_DEG; };
var DEG_TO_RAD = Math.PI / 180.0;
var degToRad = function (deg) { return deg * DEG_TO_RAD; };
var RAD_45 = 45 * DEG_TO_RAD;
var RAD_90 = 90 * DEG_TO_RAD;
var RAD_180 = 180 * DEG_TO_RAD;
var RAD_270 = 270 * DEG_TO_RAD;
var RAD_360 = 360 * DEG_TO_RAD;
var RAD_540 = 540 * DEG_TO_RAD;
var RAD_720 = 720 * DEG_TO_RAD;
// const getAngle = (a, b) => Math.atan2(...subPos(b, a)) * 180 / Math.PI;
var getAngle = function (a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
};
var getAngleBetween = function (a, b) {
    return ((b - a + RAD_540) % RAD_360) - RAD_180;
};
var crossProduct2D = function (a, b) { return a[0] * b[1] - a[1] * b[0]; };
var _lineSegmentIntersection = function (_a, _b) {
    var a = _a[0], b = _a[1];
    var c = _b[0], d = _b[1];
    var r = (0, exports.subPos)(b, a);
    var s = (0, exports.subPos)(d, c);
    var rxs = crossProduct2D(r, s);
    var t = crossProduct2D((0, exports.subPos)(c, a), s) / rxs;
    var u = crossProduct2D((0, exports.subPos)(a, c), r) / -rxs;
    return [t, u];
};
var checkLineSegmentIntersection = function (a, b) {
    var _a = _lineSegmentIntersection(a, b), t = _a[0], u = _a[1];
    // TODO(bret): Play with these values a bit more
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
exports.checkLineSegmentIntersection = checkLineSegmentIntersection;
var getLineSegmentIntersection = function (a, b) {
    var _a = _lineSegmentIntersection(a, b), t = _a[0], u = _a[1];
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
        ? (0, exports.addPos)(a[0], (0, exports.scalePos)((0, exports.subPos)(a[1], a[0]), t))
        : null;
};
exports.getLineSegmentIntersection = getLineSegmentIntersection;
var isPointOnLine = function (point, a, b) {
    return Math.abs((0, exports.posDistance)(a, point) + (0, exports.posDistance)(point, b) - (0, exports.posDistance)(a, b)) < exports.EPSILON;
};
exports.isPointOnLine = isPointOnLine;
// TODO(bret): Would be fun to make this work with any dimensions
var isWithinBounds = function (_a, _b, _c) {
    var x = _a[0], y = _a[1];
    var x1 = _b[0], y1 = _b[1];
    var x2 = _c[0], y2 = _c[1];
    return x >= x1 && y >= y1 && x < x2 && y < y2;
};
var filterWithinBounds = function (a, b) {
    return function (pos) {
        return a.every(function (p, i) { var _a; return ((_a = pos[i]) !== null && _a !== void 0 ? _a : -Infinity) >= p; }) &&
            b.every(function (p, i) { var _a; return ((_a = pos[i]) !== null && _a !== void 0 ? _a : Infinity) < p; });
    };
};
exports.filterWithinBounds = filterWithinBounds;
var isPointInsidePath = function (point, path) {
    var wind = path
        .map(function (vertex) { return getAngle(point, vertex); })
        .map(function (angle, i, arr) {
        return getAngleBetween(angle, arr[(i + 1) % arr.length]);
    })
        .reduce(reduceSum, 0);
    return Math.abs(wind) > exports.EPSILON;
};
exports.isPointInsidePath = isPointInsidePath;
var createBitEnum = function () {
    var _names = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _names[_i] = arguments[_i];
    }
    var names = _names.flat();
    var bitEnumObj = {};
    names.forEach(function (name, i) {
        var val = 1 << i;
        bitEnumObj[i] = val;
        bitEnumObj[name.toUpperCase()] = val;
    });
    return bitEnumObj;
};
exports.dirNN = 0;
exports.dirRN = (_a = Object.freeze(Array.from({ length: 4 }).map(function (_, i) { return 1 << i; })), _a[0]), exports.dirNU = _a[1], exports.dirLN = _a[2], exports.dirND = _a[3];
// prettier-ignore
exports.dirLU = (_b = [
    exports.dirLN | exports.dirNU, exports.dirRN | exports.dirNU,
    exports.dirLN | exports.dirND, exports.dirRN | exports.dirND,
], _b[0]), exports.dirRU = _b[1], exports.dirLD = _b[2], exports.dirRD = _b[3];
var createNorm = function (norm) {
    return math_js_1.Tuple.apply(void 0, norm);
};
// prettier-ignore
var _c = [
    (0, math_js_1.Tuple)(-1, -1),
    (0, math_js_1.Tuple)(0, -1),
    (0, math_js_1.Tuple)(1, -1),
    (0, math_js_1.Tuple)(-1, 0),
    (0, math_js_1.Tuple)(0, 0),
    (0, math_js_1.Tuple)(1, 0),
    (0, math_js_1.Tuple)(-1, 1),
    (0, math_js_1.Tuple)(0, 1),
    (0, math_js_1.Tuple)(1, 1),
], normLU = _c[0], normNU = _c[1], normRU = _c[2], normLN = _c[3], normNN = _c[4], normRN = _c[5], normLD = _c[6], normND = _c[7], normRD = _c[8];
var orthogonalNorms = [normRN, normNU, normLN, normND];
var diagonalNorms = [normRU, normLU, normLD, normRD];
exports.cardinalNorms = interlaceArrays(orthogonalNorms, diagonalNorms);
// Starts right, goes counter-clockwise
var reduceBitFlags = function (acc, val) { return acc | val; };
exports.reduceBitFlags = reduceBitFlags;
var cardinalNormStrs = [
    'RN',
    'RU',
    'NU',
    'LU',
    'LN',
    'LD',
    'ND',
    'RD',
];
var CARDINAL_NORM = createBitEnum.apply(void 0, cardinalNormStrs);
var mapStrToCardinalDirBitFlag = function (str) {
    return CARDINAL_NORM[str];
};
exports.normToBitFlagMap = new Map();
[
    [normRN, CARDINAL_NORM.RN], // 1
    [normRU, CARDINAL_NORM.RU], // 2
    [normNU, CARDINAL_NORM.NU], // 4
    [normLU, CARDINAL_NORM.LU], // 8
    [normLN, CARDINAL_NORM.LN], // 16
    [normLD, CARDINAL_NORM.LD], // 32
    [normND, CARDINAL_NORM.ND], // 64
    [normRD, CARDINAL_NORM.RD],
].forEach(function (_a) {
    var dir = _a[0], bitFlag = _a[1];
    return exports.normToBitFlagMap.set(dir, bitFlag);
});
var orTogetherCardinalDirs = function () {
    var dirs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        dirs[_i] = arguments[_i];
    }
    return dirs.map(mapStrToCardinalDirBitFlag).reduce(exports.reduceBitFlags, 0);
};
var globalSetTile = function (tileset, x, y, bitFlag) {
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
exports.globalSetTile = globalSetTile;
var AssetManager = /** @class */ (function () {
    function AssetManager(prefix) {
        if (prefix === void 0) { prefix = ''; }
        this.images = new Map();
        this.imagesLoaded = 0;
        this.onLoadCallbacks = [];
        this.prefix = prefix;
    }
    AssetManager.prototype.addImage = function (src) {
        this.images.set(src, null);
    };
    AssetManager.prototype.loadImage = function (src) {
        var _this = this;
        var image = new Image();
        var fullPath = "".concat(this.prefix).concat(src);
        if (fullPath.startsWith('http') &&
            !fullPath.startsWith(location.origin)) {
            image.crossOrigin = 'Anonymous';
        }
        image.onload = function () {
            _this.imageLoaded(src);
            _this.images.set(src, image);
        };
        image.src = fullPath;
    };
    AssetManager.prototype.loadAssets = function () {
        var _this = this;
        __spreadArray([], this.images.keys(), true).forEach(function (src) {
            _this.loadImage(src);
        });
    };
    AssetManager.prototype.imageLoaded = function (src) {
        var _this = this;
        if (++this.imagesLoaded === this.images.size) {
            window.requestAnimationFrame(function () {
                _this.onLoadCallbacks.forEach(function (callback) { return callback(src); });
            });
        }
    };
    AssetManager.prototype.onLoad = function (callback) {
        this.onLoadCallbacks.push(callback);
    };
    return AssetManager;
}());
exports.AssetManager = AssetManager;
var defineUnwritableProperty = function (obj, prop, value, attributes) {
    if (attributes === void 0) { attributes = {}; }
    return Object.defineProperty(obj, prop, __assign(__assign({}, attributes), { value: value, writable: false }));
};
// TODO(bret): 'tabblur', 'tabfocus'
var gameEvents = ['blur', 'focus', 'update'];
var Game = /** @class */ (function () {
    function Game(id, gameLoopSettings) {
        var _this = this;
        this.gameLoopSettings = {
            update: 'focus',
            render: 'onUpdate',
        };
        var canvas = document.querySelector("canvas#".concat(id));
        if (canvas === null) {
            console.error("No canvas with id \"".concat(id, "\" was able to be found"));
            return;
        }
        canvas._engine = this;
        var ctx = canvas.getContext('2d', {
            alpha: false,
        });
        if (ctx === null) {
            console.error("Context was not able to be created from canvas \"#".concat(id, "\""));
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
        this.listeners = gameEvents.reduce(function (acc, val) {
            acc[val] = new Set();
            return acc;
        }, {});
        if (gameLoopSettings)
            this.gameLoopSettings = gameLoopSettings;
        this.sceneStack = [];
        this.backgroundColor = '#323232';
        // TODO(bret): Might also want to listen for styling changes to the canvas element
        var computeCanvasSize = function (canvas) {
            var canvasComputedStyle = getComputedStyle(canvas);
            var width = parseInt(canvasComputedStyle.width, 10);
            var height = parseInt(canvasComputedStyle.height, 10);
            var borderLeft = parseInt(canvasComputedStyle.borderLeftWidth, 10);
            var borderTop = parseInt(canvasComputedStyle.borderTopWidth, 10);
            var paddingLeft = parseInt(canvasComputedStyle.paddingLeft, 10);
            var paddingTop = parseInt(canvasComputedStyle.paddingTop, 10);
            var isBorderBox = canvasComputedStyle.boxSizing === 'border-box';
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
        var timestep = 1000 / 60;
        this._lastFrame = 0;
        var deltaTime = 0;
        var maxFrames = 5;
        this.mainLoop = function (time) {
            _this.frameRequestId = requestAnimationFrame(_this.mainLoop);
            deltaTime += time - _this._lastFrame;
            _this._lastFrame = time;
            deltaTime = Math.min(deltaTime, timestep * maxFrames + 0.01);
            // should we send a pre-/post- message in case there are
            // multiple updates that happen in a single while?
            while (deltaTime >= timestep) {
                _this.update();
                _this.input.update();
                deltaTime -= timestep;
            }
        };
        this.eventListeners = [];
        window.addEventListener('resize', function (e) {
            computeCanvasSize(_this.canvas);
        });
        window.addEventListener('blur', function (e) { return _this.onFocus(false); });
        // TODO: should we allow folks to customize this to be directly on the canvas?
        this.focusElement = this.wrapper;
        this.focusElement.addEventListener('focusin', function (e) {
            return _this.onFocus(true);
        });
        this.focusElement.addEventListener('focusout', function (e) {
            return _this.onFocus(false);
        });
        this.updateGameLoopSettings(this.gameLoopSettings);
    }
    Object.defineProperty(Game.prototype, "width", {
        get: function () {
            return this.canvas.width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "height", {
        get: function () {
            return this.canvas.height;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "currentScenes", {
        get: function () {
            return this.sceneStack[0];
        },
        enumerable: false,
        configurable: true
    });
    // TODO(bret): We're going to need to make a less clunky interface
    Game.prototype.updateGameLoopSettings = function (newGameLoopSettings) {
        var _this = this;
        var _a;
        (_a = this._onGameLoopSettingsUpdate) === null || _a === void 0 ? void 0 : _a.call(this);
        this.gameLoopSettings = newGameLoopSettings;
        var update = this.update.bind(this);
        var render = this.render.bind(this);
        var startMainLoop = this.startMainLoop.bind(this);
        var killMainLoop = this.killMainLoop.bind(this);
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
                this.gameLoopSettings.updateOn.forEach(function (event) {
                    _this.canvas.addEventListener(event, update);
                });
                break;
        }
        if (this.gameLoopSettings.render === 'onUpdate') {
            this.listeners.update.add(render);
        }
        this._onGameLoopSettingsUpdate = function () {
            // Remove existing callbacks
            switch (_this.gameLoopSettings.update) {
                case 'always':
                    killMainLoop();
                    break;
                case 'focus':
                    _this.listeners.focus.delete(startMainLoop);
                    _this.listeners.blur.delete(killMainLoop);
                    break;
                case 'manual':
                    break;
                case 'onEvent':
                    _this.gameLoopSettings.updateOn.forEach(function (event) {
                        _this.canvas.removeEventListener(event, update);
                    });
                    break;
            }
            if (_this.gameLoopSettings.render === 'onUpdate') {
                _this.listeners.update.delete(render);
            }
        };
    };
    Game.prototype.addEventListener = function (element) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var eventListener = {
            element: element,
            arguments: rest,
        };
        element.addEventListener.apply(element, eventListener.arguments);
        this.eventListeners.push(eventListener);
    };
    Game.prototype.startMainLoop = function () {
        var _this = this;
        this._lastFrame = performance.now();
        this.frameRequestId = requestAnimationFrame(this.mainLoop);
        // TODO(bret): Do binding
        var onMouseDown = function (e) {
            return _this.input.onMouseDown(e);
        };
        var onMouseUp = function (e) {
            return _this.input.onMouseUp(e);
        };
        var onMouseMove = function (e) {
            return _this.input.onMouseMove(e);
        };
        var onKeyDown = function (e) {
            return _this.input.onKeyDown(e);
        };
        var onKeyUp = function (e) {
            return _this.input.onKeyUp(e);
        };
        this.addEventListener(this.canvas, 'mousedown', onMouseDown);
        this.addEventListener(this.canvas, 'mouseup', onMouseUp);
        // TODO(bret): Find out if we need useCapture here & above
        [
            'mousedown',
            'mouseup',
            'mouseenter',
            'mousemove',
            'mouseexit',
        ].forEach(function (event) {
            // TODO(bret): Check other HTML5 game engines to see if they attach mouse events to the canvas or the window
            _this.addEventListener(_this.canvas, event, onMouseMove);
        });
        this.addEventListener(this.focusElement, 'keydown', onKeyDown, false);
        this.addEventListener(this.focusElement, 'keyup', onKeyUp, false);
    };
    Game.prototype.killMainLoop = function () {
        cancelAnimationFrame(this.frameRequestId);
        this.input.clear();
        this.eventListeners.forEach(function (eventListener) {
            var element = eventListener.element;
            element.removeEventListener.apply(element, eventListener.arguments);
        });
        this.eventListeners = [];
    };
    // TODO(bret): Also perhaps do this on page/browser focus lost?
    Game.prototype.onFocus = function (focus) {
        if (this.focus === focus)
            return;
        this.focus = focus;
        this.sendEvent(focus ? 'focus' : 'blur');
    };
    Game.prototype.pushScene = function (scene) {
        this.pushScenes(scene);
    };
    Game.prototype.pushScenes = function () {
        var _this = this;
        var scenes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            scenes[_i] = arguments[_i];
        }
        this.sceneStack.push(scenes);
        scenes.forEach(function (scene) {
            scene.engine = _this;
        });
    };
    Game.prototype.update = function () {
        var _this = this;
        var _a;
        (_a = this.currentScenes) === null || _a === void 0 ? void 0 : _a.forEach(function (scene) { return scene.update(_this.input); });
        this.sendEvent('update');
    };
    Game.prototype.sendEvent = function (event) {
        this.listeners[event].forEach(function (c) { return c(); });
    };
    Game.prototype.render = function () {
        var _a, _b;
        var _c = this, canvas = _c.canvas, ctx = _c.ctx;
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, 640, 360);
        (_a = this.currentScenes) === null || _a === void 0 ? void 0 : _a.forEach(function (scene) { return scene.render(ctx); });
        // Splitscreen
        if (((_b = this.sceneStack[0]) === null || _b === void 0 ? void 0 : _b.length) === 2) {
            ctx.strokeStyle = '#323232';
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.moveTo(canvas.width / 2, 0.5);
            ctx.lineTo(canvas.width / 2, 360.5);
            ctx.stroke();
        }
    };
    return Game;
}());
exports.Game = Game;
// TODO(bret): Will need to allow for evt.key & evt.which
var _keys = [
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
var Input = /** @class */ (function () {
    function Input(engine) {
        this.engine = engine;
        var mouse = {
            pos: [-1, -1],
            realPos: [-1, -1],
            _clicked: 0,
        };
        var defineXYProperties = function (mouse, prefix) {
            if (prefix === void 0) { prefix = null; }
            var posName = prefix !== null ? "".concat(prefix, "Pos") : 'pos';
            var xName = prefix !== null ? "".concat(prefix, "X") : 'x';
            var yName = prefix !== null ? "".concat(prefix, "Y") : 'y';
            [xName, yName].forEach(function (coordName, i) {
                var _a;
                Object.defineProperties(mouse, (_a = {},
                    _a[coordName] = {
                        get: function () {
                            return mouse[posName][i];
                        },
                        set: function (val) {
                            mouse[posName] = Object.freeze(mouse[posName].map(function (oldVal, index) {
                                return index === i ? val : oldVal;
                            }));
                        },
                    },
                    _a));
            });
        };
        defineXYProperties(mouse);
        defineXYProperties(mouse, 'real');
        this.mouse = mouse;
        this.clear();
    }
    Input.prototype.update = function () {
        var _this = this;
        this.mouse._clicked &= ~1;
        _keys.forEach(function (key) {
            _this.keys[key] &= ~1;
        });
    };
    // Events
    Input.prototype.onMouseMove = function (e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        var canvas = this.engine.canvas;
        this.mouse.realX = e.offsetX - canvas._offsetX;
        this.mouse.realY = e.offsetY - canvas._offsetY;
        this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
        this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
    };
    Input.prototype.onMouseDown = function (e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        if (!this.mouseCheck()) {
            this.mouse._clicked = 3;
        }
        return false;
    };
    Input.prototype.onMouseUp = function (e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        if (this.mouseCheck()) {
            this.mouse._clicked = 1;
        }
        return false;
    };
    Input.prototype.onKeyDown = function (e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        var key = e.key;
        if (!this.keyCheck(key)) {
            this.keys[key] = 3;
        }
        return false;
    };
    Input.prototype.onKeyUp = function (e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        var key = e.key;
        if (this.keyCheck(key)) {
            this.keys[key] = 1;
        }
        return false;
    };
    // Checks
    Input.prototype._checkPressed = function (value) {
        return value === 3;
    };
    Input.prototype._checkHeld = function (value) {
        return (value & 2) > 0;
    };
    Input.prototype._checkReleased = function (value) {
        return value === 1;
    };
    Input.prototype.mousePressed = function () {
        return this._checkPressed(this.mouse._clicked);
    };
    Input.prototype.mouseCheck = function () {
        return this._checkHeld(this.mouse._clicked);
    };
    Input.prototype.mouseReleased = function () {
        return this._checkReleased(this.mouse._clicked);
    };
    Input.prototype.keyPressed = function (key) {
        var _this = this;
        if (Array.isArray(key))
            return key.some(function (k) { return _this.keyPressed(k); });
        return this._checkPressed(this.keys[key]);
    };
    Input.prototype.keyCheck = function (key) {
        var _this = this;
        if (Array.isArray(key))
            return key.some(function (k) { return _this.keyCheck(k); });
        return this._checkHeld(this.keys[key]);
    };
    Input.prototype.keyReleased = function (key) {
        var _this = this;
        if (Array.isArray(key))
            return key.some(function (k) { return _this.keyReleased(k); });
        return this._checkReleased(this.keys[key]);
    };
    Input.prototype.clear = function () {
        this.keys = _keys.reduce(function (acc, key) {
            acc[key] = 0;
            return acc;
        }, {});
    };
    return Input;
}());
exports.Input = Input;
var Camera = /** @class */ (function (_super) {
    __extends(Camera, _super);
    function Camera(x, y) {
        var _this = _super.call(this) || this;
        _this.push(x, y);
        return _this;
    }
    Object.defineProperty(Camera.prototype, "x", {
        get: function () {
            return this[0];
        },
        set: function (val) {
            this[0] = val;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "y", {
        get: function () {
            return this[1];
        },
        set: function (val) {
            this[1] = val;
        },
        enumerable: false,
        configurable: true
    });
    return Camera;
}(Array));
var Messages = /** @class */ (function () {
    function Messages() {
        this.subscribers = new Map();
    }
    Messages.prototype.subscribe = function (subscriber) {
        var _this = this;
        var messages = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            messages[_i - 1] = arguments[_i];
        }
        messages.forEach(function (message) {
            if (!_this.subscribers.has(message)) {
                _this.subscribers.set(message, []);
            }
            var subs = _this.subscribers.get(message);
            subs === null || subs === void 0 ? void 0 : subs.push(subscriber);
        });
    };
    Messages.prototype.sendMessage = function (message, payload) {
        var subs = this.subscribers.get(message);
        if (!subs) {
            console.warn("".concat(message, " isn't registered"));
            return;
        }
        subs.forEach(function (sub) {
            var receive = sub.receive;
            if (!receive) {
                console.warn("subscriber doesn't have receive() method", sub);
                return;
            }
            receive(message, payload);
        });
    };
    return Messages;
}());
var Scene = /** @class */ (function () {
    function Scene(engine) {
        this.engine = engine;
        this.componentSystemMap = new Map();
        this.entities = [];
        this.renderables = [];
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
    Scene.prototype.setCanvasSize = function (width, height) {
        var canvas = (this.canvas = document.createElement('canvas'));
        var ctx = canvas.getContext('2d');
        if (ctx)
            this.ctx = ctx;
        canvas.width = width;
        canvas.height = height;
    };
    Scene.prototype.addEntity = function (entity) {
        entity.scene = this;
        this.entities.push(entity);
        return entity;
    };
    Scene.prototype.update = function (input) {
        var _this = this;
        if (this.allowRefresh && input.keyPressed('F5'))
            location.reload();
        if (this.escapeToBlur && input.keyPressed('Escape'))
            this.engine.canvas.blur();
        if (!this.shouldUpdate)
            return;
        this.entities.forEach(function (entity) { return entity.update(input); });
        // this.renderables = this.renderables.filter(e => e).sort();
        // REVIEW(bret): make sure that this is a stable ordering!
        this.componentSystemMap.forEach(function (system, component) {
            var update = system.update;
            if (!update)
                return;
            var entities = _this.entities.filter(function (e) { var _a; return Boolean((_a = e.component) === null || _a === void 0 ? void 0 : _a.call(e, component)); });
            entities.forEach(function (entity) { return update(entity, input); });
        });
    };
    Scene.prototype.render = function (ctx) {
        var _this = this;
        this.ctx.fillStyle = '#87E1A3';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderables.forEach(function (entity) {
            return entity.render(_this.ctx, _this.camera);
        });
        // const width = 2;
        // const posOffset = 0.5;
        // const widthOffset = width;
        // this.ctx.strokeStyle = '#787878';
        // this.ctx.lineWidth = (width * 2 - 1);
        // this.ctx.strokeRect(posOffset, posOffset, this.canvas.width - 1, this.canvas.height - 1);
        this.componentSystemMap.forEach(function (system, component) {
            var render = system.render;
            if (!render)
                return;
            var entities = _this.entities.filter(function (e) { var _a; return Boolean((_a = e.component) === null || _a === void 0 ? void 0 : _a.call(e, component)); });
            entities.forEach(function (entity) {
                render(entity, _this.ctx, _this.camera);
            });
        });
        ctx.drawImage.apply(ctx, __spreadArray([this.canvas], this.screenPos, false));
    };
    return Scene;
}());
exports.Scene = Scene;
var pixelCanvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(1, 1)
    : document.createElement('canvas');
var _pixelCtx = typeof OffscreenCanvas !== 'undefined'
    ? pixelCanvas.getContext('2d')
    : pixelCanvas.getContext('2d');
if (!_pixelCtx) {
    throw Error('pixelCtx failed to create');
}
var pixelCtx = _pixelCtx;
var Grid = /** @class */ (function () {
    function Grid(width, height, tileW, tileH) {
        this.width = width;
        this.height = height;
        this.tileW = tileW;
        this.tileH = tileH;
        this.columns = Math.ceil(width / tileW);
        this.rows = Math.ceil(height / tileH);
        var size = this.columns * this.rows;
        this.color = 'rgba(255, 0, 0, 0.6)';
        this.renderMode = 2;
        this.data = Array.from({ length: size }, function (v) { return 0; });
    }
    Grid.fromBitmap = function (assetManager, src, tileW, tileH) {
        var image = assetManager.images.get(src);
        if (!image) {
            throw new Error('image is not valid');
        }
        var width = image.width * tileW;
        var height = image.height * tileH;
        var stride = image.width;
        var grid = new Grid(width, height, tileW, tileH);
        grid.forEach(function (_, _a) {
            var x = _a[0], y = _a[1];
            pixelCtx.drawImage(image, -x, -y);
            var data = pixelCtx.getImageData(0, 0, 1, 1).data;
            if (data[0] === 0) {
                grid.setTile(x, y, 1);
            }
        });
        return grid;
    };
    Grid.fromBinary = function (data, tileW, tileH) {
        var width = data[0], height = data[1], gridData = data.slice(2);
        var grid = new Grid(width * tileW, height * tileH, tileW, tileH);
        var stride = grid.columns;
        gridData
            .flatMap(function (b) { return b.toString(2).padStart(32, '0').split(''); })
            .forEach(function (v, i) {
            grid.setTile.apply(grid, __spreadArray(__spreadArray([], indexToPos(i, stride), false), [+v], false));
        });
        return grid;
    };
    Grid.prototype.forEach = function (callback) {
        var stride = this.columns;
        this.data
            .map(function (val, i) { return [val, indexToPos(i, stride)]; })
            .forEach(function (args) { return callback.apply(void 0, args); });
    };
    Grid.prototype.inBounds = function (x, y) {
        return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
    };
    Grid.prototype.setTile = function (x, y, value) {
        if (!this.inBounds(x, y))
            return;
        this.data[y * this.columns + x] = value;
    };
    Grid.prototype.getTile = function (x, y) {
        if (!this.inBounds(x, y))
            return 0;
        return this.data[y * this.columns + x];
    };
    Grid.prototype.renderOutline = function (ctx, camera) {
        var stride = this.columns;
        var width = this.tileW;
        var height = this.tileH;
        var cameraX = camera[0], cameraY = camera[1];
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        for (var y = 0; y < this.rows; ++y) {
            for (var x = 0; x < this.columns; ++x) {
                if (this.data[y * stride + x] === 1) {
                    var x1 = x * this.tileW + 0.5 - cameraX;
                    var y1 = y * this.tileH + 0.5 - cameraY;
                    var x2 = x1 + width - 1;
                    var y2 = y1 + height - 1;
                    if (!this.getTile(x - 1, y)) {
                        draw_js_1.Draw.line(ctx, draw_js_1.drawable, x1, y1, x1, y2);
                    }
                    if (!this.getTile(x + 1, y)) {
                        draw_js_1.Draw.line(ctx, draw_js_1.drawable, x2, y1, x2, y2);
                    }
                    if (!this.getTile(x, y - 1)) {
                        draw_js_1.Draw.line(ctx, draw_js_1.drawable, x1, y1, x2, y1);
                    }
                    if (!this.getTile(x, y + 1)) {
                        draw_js_1.Draw.line(ctx, draw_js_1.drawable, x1, y2, x2, y2);
                    }
                }
            }
        }
    };
    Grid.prototype.renderEachCell = function (ctx, camera, fill) {
        if (fill === void 0) { fill = false; }
        var stride = this.columns;
        var width = this.tileW - +!fill;
        var height = this.tileH - +!fill;
        var cameraX = camera[0], cameraY = camera[1];
        if (fill)
            ctx.fillStyle = this.color;
        else
            ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        var drawRect = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return fill ? ctx.fillRect.apply(ctx, args) : ctx.strokeRect.apply(ctx, args);
        };
        var offset = fill ? 0 : 0.5;
        for (var y = 0; y < this.rows; ++y) {
            for (var x = 0; x < this.columns; ++x) {
                if (this.data[y * stride + x] === 1) {
                    drawRect(x * this.tileW + offset - cameraX, y * this.tileH + offset - cameraY, width, height);
                }
            }
        }
    };
    Grid.prototype.render = function (ctx, camera) {
        if (camera === void 0) { camera = math_js_1.v2zero; }
        switch (this.renderMode) {
            case 0:
                this.renderOutline(ctx, camera);
                break;
            case 1:
                this.renderEachCell(ctx, camera);
                break;
            case 2: {
                var temp = this.color;
                this.color = 'rgba(255, 0, 0, 0.3)';
                this.renderEachCell(ctx, camera, true);
                this.color = temp;
                this.renderEachCell(ctx, camera, false);
                break;
            }
        }
    };
    return Grid;
}());
exports.Grid = Grid;
// TODO(bret): Rewrite these to use tuples once those are implemented :)
var rotateNormBy45Deg = function (curDir, turns) {
    var norms = exports.cardinalNorms; // .flatMap(v => [v, v]);
    var index = exports.cardinalNorms.indexOf(curDir);
    if (index === -1) {
        console.error('rotateNormBy45Deg expects a norm array');
        return curDir;
    }
    var n = exports.cardinalNorms.length;
    return exports.cardinalNorms[(index - turns + n) % n];
};
// NOTE: The generic allows it to use V2's orthogonal or diagonal norm types, depending on the `curDir`
var rotateNormBy90Deg = function (curDir, turns) { return rotateNormBy45Deg(curDir, 2 * turns); };
function getGridData(_grid, _columns, _rows) {
    if (_grid instanceof Grid) {
        var grid = _grid.data, columns = _grid.columns, rows = _grid.rows;
        return [grid, columns, rows];
    }
    return [_grid, _columns, _rows];
}
var findAllPolygonsInGrid = function (_grid, _columns, _rows) {
    var _a;
    var _b = getGridData(_grid, _columns, _rows), grid = _b[0], columns = _b[1], rows = _b[2];
    var polygons = [];
    var offsets = (_a = {},
        _a[(0, math_js_1.hashTuple)(normNU)] = [normRU, normNU],
        _a[(0, math_js_1.hashTuple)(normND)] = [normLD, normND],
        _a[(0, math_js_1.hashTuple)(normRN)] = [normRD, normRN],
        _a[(0, math_js_1.hashTuple)(normLN)] = [normLU, normLN],
        _a);
    var shapes = findAllShapesInGrid(grid, columns, rows);
    shapes.forEach(function (shape) {
        var first = shape.shapeCells[0];
        if (first === undefined)
            return;
        var gridType = shape.gridType;
        var curDir = normND;
        var lastDir = curDir;
        var points = [];
        var polygon = { points: points };
        polygons.push(polygon);
        var addPointsToPolygon = function (points, pos, interior) {
            var origin = interior ? 0 : -1;
            var size = 16;
            var m1 = size - 1;
            var basePos = (0, exports.scalePos)(pos, size);
            var _a = points.length
                ? (0, exports.subPos)(points[points.length - 1], basePos)
                : [origin, origin], lastX = _a[0], lastY = _a[1];
            var offset = [0, 0];
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
            points.push((0, exports.addPos)(basePos, math_js_1.Tuple.apply(void 0, offset)));
        };
        addPointsToPolygon(points, first, gridType === 1);
        var _loop_1 = function (next, firstIter) {
            var _a = offsets[(0, math_js_1.hashTuple)(curDir)]
                .map(function (o) { return (0, exports.addPos)(next, o); })
                .map(function (p) {
                return isWithinBounds(p, math_js_1.v2zero, [columns, rows])
                    ? grid[posToIndex(p, columns)]
                    : 0;
            }), p1 = _a[0], p2 = _a[1];
            if (p2 === gridType) {
                if (p1 === gridType) {
                    next = (0, exports.addPos)(next, curDir);
                    curDir = rotateNormBy90Deg(curDir, 1);
                }
                next = (0, exports.addPos)(next, curDir);
                if (lastDir !== curDir)
                    addPointsToPolygon(points, next, gridType === 1);
            }
            else {
                curDir = rotateNormBy90Deg(curDir, -1);
                addPointsToPolygon(points, next, gridType === 1);
            }
            lastDir = curDir;
            out_next_1 = next;
        };
        var out_next_1;
        for (var next = first, firstIter = true; firstIter || curDir !== normND || next !== first; firstIter = false) {
            _loop_1(next, firstIter);
            next = out_next_1;
        }
    });
    return polygons;
};
exports.findAllPolygonsInGrid = findAllPolygonsInGrid;
var findAllShapesInGrid = function (_grid, _columns, _rows) {
    var _a = getGridData(_grid, _columns, _rows), grid = _a[0], columns = _a[1], rows = _a[2];
    var shapes = [];
    var checked = Array.from({ length: columns * rows }, function () { return false; });
    var nextIndex;
    while ((nextIndex = checked.findIndex(function (v) { return !v; })) > -1) {
        var shape = fillShape(indexToPos(nextIndex, columns), checked, grid, columns, rows);
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
var fillShape = function (start, checked, _grid, _columns, _rows) {
    var _a = getGridData(_grid, _columns, _rows), grid = _a[0], columns = _a[1], rows = _a[2];
    var stride = columns;
    var gridType = grid[posToIndex(start, columns)];
    var queue = [start];
    var visited = [];
    var next;
    while ((next = queue.pop())) {
        var hash = (0, math_js_1.hashTuple)(next);
        if (visited.includes(hash))
            continue;
        var index = posToIndex(next, stride);
        visited.push(hash);
        if (grid[posToIndex(next, columns)] !== gridType)
            continue;
        checked[index] = true;
        var x = next[0], y = next[1];
        if (x > 0)
            queue.push([x - 1, y]);
        if (x < columns - 1)
            queue.push([x + 1, y]);
        if (y > 0)
            queue.push([x, y - 1]);
        if (y < rows - 1)
            queue.push([x, y + 1]);
    }
    var shapeCells = visited.map(function (v) {
        return math_js_1.Tuple.apply(void 0, v.split(',').map(function (c) { return +c; }));
    });
    var shapeBounds = shapeCells.reduce(function (acc, cell) {
        var x = cell[0], y = cell[1];
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
    return __assign(__assign({}, shapeBounds), { gridType: gridType, shapeCells: shapeCells });
};
var GridOutline = /** @class */ (function () {
    function GridOutline() {
        this.grid = null;
        this.polygons = [];
        this.show = true;
        this.renderOutline = true;
        this.outlineColor = 'red';
        this.renderPoints = true;
        this.pointsColor = 'red';
    }
    GridOutline.prototype.computeOutline = function (grid) {
        this.grid = grid;
        this.polygons = (0, exports.findAllPolygonsInGrid)(grid);
    };
    GridOutline.prototype.render = function (ctx, camera) {
        var _this = this;
        if (camera === void 0) { camera = math_js_1.v2zero; }
        if (!this.show)
            return;
        // Draw edges
        if (this.renderOutline) {
            this.polygons.forEach(function (polygon) {
                ctx.beginPath();
                ctx.strokeStyle = _this.outlineColor;
                ctx.moveTo.apply(ctx, (0, exports.subPos)((0, exports.addPos)(polygon.points[0], (0, math_js_1.Tuple)(0.5, 0.5)), camera));
                polygon.points
                    .slice(1)
                    .map(function (p) { return (0, exports.subPos)(p, camera); })
                    .forEach(function (_a) {
                    var x = _a[0], y = _a[1];
                    ctx.lineTo(x + 0.5, y + 0.5);
                });
                ctx.closePath();
                ctx.stroke();
            });
        }
        // Draw points
        if (this.renderPoints) {
            ctx.fillStyle = this.pointsColor;
            this.polygons.forEach(function (polygon) {
                polygon.points
                    .map(function (p) { return (0, exports.subPos)(p, camera); })
                    .forEach(function (_a) {
                    var x = _a[0], y = _a[1];
                    ctx.fillRect(x - 1, y - 1, 3, 3);
                });
            });
        }
    };
    return GridOutline;
}());
exports.GridOutline = GridOutline;
var Tileset = /** @class */ (function () {
    function Tileset(image, width, height, tileW, tileH) {
        this.width = width;
        this.height = height;
        this.tileW = tileW;
        this.tileH = tileH;
        this.columns = Math.ceil(width / tileW);
        this.rows = Math.ceil(height / tileH);
        this.image = image;
        this.data = Array.from({ length: this.columns * this.rows }, function (v) { return null; });
        this.startX = 1;
        this.startY = 1;
        this.separation = 1;
    }
    Tileset.prototype.setTile = function (x, y, tileX, tileY) {
        // TODO(bret): Make sure it's within the bounds
        this.data[y * this.columns + x] = [tileX, tileY];
    };
    Tileset.prototype.render = function (ctx, camera) {
        if (camera === void 0) { camera = math_js_1.v2zero; }
        var scale = 1;
        var _a = this, image = _a.image, separation = _a.separation, startX = _a.startX, startY = _a.startY, tileW = _a.tileW, tileH = _a.tileH;
        var srcCols = Math.floor(this.image.width / tileW);
        var srcRows = Math.floor(this.image.height / tileH);
        var cameraX = camera[0], cameraY = camera[1];
        for (var y = 0; y < this.rows; ++y) {
            for (var x = 0; x < this.columns; ++x) {
                var val = this.data[y * this.columns + x];
                if (val) {
                    var tileX = val[0], tileY = val[1];
                    var srcX = startX + (separation + tileW) * tileX;
                    var srcY = startY + (separation + tileH) * tileY;
                    var dstX = x * tileW - cameraX;
                    var dstY = y * tileH - cameraY;
                    ctx.drawImage(image, srcX, srcY, tileW, tileH, dstX, dstY, tileW * scale, tileH * scale);
                }
            }
        }
    };
    return Tileset;
}());
exports.Tileset = Tileset;
/* eslint-enable @typescript-eslint/no-unused-vars -- until exports are set up, many of these items are not being used */
