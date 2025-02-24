import { Scene, Draw } from '../../bin/canvas-lord.js';
import { init } from '../sandbox.js';

class TextStandardScene extends Scene {
	constructor(...args) {
		super(...args);
		this._maxWidth = this.engine.canvas.width - 20;
		this.maxWidth = this.engine.canvas.width - 20;
		this._minWidth = 10;
		this.inc = 0;
	}

	update() {
		this.maxWidth =
			this._minWidth +
			Math.round(
				Math.abs(Math.cos(++this.inc / 100)) *
					(this._maxWidth - this._minWidth),
			);
	}

	render(ctx) {
		ctx.fillStyle = 'white';
		const textOptions = {
			type: 'fill',
			font: 'sans-serif',
			size: 12,
		};

		const str = 'This is a whole sentence, we love it!';

		Draw.text(ctx, textOptions, 10, 10, str);

		const drawTextWithRect = (x, y, maxWidth, count) => {
			const height = Draw.text(
				ctx,
				{ ...textOptions, maxWidth, count },
				x,
				y,
				str,
			);

			ctx.strokeStyle = 'red';
			Draw.rect(
				ctx,
				{ type: 'stroke', color: 'red' },
				x - 1,
				y - 1,
				maxWidth + 2,
				height + 2,
			);
		};

		const count = Math.clamp(
			Math.floor(this.inc / 5) % (str.length * 1.3),
			0,
			str.length,
		);
		drawTextWithRect(10, 40, 100, count);
		drawTextWithRect(10, 96, this.maxWidth);
	}
}

const gameSettings = { backgroundColor: '#003300' };

init({
	games: [
		init.game('text-standard', TextStandardScene, {
			gameSettings,
		}),
	],
});
