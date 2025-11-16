import { Graphic } from './graphic.js';
import type { Input } from '../core/input.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import { moveCanvas } from '../util/draw.js';
import type { Ctx } from '../util/canvas.js';

export class GraphicList extends Graphic {
	graphics: Graphic[];

	constructor(...graphics: Graphic[]) {
		super(0, 0);

		this.graphics = [];
		this.add(graphics);
	}

	centerOrigin(): void {
		// DECIDE(bret): what should this actually do?
		this.graphics.forEach((graphic) => graphic.centerOrigin());
	}

	add(...graphics: Graphic[] | Graphic[][]): void {
		graphics.flat().forEach((graphic) => {
			if (this.has(graphic)) return;

			graphic.parent = this;
			this.graphics.push(graphic);
		});
	}

	has(graphic: Graphic): boolean {
		return this.graphics.includes(graphic);
	}

	remove(...graphics: Graphic[] | Graphic[][]): void {
		graphics.flat().forEach((graphic) => {
			if (!this.has(graphic)) return;

			const index = this.graphics.indexOf(graphic);
			graphic.parent = undefined;
			this.graphics.splice(index, 1);
		});
	}

	update(input: Input): void {
		this.graphics.forEach((graphic) => graphic.update(input));
	}

	render(ctx: Ctx, camera: Camera = Vec2.zero): void {
		if (!this.visible) return;

		// TODO(bret): Set up transformations here!
		this.scrollX = this.scrollY = 0;
		const preX = this.x;
		const preY = this.y;
		let x = this.x - camera.x * this.scrollX;
		let y = this.y - camera.y * this.scrollY;
		if (this.relative) {
			x += this.parent?.x ?? 0;
			y += this.parent?.y ?? 0;
		}
		this.x = x;
		this.y = y;
		moveCanvas(() => {
			this.graphics.forEach((graphic) => graphic.render(ctx, camera));
		})(ctx, this, x, y);
		this.x = preX;
		this.y = preY;
	}
}
