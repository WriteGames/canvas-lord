'use client';

import { Engine, Game, Scene } from 'canvas-lord';
import Script from 'next/script';
import { useEffect } from 'react';

export const Canvas = ({ id }: { id: string }) => {
	useEffect(() => {
		const game = new Game(id);

		const drawRect = (
			ctx: CanvasRenderingContext2D,
			fill: boolean,
			...args: Parameters<(typeof ctx)['fillRect']>
		) => (fill ? ctx.fillRect(...args) : ctx.strokeRect(...args));

		const drawOverlay = () => {
			game.ctx.fillStyle = 'rgba(32, 32, 32, 0.5)';
			game.ctx.fillRect(0, 0, 640, 360);
		};

		game.listeners.blur.add(drawOverlay);

		class UpdateRenderScene extends Scene {
			updates = 0;
			renders = 0;

			update() {
				++this.updates;
			}

			render(ctx: CanvasRenderingContext2D) {
				++this.renders;

				ctx.fillStyle = 'white';
				ctx.fillText(`Update Count: ${this.updates}`, 3, 10);
				ctx.fillText(`Render Count: ${this.renders}`, 3, 22);
				ctx.fillText(`Focued: ${this.engine.focus} (as of last render)`, 3, 34);

				const angle = this.updates / 30;

				const xCenter = 320 / 2;
				const yCenter = 180 / 2;

				const drawSpinningRect = (angle: number, color: string) => {
					const scale = 1 + Math.sin(angle) / 4;
					const size = 40 * scale;
					const offset = size / 2;

					const xOffset = Math.cos(angle) * 30;
					const x = xCenter + xOffset - offset;
					const y = yCenter - offset;

					ctx.fillStyle = color;
					drawRect(ctx, true, x, y, size, size);
				};

				const rects: Array<readonly [number, string]> = [
					[angle, 'red'] as const,
					[angle + Math.PI, 'green'] as const,
				].sort(([a], [b]) => Math.sign(Math.sin(a) - Math.sin(b)));

				rects.forEach((rect) => drawSpinningRect(...rect));
			}
		}

		const scene = new UpdateRenderScene(game);

		game.pushScene(scene);

		game.render();
		drawOverlay();
	}, []);

	const canvasStyle = `box-sizing: border-box;
	display: block;
	width: 100%;
	max-width: 640px;
	aspect-ratio: 16 / 9;
	margin: 0 auto;
	padding: 5px;
	border: 3px solid #ddd;
	image-rendering: -moz-crisp-edges;
	image-rendering: -webkit-crisp-edges;
	image-rendering: pixelated;
	image-rendering: crisp-edges;`;

	return (
		<>
			<style>{`canvas {${canvasStyle}}`}</style>
			<canvas id={id} width="320px" height="180px" tabIndex={-1}></canvas>
			<canvas id="basic" width="320px" height="180px" tabIndex={-1}></canvas>
			<canvas
				id="line-segment"
				width="320px"
				height="180px"
				tabIndex={-1}
			></canvas>
			<canvas
				id="contour-tracing"
				width="320px"
				height="180px"
				tabIndex={-1}
			></canvas>
			<Script type="module">{`
				import { initGames } from 'http://canvas-lord.localhost/src/examples.js';
				initGames('http://canvas-lord.localhost/');
			`}</Script>
		</>
	);
};

export default Canvas;
