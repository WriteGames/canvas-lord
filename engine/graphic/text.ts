/* Canvas Lord v0.4.4 */
import { Graphic } from './graphic.js';
import type { ImageAsset } from '../core/asset-manager.js';
import type { Entity } from '../core/entity.js';
import type { Input } from '../core/input.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import { moveCanvas, Draw } from '../util/draw.js';
import { Random } from '../util/random.js';

const textCanvas = document.createElement('canvas');
const textCtx = textCanvas.getContext('2d');
export class Text extends Graphic {
	str: string;

	color: string = 'white'; // what do we want for default?
	type: 'fill' | 'stroke' = 'fill';
	font: string = 'sans-serif';
	size: number = 10;
	align: CanvasTextAlign = 'left';
	// TODO(bret): check if this is the default we want :/
	baseline: CanvasTextBaseline = 'top';

	constructor(str: string, x: number, y: number) {
		super(x, y);
		this.str = str;
	}

	centerOrigin(): void {
		if (!textCtx) throw new Error();

		const {
			font = 'sans-serif',
			size = 10,
			align = 'left',
			baseline = 'top', // TODO(bret): check if this is the default we want :/
			// count,
		} = this;

		textCtx.save();
		const _size = typeof size === 'number' ? `${size}px` : size;
		textCtx.font = `${_size} ${font}`;

		textCtx.textAlign = align;
		textCtx.textBaseline = baseline;

		const metrics = textCtx.measureText(this.str);

		const height =
			metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

		this.offsetX = -metrics.width / 2;
		this.offsetY = -height / 2;
		textCtx.restore();
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera = Vec2.zero) {
		const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
		const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
		Draw.text(ctx, this, x, y, this.str);
	}
}
