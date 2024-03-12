"use strict";
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
exports.Draw = exports.drawable = void 0;
// TODO(bret): Rounded rectangle https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
exports.drawable = {
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 0,
    originY: 0,
    offsetX: 0,
    offsetY: 0,
};
var moveCanvas = function (callback) {
    return function (ctx, options, x, y) {
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        var _a = Object.assign({}, exports.drawable, options), originX = _a.originX, originY = _a.originY, angle = _a.angle, scaleX = _a.scaleX, scaleY = _a.scaleY;
        ctx.save();
        ctx.translate(originX, originY);
        ctx.translate(x, y);
        ctx.rotate((angle / 180) * Math.PI);
        ctx.translate(-x, -y);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-originX, -originY);
        callback.apply(void 0, __spreadArray([ctx, options, x / scaleX, y / scaleY], args, false));
        ctx.restore();
    };
};
exports.Draw = {
    circle: moveCanvas(function (ctx, circle, x, y, radius) {
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
        switch (circle.type) {
            case 'fill':
                {
                    ctx.fillStyle = circle.color;
                    ctx.fill();
                }
                break;
            case 'stroke':
                {
                    ctx.strokeStyle = circle.color;
                    ctx.stroke();
                }
                break;
        }
    }),
    line: moveCanvas(function (ctx, options, x1, y1, x2, y2) {
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }),
    rect: moveCanvas(function (ctx, rect, x, y, w, h) {
        var args = [x, y, w, h];
        switch (rect.type) {
            case 'fill':
                {
                    ctx.fillStyle = rect.color;
                    ctx.fillRect.apply(ctx, args);
                }
                break;
            case 'stroke':
                {
                    ctx.strokeStyle = rect.color;
                    ctx.strokeRect.apply(ctx, args);
                }
                break;
        }
    }),
    image: moveCanvas(function (ctx, image, drawX, drawY, sourceX, sourceY, width, height) {
        var imageSrc = image.imageSrc;
        if (!imageSrc)
            return;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(imageSrc, sourceX, sourceY, width, height, drawX, drawY, width, height);
    }),
};
