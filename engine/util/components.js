"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveEightComponent = exports.circle = exports.rect = exports.image = exports.pos2D = exports.createComponent = exports.copyObject = void 0;
var math_js_1 = require("./math.js");
var copyObject = function (obj) { return (Array.isArray(obj) ? __spreadArray([], obj, true) : Object.assign({}, obj)); };
exports.copyObject = copyObject;
// TODO: rename to registerComponent? And then do something with that?
// TODO: how should prerequisites be handled? ie rect needs pos2D maybe, and then adding that component needs to either add an initial pos2D or warn/error that there isn't one there
var createComponent = function (component) {
    return Object.freeze((0, exports.copyObject)(component));
};
exports.createComponent = createComponent;
exports.pos2D = (0, exports.createComponent)(math_js_1.v2zero);
var drawable = {
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 0,
    originY: 0,
    offsetX: 0,
    offsetY: 0,
};
var style = {
    type: 'fill',
    color: 'white',
};
exports.image = (0, exports.createComponent)(__assign({ imageSrc: null, frame: 0, frameW: 0, frameH: 0 }, drawable));
exports.rect = (0, exports.createComponent)(__assign(__assign({ width: 0, height: 0 }, drawable), style));
exports.circle = (0, exports.createComponent)(__assign(__assign({ radius: 0 }, drawable), style));
exports.moveEightComponent = (0, exports.createComponent)({
    originX: 30,
    originY: 90,
    dt: 0,
});
// TODO: how do I do a component group??
