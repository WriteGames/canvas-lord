/* Canvas Lord v0.6.1 */

import { Graphic } from './graphic.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';
import type { CSSColor } from '../util/types.js';

const { ctx: textCtx } = generateCanvasAndCtx();

export interface TextOptions {
	color: CSSColor;
	type: 'fill' | 'stroke';
	font: string;
	size: number;
	align: CanvasTextAlign;
	baseline: CanvasTextBaseline;
	count?: number;
}

interface IText extends TextOptions {
	// str: string;
	maxWidth?: number;
}

// TODO(bret): Note that this is global, not just per-Game!
// we're going to want to move all the global things into a special Game._globals probably
const textOptionPresetMap = new Map<string | undefined, TextOptions>();
textOptionPresetMap.set(undefined, {
	color: 'white', // what do we want for default?
	type: 'fill',
	font: 'monospace',
	size: 16,
	align: 'left',
	// DECIDE(bret): check if this is the default we want :/
	baseline: 'top',
});

export class Text extends Graphic implements IText {
	#str: string;

	#count?: number;
	#color!: TextOptions['color'];
	#type!: TextOptions['type'];
	#font!: TextOptions['font'];
	#size!: TextOptions['size'];
	#align!: TextOptions['align'];
	#baseline!: TextOptions['baseline'];

	maxWidth?: number;

	#invalided = true;
	#metrics!: TextMetrics;

	get str(): string {
		return this.#str;
	}
	set str(value) {
		this.#invalided = true;
		this.#str = value;
	}

	get count(): TextOptions['count'] {
		return this.#count;
	}
	set count(value) {
		this.#invalided = true;
		this.#count = value;
	}

	get color(): CSSColor {
		return this.#color;
	}
	set color(value) {
		this.#invalided = true;
		this.#color = value;
	}

	get type(): TextOptions['type'] {
		return this.#type;
	}
	set type(value) {
		this.#invalided = true;
		this.#type = value;
	}

	get font(): TextOptions['font'] {
		return this.#font;
	}
	set font(value) {
		this.#invalided = true;
		this.#font = value;
	}

	get size(): TextOptions['size'] {
		return this.#size;
	}
	set size(value) {
		this.#invalided = true;
		this.#size = value;
	}

	get align(): TextOptions['align'] {
		return this.#align;
	}
	set align(value) {
		this.#invalided = true;
		this.#align = value;
	}

	get baseline(): TextOptions['baseline'] {
		return this.#baseline;
	}
	set baseline(value) {
		this.#invalided = true;
		this.#baseline = value;
	}

	get width(): number {
		this.#revalidate();
		return this.#metrics.width;
	}
	get height(): number {
		this.#revalidate();
		return (
			this.#metrics.actualBoundingBoxAscent +
			this.#metrics.actualBoundingBoxDescent
		);
	}

	constructor(
		str: string,
		x = 0,
		y = 0,
		options?: Partial<TextOptions> | string,
	) {
		super(x, y);
		this.#str = str;

		this.#setOptions(options);

		this.#revalidate();
	}

	#setOptions(options?: Partial<TextOptions> | string): void {
		const _options = {
			...(textOptionPresetMap.get(undefined) as TextOptions),
		};
		if (options !== undefined) {
			Object.assign(
				_options,
				typeof options === 'string'
					? textOptionPresetMap.get(options)
					: options,
			);
		}

		this.color = _options.color;
		this.type = _options.type;
		this.font = _options.font;
		this.size = _options.size;
		this.align = _options.align;
		this.baseline = _options.baseline;
	}

	setOptions(options: Partial<TextOptions>): void {
		this.#setOptions(options);
	}

	resetToDefault(): void {
		this.#setOptions();
	}

	usePreset(name: string): void {
		this.#setOptions(name);
	}

	centerOrigin(): void {
		this.#revalidate();
		this.originX = this.width / 2;
		this.originY = this.height / 2;
	}

	#revalidate(): void {
		if (!this.#invalided) return;
		this.#invalided = false;

		if (!textCtx) throw new Error();

		const { font, size, align, baseline, count } = this;

		textCtx.save();
		const _size = typeof size === 'number' ? `${size}px` : size;
		textCtx.font = `${_size} ${font}`;

		textCtx.textAlign = align;
		textCtx.textBaseline = baseline;

		let _str = this.#str;
		if (count !== undefined) _str = _str.slice(0, count);
		this.#metrics = textCtx.measureText(_str);

		textCtx.restore();
	}

	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.visible) return;

		let x = this.x - camera.x * this.scrollX;
		let y = this.y - camera.y * this.scrollY;
		if (this.relative) {
			x += this.parent?.x ?? 0;
			y += this.parent?.y ?? 0;
		}
		Draw.text(ctx, this, x, y, this.#str);
	}

	static addPreset(name: string, options: Partial<TextOptions>): void {
		if ((name as unknown) === undefined) throw new Error('');
		textOptionPresetMap.set(name, {
			...(textOptionPresetMap.get(undefined) as TextOptions),
			...options,
		});
	}

	static updateDefaultOptions(options: Partial<TextOptions>): void {
		textOptionPresetMap.set(undefined, {
			...(textOptionPresetMap.get(undefined) as TextOptions),
			...options,
		});
	}
}
