import { Scene } from '../../bin/canvas-lord.js';

import { init } from '../sandbox.js';

const canvasesDiv = document.getElementById('canvases');

const variants = [
	{ update: 'always', render: 'onUpdate' },
	{ update: 'focus', render: 'onUpdate' },
	{ update: 'onEvent', render: 'onUpdate' },
	{ update: 'manual', render: 'onUpdate' },

	{ update: 'always', render: 'manual' },
	{ update: 'focus', render: 'manual' },
	{ update: 'onEvent', render: 'manual' },
	{ update: 'manual', render: 'manual' },
];

variants.forEach(({ update, render }) => {
	const title = document.createElement('h2');
	title.textContent = `Update: ${update} | Render: ${render}`;

	const canvas = document.createElement('canvas');
	canvas.id = [update, render].join('-');
	canvas.setAttribute('width', '320px');
	canvas.setAttribute('height', '180px');
	canvas.setAttribute('tabindex', '-1');

	canvasesDiv.append(title, canvas);
});

const drawRect = (ctx, fill, ...args) =>
	fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);

const onStart = (game) => {
	const drawOverlay = () => {
		game.ctx.fillStyle = 'rgba(32, 32, 32, 0.5)';
		game.ctx.fillRect(0, 0, 640, 360);
	};

	game.listeners.blur.add(drawOverlay);
	drawOverlay();

	const { canvas } = game;

	const updateButton = document.createElement('button');
	updateButton.textContent = 'Update';
	updateButton.onclick = () => game.update();
	canvas.after(updateButton);

	const renderButton = document.createElement('button');
	renderButton.textContent = 'Render';
	renderButton.onclick = () => game.render();
	updateButton.after(renderButton);
};

class UpdateRenderScene extends Scene {
	updates = 0;
	renders = 0;

	update() {
		++this.updates;
	}

	render(ctx) {
		++this.renders;

		ctx.fillStyle = 'white';
		ctx.fillText(`Update Count: ${this.updates}`, 3, 10);
		ctx.fillText(`Render Count: ${this.renders}`, 3, 22);
		ctx.fillText(`Focued: ${this.engine.focus} (as of last render)`, 3, 34);

		const angle = this.updates / 30;

		const xCenter = 320 / 2;
		const yCenter = 180 / 2;

		const drawSpinningRect = (angle, color) => {
			const scale = 1 + Math.sin(angle) / 4;
			const size = 40 * scale;
			const offset = size / 2;

			const xOffset = Math.cos(angle) * 30;
			const x = xCenter + xOffset - offset;
			const y = yCenter - offset;

			ctx.fillStyle = color;
			drawRect(ctx, true, x, y, size, size);
		};

		const rects = [
			[angle, 'red'],
			[angle + Math.PI, 'green'],
		].sort(([a], [b]) => Math.sign(Math.sin(a) - Math.sin(b)));

		rects.forEach((rect) => drawSpinningRect(...rect));
	}
}

const games = [...document.querySelectorAll('canvas')].map((canvas) => {
	const { id } = canvas;
	const [updateMode, renderMode] = id.split('-');

	const gameLoopSettings = {
		updateMode,
		updateOn: updateMode === 'onEvent' ? ['mousemove'] : undefined,
		renderMode,
	};

	return init.game(id, UpdateRenderScene, {
		remove: false,
		gameSettings: {
			gameLoopSettings,
		},
		onStart,
	});
});

init({ games });
