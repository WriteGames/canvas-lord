"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveEightSystem = exports.circleSystem = exports.rectSystem = exports.imageSystem = void 0;
var draw_js_1 = require("./draw.js");
var components_js_1 = require("./components.js");
var Components = require("./components.js");
exports.imageSystem = {
    render: function (entity, ctx, camera) {
        var _a;
        var _image = (_a = entity.component) === null || _a === void 0 ? void 0 : _a.call(entity, components_js_1.image);
        if (!_image)
            return;
        var drawX = entity.x - camera.x - _image.offsetX;
        var drawY = entity.y - camera.y - _image.offsetY;
        var sourceX = _image.frame * _image.frameW;
        draw_js_1.Draw.image(ctx, _image, drawX, drawY, sourceX, 0, _image.frameW, _image.frameH);
    },
};
exports.rectSystem = {
    update: function (entity) {
        var _a;
        var _rect = (_a = entity.component) === null || _a === void 0 ? void 0 : _a.call(entity, Components.rect);
        if (!_rect)
            return;
        _rect.angle += 2;
    },
    render: function (entity, ctx, camera) {
        var _a;
        var _rect = (_a = entity.component) === null || _a === void 0 ? void 0 : _a.call(entity, Components.rect);
        if (!_rect)
            return;
        draw_js_1.Draw.rect(ctx, _rect, entity.x - camera.x - _rect.offsetX, entity.y - camera.y - _rect.offsetY, _rect.width, _rect.height);
    },
};
exports.circleSystem = {
    render: function (entity, ctx, camera) {
        var _a;
        var _circle = (_a = entity.component) === null || _a === void 0 ? void 0 : _a.call(entity, Components.circle);
        if (!_circle)
            return;
        draw_js_1.Draw.circle(ctx, _circle, entity.x - camera.x - _circle.offsetX, entity.y - camera.y - _circle.offsetY, _circle.radius || 5);
    },
};
exports.moveEightSystem = {
    update: function (entity) {
        var _a;
        var move8Comp = (_a = entity.component) === null || _a === void 0 ? void 0 : _a.call(entity, Components.moveEightComponent);
        if (!move8Comp)
            return;
        var originX = move8Comp.originX, originY = move8Comp.originY, dt = move8Comp.dt;
        entity.x = originX + Math.cos(dt / 16) * 16;
        entity.y = originY + Math.sin(dt / 8) * 8;
        ++move8Comp.dt;
    },
};
