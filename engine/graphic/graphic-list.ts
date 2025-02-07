/* Canvas Lord v0.5.2 */

import { Graphic } from './graphic.js';
import type { Input } from '../core/input.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import { moveCanvas } from '../util/draw.js';
import type { Ctx } from '../util/canvas.js';

export class GraphicList extends Graphic {
	graphics: Graphic[];

	constructor(x = 0, y = 0) {
		super(x, y);

		this.graphics = [];
	}

	centerOrigin() {
		// TODO(bret): what should this actually do?
		this.graphics.forEach((graphic) => graphic.centerOrigin());
	}

	add(graphic: Graphic) {
		if (this.has(graphic)) return;

		graphic.parent = this;
		this.graphics.push(graphic);
	}

	has(graphic: Graphic) {
		const index = this.graphics.indexOf(graphic);
		return index > -1;
	}

	remove(graphic: Graphic) {
		if (!this.has(graphic)) return;

		const index = this.graphics.indexOf(graphic);
		graphic.parent = undefined;
		this.graphics.splice(index, 1);
	}

	update(input: Input) {
		this.graphics.forEach((graphic) => graphic.update(input));
	}

	render(ctx: Ctx, camera: Camera = Vec2.zero) {
		// TODO(bret): Set up transformations here!
		this.scrollX = this.scrollY = 0;
		const r = 3;
		const preX = this.x;
		const preY = this.y;
		const x = this.x - camera.x * this.scrollX + (this.parent?.x ?? 0);
		const y = this.y - camera.y * this.scrollY + (this.parent?.y ?? 0);
		this.x = x;
		this.y = y;
		moveCanvas(() => {
			this.graphics.forEach((graphic) => graphic.render(ctx, camera));
		})(ctx, this, x, y);
		this.x = preX;
		this.y = preY;
	}
}
