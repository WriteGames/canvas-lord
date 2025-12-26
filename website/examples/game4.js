import { V2, Draw, scaleVec, addVec, subVec } from 'canvas-lord';

import { initGamesBase, assetManager } from './base-game';

let progress = 0;
class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	update() {}

	render(ctx, camera) {
		const GAME_W = ctx.canvas.width;
		const GAME_H = ctx.canvas.height;

		const unit = 60;
		const width = unit * 4;
		const height = unit * 3;

		const size = [width, height];
		const halfSize = scaleVec(size, 0.5);

		const center = scaleVec([GAME_W, GAME_H], 0.5);

		Draw.rect(
			ctx,
			{
				type: 'fill',
				color: 'black',
			},
			0,
			0,
			GAME_W,
			GAME_H,
		);

		const upperLeft = subVec(center, halfSize);
		const wide = 1.15;
		const slim = 2.0 - wide;
		const deltas = [
			[unit * wide, unit],
			[unit * slim, -unit],
			[unit * slim, unit],
			[unit * wide, -unit],
			[0, height],
			[-width, 0],
			// [0, height],
		];

		const points = [upperLeft];
		for (let i = 0; i < deltas.length; ++i) {
			const nextPoint = addVec(points[i], deltas[i]);
			points.push(nextPoint);
		}
		ctx.strokeStyle = 'white';

		ctx.save();
		ctx.translate(0, -6);
		{
			ctx.fillStyle = '#f0d57b';
			ctx.beginPath();
			ctx.moveTo(...points.at(-1));
			for (let i = 0, n = points.length; i < n; ++i) {
				ctx.lineTo(...points[i]);
			}
			ctx.fill();

			ctx.save();
			ctx.translate(0.5, 0.5);
			ctx.lineWidth = 3;
			ctx.strokeStyle = '#f0d479';
			ctx.beginPath();
			ctx.moveTo(...points.at(-1));
			for (let i = 0, n = points.length; i < n; ++i) {
				ctx.lineTo(...points[i]);
			}
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
		ctx.restore();

		return;

		const widths = [0.64, 0.5, 0.64];
		const breakpoints = [];
		const totalWidth = widths.reduce((a, v) => {
			const newVal = a + v;
			breakpoints.push(newVal);
			return newVal;
		}, 0);
		progress += 0.005;
		console.log(
			Math.min(0.64, totalWidth * progress).toFixed(2),
			Math.min(0.5, totalWidth * progress - breakpoints[0]).toFixed(2),
		);

		ctx.lineWidth = 3;
		const halfWidth = GAME_W >> 1;
		const offset = halfWidth * 0.25;
		ctx.fillStyle = '#40453e';
		for (let i = 0; i < 2; ++i) {
			ctx.beginPath();
			if (progress > 0) {
				ctx.arc(
					offset,
					GAME_H * 1.2 + 20,
					GAME_W / 3,
					Math.PI * 1.0,
					Math.PI * (1.0 + Math.min(0.64, totalWidth * progress)),
				);
			}
			if (progress * totalWidth > breakpoints[0]) {
				// ctx.stroke();
				// ctx.beginPath();
				ctx.arc(
					halfWidth,
					GAME_H * 1.2,
					GAME_W / 3.0,
					Math.PI * 1.25,
					Math.PI *
						(1.25 + Math.min(0.5, totalWidth * progress - breakpoints[0])),
				);
			}
			if (progress * totalWidth > breakpoints[1]) {
				// ctx.stroke();
				// ctx.beginPath();
				ctx.arc(
					GAME_W - offset,
					GAME_H * 1.2 + 20,
					GAME_W / 3,
					Math.PI * 1.36,
					Math.PI *
						(1.36 + Math.min(0.64, totalWidth * progress - breakpoints[1])),
				);
			}
			i ? ctx.stroke() : ctx.fill();
		}
		ctx.restore();
	}
}
export const initGames = initGamesBase(Player, ['x', 'y']);
