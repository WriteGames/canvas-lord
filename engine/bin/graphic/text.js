/* Canvas Lord v0.5.3 */
import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
const { ctx: textCtx } = generateCanvasAndCtx();
// TODO(bret): Note that this is global, not just per-Game!
// we're going to want to move all the global things into a special Game._globals probably
const textOptionPresetMap = new Map();
textOptionPresetMap.set(undefined, {
    color: 'white', // what do we want for default?
    type: 'fill',
    font: 'monospace',
    size: 16,
    align: 'left',
    // TODO(bret): check if this is the default we want :/
    baseline: 'top',
});
export class Text extends Graphic {
    #str;
    #count;
    #color;
    #type;
    #font;
    #size;
    #align;
    #baseline;
    maxWidth;
    #invalided = true;
    #metrics;
    get str() {
        return this.#str;
    }
    set str(value) {
        this.#invalided = true;
        this.#str = value;
    }
    get count() {
        return this.#count;
    }
    set count(value) {
        this.#invalided = true;
        this.#count = value;
    }
    get color() {
        return this.#color;
    }
    set color(value) {
        this.#invalided = true;
        this.#color = value;
    }
    get type() {
        return this.#type;
    }
    set type(value) {
        this.#invalided = true;
        this.#type = value;
    }
    get font() {
        return this.#font;
    }
    set font(value) {
        this.#invalided = true;
        this.#font = value;
    }
    get size() {
        return this.#size;
    }
    set size(value) {
        this.#invalided = true;
        this.#size = value;
    }
    get align() {
        return this.#align;
    }
    set align(value) {
        this.#invalided = true;
        this.#align = value;
    }
    get baseline() {
        return this.#baseline;
    }
    set baseline(value) {
        this.#invalided = true;
        this.#baseline = value;
    }
    get width() {
        this.#revalidate();
        return this.#metrics.width;
    }
    get height() {
        this.#revalidate();
        return (this.#metrics.actualBoundingBoxAscent +
            this.#metrics.actualBoundingBoxDescent);
    }
    constructor(str, x, y, options) {
        super(x, y);
        this.#str = str;
        this.#setOptions(options);
        this.#revalidate();
    }
    #setOptions(options) {
        const _options = {
            ...textOptionPresetMap.get(undefined),
        };
        if (options !== undefined) {
            Object.assign(_options, typeof options === 'string'
                ? textOptionPresetMap.get(options)
                : options);
        }
        this.color = _options.color;
        this.type = _options.type;
        this.font = _options.font;
        this.size = _options.size;
        this.align = _options.align;
        this.baseline = _options.baseline;
    }
    setOptions(options) {
        this.#setOptions(options);
    }
    resetToDefault() {
        this.#setOptions();
    }
    usePreset(name) {
        this.#setOptions(name);
    }
    centerOrigin() {
        this.#revalidate();
        this.originX = this.width / 2;
        this.originY = this.height / 2;
    }
    #revalidate() {
        if (!this.#invalided)
            return;
        this.#invalided = false;
        if (!textCtx)
            throw new Error();
        // TODO(bret): count
        const { font, size, align, baseline, count } = this;
        textCtx.save();
        const _size = typeof size === 'number' ? `${size}px` : size;
        textCtx.font = `${_size} ${font}`;
        textCtx.textAlign = align;
        textCtx.textBaseline = baseline;
        let _str = this.#str;
        if (count !== undefined)
            _str = _str.slice(0, count);
        this.#metrics = textCtx.measureText(_str);
        textCtx.restore();
    }
    render(ctx, camera = Vec2.zero) {
        const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
        const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
        Draw.text(ctx, this, x, y, this.#str);
    }
    static addPreset(name, options) {
        if (name === undefined)
            throw new Error('');
        textOptionPresetMap.set(name, {
            ...textOptionPresetMap.get(undefined),
            ...options,
        });
    }
    static updateDefaultOptions(options) {
        textOptionPresetMap.set(undefined, {
            ...textOptionPresetMap.get(undefined),
            ...options,
        });
    }
}
//# sourceMappingURL=text.js.map