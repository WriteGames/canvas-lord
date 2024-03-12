"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v2one = exports.v2zero = exports.Tuple = exports.hashTuple = void 0;
var hashTuple = function (pos) { return pos.join(','); };
exports.hashTuple = hashTuple;
var _tupleMap = new Map();
var Tuple = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var hash = (0, exports.hashTuple)(args);
    if (!_tupleMap.has(hash)) {
        var tuple = Object.freeze(args);
        _tupleMap.set(hash, tuple);
    }
    return _tupleMap.get(hash);
};
exports.Tuple = Tuple;
exports.v2zero = (0, exports.Tuple)(0, 0);
exports.v2one = (0, exports.Tuple)(1, 1);
