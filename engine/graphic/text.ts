/* Canvas Lord v0.5.1 */

import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import type { CSSColor } from '../util/types.js';

const { ctx: textCtx } = generateCanvasAndCtx();

interface TextOptions {
	color: CSSColor;
	type: 'fill' | 'stroke';
	font: string;
	size: number;
	align: CanvasTextAlign;
	baseline: CanvasTextBaseline;
	count?: number;
}

// TODO(bret): Make this a global ?
const defaultTextOptions: TextOptions = {
	color: 'white', // what do we want for default?
	type: 'fill',
	font: 'sans-serif',
	size: 10,
	align: 'left',
	// TODO(bret): check if this is the default we want :/
	baseline: 'top',
};

interface IText extends TextOptions {
	str: string;
	maxWidth?: number;
}

export class Text extends Graphic implements IText {
	str: string;

	#count?: number;
	#color!: TextOptions['color'];
	#type!: TextOptions['type'];
	#font!: TextOptions['font'];
	#size!: TextOptions['size'];
	#align!: TextOptions['align'];
	#baseline!: TextOptions['baseline'];

	maxWidth?: number;

	#invalided: Boolean = true;
	#metrics!: TextMetrics;

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
		return (
			this.#metrics.actualBoundingBoxAscent +
			this.#metrics.actualBoundingBoxDescent
		);
	}

	constructor(
		str: string,
		x: number,
		y: number,
		options: Partial<TextOptions> = {},
	) {
		super(x, y);
		this.str = str;

		const _options = Object.assign({}, defaultTextOptions, options);

		this.color = _options.color;
		this.type = _options.type;
		this.font = _options.font;
		this.size = _options.size;
		this.align = _options.align;
		this.baseline = _options.baseline;

		this.#revalidate();
	}

	centerOrigin(): void {
		this.#revalidate();

		this.offsetX = -this.width / 2;
		this.offsetY = -this.height / 2;
	}

	#revalidate() {
		if (!this.#invalided) return;
		this.#invalided = false;

		if (!textCtx) throw new Error();

		// TODO(bret): count
		const { font, size, align, baseline, count } = this;

		textCtx.save();
		const _size = typeof size === 'number' ? `${size}px` : size;
		textCtx.font = `${_size} ${font}`;

		textCtx.textAlign = align;
		textCtx.textBaseline = baseline;

		let _str = this.str;
		if (count !== undefined) _str = _str.slice(0, count);
		this.#metrics = textCtx.measureText(_str);

		textCtx.restore();
	}

	render(ctx: Ctx, camera: Camera = Vec2.zero) {
		const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
		const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
		Draw.text(ctx, this, x, y, this.str);
	}
}
