"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inspector = void 0;
var Inspector = /** @class */ (function () {
    function Inspector(engine) {
        this.items = [];
        this.engine = engine;
        var inspectorElem = document.createElement('div');
        inspectorElem.classList.add('inspector');
        engine.focusElement.append(inspectorElem);
        engine.listeners.update.add(this.onUpdate.bind(this));
        this.wrapper = inspectorElem;
    }
    Inspector.prototype.watch = function (property, options) {
        var input = document.createElement('input');
        input.type = 'number';
        this.wrapper.append(property, input);
        if (options) {
            if (options.min !== undefined)
                input.min = String(options.min);
            if (options.max !== undefined)
                input.max = String(options.max);
        }
        var item = {
            input: input,
            latestInput: null,
            property: property,
            focused: false,
        };
        input.addEventListener('input', function (e) {
            var value = e.target.value;
            if (!value)
                return;
            item.latestInput = value;
        });
        this.items.push(item);
    };
    Inspector.prototype.onUpdate = function () {
        var _a, _b;
        var scene = (_a = this.engine.currentScenes) === null || _a === void 0 ? void 0 : _a[0];
        if (!scene)
            return;
        var player = (_b = scene.entities) === null || _b === void 0 ? void 0 : _b[0];
        if (!player)
            return;
        this.items.forEach(function (item) {
            item.focused = document.activeElement === item.input;
        });
        var updatedInputs = this.items.filter(function (p) { return p.latestInput !== null; });
        var otherInputs = this.items.filter(function (p) { return p.latestInput === null; });
        updatedInputs.forEach(function (item) {
            var newValue = Number(item.latestInput);
            if (!isNaN(newValue)) {
                // @ts-expect-error
                player[item.property] = newValue;
            }
            if (!item.focused)
                item.latestInput = null;
        });
        otherInputs.forEach(function (item) {
            // @ts-expect-error
            item.input.value = player[item.property];
        });
    };
    return Inspector;
}());
exports.Inspector = Inspector;
