"use strict";
// IDEA(bret): What if we can define types of logs and toggle them on/off?
// IDEA(bret): There could also be a setting that you can enable to choose whether getting a value sent to that Log item causes it to display
// IDEA(bret): You could also have a timeout that causes that log value to disable after not receiving a change for X frames
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Log__value, _Log__str;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.Log = exports.YesNoLogParser = void 0;
var YesNoLogParser = function (value) {
    return value ? 'yes' : 'no';
};
exports.YesNoLogParser = YesNoLogParser;
var defaultLoggerOptions = Object.freeze({
    logs: {
        defaults: {
            lifespan: 60,
            parser: function (val) {
                return JSON.parse(JSON.stringify(val)).toString();
            },
            visible: true,
            renderer: function (ctx, log, drawX, drawY) {
                ctx.fillStyle = 'white';
                ctx.fillText(log.str, drawX, drawY);
            },
        },
    },
});
var Log = /** @class */ (function () {
    // CLEANUP_END
    function Log(logger, value, options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c, _d;
        _Log__value.set(this, void 0);
        _Log__str.set(this, 'undefined');
        this.logger = logger;
        this.elapsed = 0;
        var defaults = logger.options.logs.defaults;
        this.lifespan = (_a = options.lifespan) !== null && _a !== void 0 ? _a : defaults.lifespan;
        this.parser = (_b = options.parser) !== null && _b !== void 0 ? _b : defaults.parser;
        this.visible = (_c = options.visible) !== null && _c !== void 0 ? _c : defaults.visible; // FIXME(bret)
        this.renderer = (_d = options.renderer) !== null && _d !== void 0 ? _d : defaults.renderer;
        this.value = value;
    }
    Object.defineProperty(Log.prototype, "value", {
        get: function () {
            return __classPrivateFieldGet(this, _Log__value, "f");
        },
        set: function (val) {
            __classPrivateFieldSet(this, _Log__value, val, "f");
            __classPrivateFieldSet(this, _Log__str, this.parser(val), "f");
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Log.prototype, "str", {
        get: function () {
            return __classPrivateFieldGet(this, _Log__str, "f");
        },
        enumerable: false,
        configurable: true
    });
    return Log;
}());
exports.Log = Log;
_Log__value = new WeakMap(), _Log__str = new WeakMap();
var Logger = /** @class */ (function () {
    function Logger(x, y, options) {
        if (options === void 0) { options = {}; }
        this.x = x;
        this.y = y;
        // REVISIT(bret): Make this generic :)
        // NOTE(bret): structuredClone would be neat here, but it cannot copy functions (perhaps the``transfer` option would help there?)
        this.options = Object.assign({}, defaultLoggerOptions);
        Object.assign(this.options.logs, options.logs);
        // REVISIT(bret): Do we need these? Could they just be getter/setters?
        // this.defaultLifespan = this.options.defaultLifespan;
        // this.defaultLogRenderer = this.options.defaultLogRenderer;
        this.logs = [];
        this.watched = new Map();
        this.watchedDelimiter = ': ';
    }
    Logger.prototype.setLogDefault = function (key, value) {
        this.options.logs.defaults[key] = value;
    };
    Logger.prototype.log = function (str, options) {
        var log = new Log(this, str, options);
        this.logs.push(log);
    };
    Logger.prototype.watch = function (tag, initialValue, options) {
        var log = new Log(this, initialValue, options);
        this.watched.set(tag, log);
    };
    Logger.prototype.set = function (tag, value) {
        var log = this.watched.get(tag);
        if (!log) {
            console.warn("Logger is not watching \"".concat(tag, "\""));
            return;
        }
        log.value = value;
    };
    Logger.prototype.update = function () {
        // remove old logs
        this.logs = this.logs.filter(function (log) { return log.elapsed !== log.lifespan; });
        // update logs
        this.logs.forEach(function (log) { return log.elapsed++; });
    };
    Logger.prototype.render = function (ctx) {
        var _this = this;
        var _a, _b;
        // FIXME: handle this better
        var watched = Array.from(this.watched).filter(function (_a) {
            var _ = _a[0], v = _a[1];
            return v.visible;
        });
        var logs = this.logs.filter(function (l) { return l.visible; });
        // FIXME(bret): Implement a proper hide/visible system :P
        var lines = watched.length + logs.length;
        if (lines === 0)
            return;
        var drawX = this.x, drawY = this.y;
        ctx.font = '10px Monospace';
        var glyph = ctx.measureText('0');
        var ascenderHeight = glyph.actualBoundingBoxAscent;
        var longestPrefix = (_a = watched
            .map(function (_a) {
            var k = _a[0];
            return k.length + _this.watchedDelimiter.length;
        })
            .sort(function (a, b) { return b - a; })[0]) !== null && _a !== void 0 ? _a : 0;
        var longestLength = (_b = [
            watched.map(function (_a) {
                var _ = _a[0], log = _a[1];
                return longestPrefix + log.str.length;
            }),
            this.logs.map(function (log) { return log.str.length; }),
        ]
            .flat()
            .sort(function (a, b) { return b - a; })[0]) !== null && _b !== void 0 ? _b : 0;
        var textWidth = glyph.width * longestLength;
        var textHeight = 10;
        var paddingX = 3;
        var paddingY = 3;
        // background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(drawX, drawY, textWidth + paddingX * 2, textHeight * lines +
            paddingY * 2 -
            // for the first line, we only want the ascender height
            (textHeight - ascenderHeight));
        // text
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'white';
        watched.forEach(function (_a) {
            var key = _a[0], log = _a[1];
            if (!log.visible)
                return;
            var prefix = "".concat(key).concat(_this.watchedDelimiter);
            prefix += ' '.repeat(longestPrefix - prefix.length);
            ctx.fillStyle = '#e6e6e6';
            ctx.fillText(prefix, drawX + paddingX, drawY + paddingY + ascenderHeight);
            var prefixWidth = ctx.measureText(prefix).width;
            log.renderer(ctx, log, drawX + paddingX + prefixWidth, drawY + paddingY + ascenderHeight);
            drawY += textHeight;
        });
        ctx.fillStyle = 'white';
        logs.forEach(function (log) {
            if (!log.visible)
                return;
            log.renderer(ctx, log, drawX + paddingX, drawY + paddingY + ascenderHeight);
            drawY += textHeight;
        });
    };
    return Logger;
}());
exports.Logger = Logger;
