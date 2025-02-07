/* Canvas Lord v0.5.2 */

import { Input, Key } from '../core/input.js';
import type { Ctx } from '../util/canvas.js';

interface ButtonsOverlayKeys {
	left: Key[];
	right: Key[];
	jump: Key[];
}

type Overlay = (keyDown: boolean, drawX: number, drawY: number) => void;

export class ButtonsOverlay {
	x: number;
	y: number;
	keys: ButtonsOverlayKeys;
	keyLeftCheck = false;
	keyRightCheck = false;
	keyJumpCheck = false;

	constructor(x: number, y: number, keys: ButtonsOverlayKeys) {
		this.x = x;
		this.y = y;

		this.keys = keys;
	}

	update(input: Input) {
		this.keyLeftCheck = input.keyCheck(this.keys.left);
		this.keyRightCheck = input.keyCheck(this.keys.right);
		this.keyJumpCheck = input.keyCheck(this.keys.jump);
	}

	render(ctx: Ctx) {
		let drawX = this.x,
			drawY = this.y;

		const buttonSize = 10;
		const padding = 5;

		const fillStyle = (keyDown: boolean) =>
			keyDown ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.75)';
		const strokeStyle = (keyDown: boolean) => (keyDown ? 'black' : 'white');

		const drawButton = (
			keyDown: boolean,
			width: number,
			overlay?: Overlay,
		) => {
			ctx.fillStyle = fillStyle(keyDown);
			ctx.fillRect(drawX, drawY, width, buttonSize);

			ctx.strokeStyle = strokeStyle(keyDown);
			ctx.strokeRect(drawX, drawY, width, buttonSize);

			overlay?.(keyDown, drawX + width * 0.5, drawY);

			drawX += width + padding;
		};

		drawButton(this.keyLeftCheck, buttonSize, (keyDown, drawX, drawY) => {
			ctx.fillStyle = strokeStyle(keyDown);
			ctx.beginPath();
			ctx.moveTo(drawX - 0.25 * buttonSize, drawY + 0.5 * buttonSize);
			ctx.lineTo(drawX + 0.25 * buttonSize, drawY + 0.75 * buttonSize);
			ctx.lineTo(drawX + 0.25 * buttonSize, drawY + 0.25 * buttonSize);
			ctx.fill();
		});
		drawButton(this.keyJumpCheck, buttonSize * 3);
		drawButton(this.keyRightCheck, buttonSize, (keyDown, drawX, drawY) => {
			ctx.fillStyle = strokeStyle(keyDown);
			ctx.beginPath();
			ctx.moveTo(drawX + 0.25 * buttonSize, drawY + 0.5 * buttonSize);
			ctx.lineTo(drawX - 0.25 * buttonSize, drawY + 0.75 * buttonSize);
			ctx.lineTo(drawX - 0.25 * buttonSize, drawY + 0.25 * buttonSize);
			ctx.fill();
		});
	}
}
