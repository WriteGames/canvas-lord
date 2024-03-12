"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonsOverlay = void 0;
var ButtonsOverlay = /** @class */ (function () {
    function ButtonsOverlay(x, y, keys) {
        this.keyLeftCheck = false;
        this.keyRightCheck = false;
        this.keyJumpCheck = false;
        this.x = x;
        this.y = y;
        this.keys = keys;
    }
    ButtonsOverlay.prototype.update = function (input) {
        this.keyLeftCheck = input.keyCheck(this.keys.left);
        this.keyRightCheck = input.keyCheck(this.keys.right);
        this.keyJumpCheck = input.keyCheck(this.keys.jump);
    };
    ButtonsOverlay.prototype.render = function (ctx) {
        var drawX = this.x, drawY = this.y;
        var buttonSize = 10;
        var padding = 5;
        var fillStyle = function (keyDown) {
            return keyDown ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.75)';
        };
        var strokeStyle = function (keyDown) { return (keyDown ? 'black' : 'white'); };
        var drawButton = function (keyDown, width, overlay) {
            ctx.fillStyle = fillStyle(keyDown);
            ctx.fillRect(drawX, drawY, width, buttonSize);
            ctx.strokeStyle = strokeStyle(keyDown);
            ctx.strokeRect(drawX, drawY, width, buttonSize);
            overlay === null || overlay === void 0 ? void 0 : overlay(keyDown, drawX + width * 0.5, drawY);
            drawX += width + padding;
        };
        drawButton(this.keyLeftCheck, buttonSize, function (keyDown, drawX, drawY) {
            ctx.fillStyle = strokeStyle(keyDown);
            ctx.beginPath();
            ctx.moveTo(drawX - 0.25 * buttonSize, drawY + 0.5 * buttonSize);
            ctx.lineTo(drawX + 0.25 * buttonSize, drawY + 0.75 * buttonSize);
            ctx.lineTo(drawX + 0.25 * buttonSize, drawY + 0.25 * buttonSize);
            ctx.fill();
        });
        drawButton(this.keyJumpCheck, buttonSize * 3);
        drawButton(this.keyRightCheck, buttonSize, function (keyDown, drawX, drawY) {
            ctx.fillStyle = strokeStyle(keyDown);
            ctx.beginPath();
            ctx.moveTo(drawX + 0.25 * buttonSize, drawY + 0.5 * buttonSize);
            ctx.lineTo(drawX - 0.25 * buttonSize, drawY + 0.75 * buttonSize);
            ctx.lineTo(drawX - 0.25 * buttonSize, drawY + 0.25 * buttonSize);
            ctx.fill();
        });
    };
    return ButtonsOverlay;
}());
exports.ButtonsOverlay = ButtonsOverlay;
