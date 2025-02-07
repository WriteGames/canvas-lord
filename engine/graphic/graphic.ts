/* Canvas Lord v0.5.1 */

import type { Input } from '../core/input.js';
import { Vec2 } from '../math/index.js';
import type { Camera } from '../util/camera.js';
import type { Ctx } from '../util/canvas.js';

export interface GraphicParent {
	x: number;
	y: number;
	update: (input: Input) => void;
	render: (ctx: Ctx, camera: Camera) => void;
}

export interface IGraphic {
	x: number;
	y: number;
	angle: number;
	// scale: number;
	scaleX: number;
	scaleY: number;
	originX: number;
	originY: number;
	scrollX: number;
	scrollY: number;
	alpha: number;
	parent: GraphicParent | undefined;
	centerOrigin: () => void;
	centerOO: () => void;
	update: (input: Input) => void;
	render: (ctx: Ctx, camera: Camera) => void;
	reset: () => void;
}

export class Graphic implements IGraphic {
	x: number;
	y: number;
	angle = 0;
	scaleX = 1;
	scaleY = 1;
	originX = 0;
	originY = 0;
	// TODO(bret): get rid of these :) they're really just the x/y
	offsetX = 0;
	offsetY = 0;
	scrollX = 1;
	scrollY = 1;
	alpha = 1;
	parent: GraphicParent | undefined;

	// TODO(bret): What should get scale() return??

	set scale(value: number) {
		this.scaleX = this.scaleY = value;
	}

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	centerOrigin(): void {
		// TODO(bret): check if invalidated, if so, recalculate!
		throw new Error('unimplemented');
	}

	centerOO(): void {
		this.centerOrigin();
	}

	update(input: Input): void {}

	render(ctx: Ctx, camera: Camera = Vec2.zero) {}

	reset() {
		this.x = 0;
		this.y = 0;
		this.alpha = 1;
		this.angle = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.scaleX = 0;
		this.scaleY = 0;
		this.scrollX = 1;
		this.scrollY = 1;
	}
}
