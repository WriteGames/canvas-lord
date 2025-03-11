import { Scene, Draw } from '../../bin/canvas-lord.js';
import { Text } from '../../bin/graphic/text.js';
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

class TextPresetScene extends Scene {
	constructor(...args) {
		super(...args);
		// Text.addPreset('', );
		Text.updateDefaultOptions({
			color: 'red',
			size: 32,
		});
		Text.addPreset('doom', {
			color: 'yellow',
			font: 'serif',
		});

		const text = new Text('testing', 20, 20);
		this.addGraphic(text);
		const text2 = new Text('testing', 20, 80, 'doom');
		this.addGraphic(text2);

		const text3 = new Text('testing', 20, 140, 'doom');
		this.addGraphic(text3);
		text3.resetToDefault();

		const text4 = new Text('testing', 20, 200);
		this.addGraphic(text4);
		text4.usePreset('doom');
	}
}

class TextCenterScene extends Scene {
	constructor(engine) {
		super(engine);

		const halfW = engine.width >> 1;
		const quarterH = engine.height >> 2;
		const startY = quarterH >> 1;

		let y = startY;
		const texts = Array.from({ length: 3 }, () => {
			const text = new Text('center me', halfW, y);
			y += quarterH;
			return text;
		});

		texts[0].str = 'align center';
		texts[0].align = 'center';

		texts[1].str = 'centerOrigin()';
		texts[1].centerOO();

		texts[2].str = 'both methods lol';
		texts[2].align = 'center';
		texts[2].centerOO();

		texts.forEach((text) => {
			this.addGraphic(text);
		});
	}

	render(ctx, camera) {
		const x = this.engine.width >> 1;
		const h = this.engine.height;
		Draw.line(ctx, { color: 'red' }, x, 0, x, h);

		super.render(ctx, camera);
	}
}

const gameSettings = {
	backgroundColor: '#003300',
	gameLoopSettings: {
		updateMode: 'always',
	},
};

init({
	games: [
		init.game('text-standard', TextStandardScene, {
			gameSettings,
		}),
		init.game('text-presets', TextPresetScene, {
			gameSettings,
		}),
		init.game('text-offsets-and-centering', TextCenterScene, {
			gameSettings,
		}),
	],
});
