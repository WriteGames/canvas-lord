/* Canvas Lord v0.6.1 */

import type { AssetManager } from '../core/asset-manager.js';
import {
	addPos,
	hashPos,
	indexToPos,
	posEqual,
	posToIndex,
	scalePos,
	subPos,
	Vec2,
} from '../math/index.js';
import {
	isWithinBounds,
	norm,
	rotateNormBy90Deg,
	type Path,
	type V2CardinalNorm,
	type V2OrthogonalNorm,
} from '../math/misc.js';
import type { Camera } from './camera.js';
import { generateCanvasAndCtx, type Ctx } from './canvas.js';
import type { CSSColor } from './types.js';
import { Draw, drawable } from './draw.js';

const { ctx: pixelCtx } = generateCanvasAndCtx(1, 1, {
	willReadFrequently: true,
});

export interface Grid {
	width: number;
	height: number;
	tileW: number;
	tileH: number;
	columns: number;
	rows: number;
	color: CSSColor;
	renderMode: 0 | 1 | 2;
	data: number[];
}

export class Grid {
	static RenderMode = {
		OUTLINE: 0,
		BOXES_OUTLINE: 1,
		BOXES: 2,
	} as const;

	constructor(width: number, height: number, tileW: number, tileH: number) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);

		const size = this.columns * this.rows;

		this.color = 'rgba(255, 0, 0, 0.6)';
		this.renderMode = 2;
		this.data = Array.from({ length: size }, () => 0);
	}

	static fromBitmap(
		assetManager: AssetManager,
		src: string,
		tileW: number,
		tileH: number,
	): Grid {
		const sprite = assetManager.sprites.get(src);
		if (!sprite?.image) {
			throw new Error('image is not valid');
		}

		if (!pixelCtx) throw Error('pixelCtx failed to create');

		const width = sprite.width * tileW;
		const height = sprite.height * tileH;
		// const stride = sprite.width;

		const grid = new Grid(width, height, tileW, tileH);
		grid.forEach((_, [x, y]) => {
			pixelCtx.drawImage(sprite.image, -x, -y);
			const { data } = pixelCtx.getImageData(0, 0, 1, 1);
			if (data[0] === 0) {
				grid.setTile(x, y, 1);
			}
		});

		return grid;
	}

	static fromArray(
		data: number[],
		width: number,
		height: number,
		tileW: number,
		tileH: number,
	): Grid {
		const grid = new Grid(width, height, tileW, tileH);
		const cellW = width / tileW;
		for (let i = 0; i < data.length; ++i) {
			const value = data[i];
			const x = i % cellW;
			const y = Math.floor(i / cellW);
			grid.setTile(x, y, value);
		}
		return grid;
	}

	// TODO: should width/height be their own properties?
	static fromBinary(
		data: [number, number, ...number[]],
		tileW: number,
		tileH: number,
	): Grid {
		const [width, height, ...gridData] = data;

		const grid = new Grid(width * tileW, height * tileH, tileW, tileH);

		const stride = grid.columns;
		gridData
			.flatMap((b) => b.toString(2).padStart(32, '0').split(''))
			.forEach((v, i) => {
				const [x, y] = indexToPos(i, stride);
				grid.setTile(x, y, +v);
			});

		return grid;
	}

	forEach(callback: (val: number, pos: Vec2) => void): void {
		const stride = this.columns;
		this.data
			.map<[number, Vec2]>((val, i) => [val, indexToPos(i, stride)])
			.forEach((args) => callback(...args));
	}

	inBounds(x: number, y: number): boolean {
		return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
	}

	setTile(x: number, y: number, value: number): void {
		if (!this.inBounds(x, y)) return;
		this.data[y * this.columns + x] = value;
	}

	getTile(x: number, y: number): number {
		if (!this.inBounds(x, y)) return 0;
		return this.data[y * this.columns + x] as unknown as number;
	}

	renderOutline(ctx: Ctx, camera: Camera, x = 0, y = 0): void {
		const stride = this.columns;
		const width = this.tileW;
		const height = this.tileH;

		const [cameraX, cameraY] = camera;

		ctx.save();
		ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		for (let yi = 0; yi < this.rows; ++yi) {
			for (let xi = 0; xi < this.columns; ++xi) {
				if (this.data[yi * stride + xi] === 1) {
					const x1 = xi * this.tileW - cameraX + x;
					const y1 = yi * this.tileH - cameraY + y;
					const x2 = x1 + width - 1;
					const y2 = y1 + height - 1;
					if (!this.getTile(xi - 1, yi)) {
						Draw.line(ctx, drawable, x1, y1, x1, y2);
					}
					if (!this.getTile(xi + 1, yi)) {
						Draw.line(ctx, drawable, x2, y1, x2, y2);
					}
					if (!this.getTile(xi, yi - 1)) {
						Draw.line(ctx, drawable, x1, y1, x2, y1);
					}
					if (!this.getTile(xi, yi + 1)) {
						Draw.line(ctx, drawable, x1, y2, x2, y2);
					}
				}
			}
		}
		ctx.restore();
	}

	renderEachCell(ctx: Ctx, camera: Camera, fill = false): void {
		const stride = this.columns;
		const width = this.tileW - +!fill;
		const height = this.tileH - +!fill;

		const [cameraX, cameraY] = camera;

		if (fill) ctx.fillStyle = this.color;
		else ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		const drawRect = (...args: Parameters<typeof ctx.fillRect>): void =>
			fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);

		const offset = fill ? 0 : 0.5;

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					drawRect(
						x * this.tileW + offset - cameraX,
						y * this.tileH + offset - cameraY,
						width,
						height,
					);
				}
			}
		}
	}

	render(ctx: Ctx, camera: Camera): void {
		switch (this.renderMode) {
			case Grid.RenderMode.OUTLINE:
				this.renderOutline(ctx, camera);
				break;

			case Grid.RenderMode.BOXES_OUTLINE:
				this.renderEachCell(ctx, camera);
				break;

			case Grid.RenderMode.BOXES: {
				const temp = this.color;
				this.color = 'rgba(255, 0, 0, 0.3)';
				this.renderEachCell(ctx, camera, true);
				this.color = temp;
				this.renderEachCell(ctx, camera, false);
				break;
			}
		}
	}
}

type GridOrData = Grid | Grid['data'];

interface Polygon {
	points: Path;
}

function getGridData(
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): [Grid['data'], number, number] {
	if (_grid instanceof Grid) {
		const { data: grid, columns, rows } = _grid;
		return [grid, columns, rows];
	}
	return [_grid, _columns as number, _rows as number];
}

export const findAllPolygonsInGrid = (
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): Polygon[] => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const polygons: Polygon[] = [];

	const offsets = {
		[hashPos(norm.NU)]: [norm.RU, norm.NU],
		[hashPos(norm.ND)]: [norm.LD, norm.ND],
		[hashPos(norm.RN)]: [norm.RD, norm.RN],
		[hashPos(norm.LN)]: [norm.LU, norm.LN],
	} as const;

	const shapes = findAllShapesInGrid(grid, columns, rows);
	shapes.forEach((shape) => {
		const [first] = shape.shapeCells;
		if ((first as unknown) === undefined) return;

		const { gridType } = shape;

		let curDir = norm.ND as unknown as V2OrthogonalNorm;
		let lastDir = curDir;

		const points: Path = [];
		const polygon = { points };
		polygons.push(polygon);

		const addPointsToPolygon = (
			points: Path,
			pos: Vec2,
			interior: boolean,
		): void => {
			const origin = interior ? 0 : -1;
			const size = 16;
			const m1 = size - 1;
			const basePos = scalePos(pos, size);

			const [lastX, lastY] = points.length
				? subPos(points[points.length - 1], basePos)
				: [origin, origin];

			const offset = new Vec2(0, 0);
			switch (curDir) {
				case norm.ND:
					offset[0] = origin;
					offset[1] = lastY;
					break;

				case norm.NU:
					offset[0] = m1 - origin;
					offset[1] = lastY;
					break;

				case norm.RN:
					offset[0] = lastX;
					offset[1] = m1 - origin;
					break;

				case norm.LN:
					offset[0] = lastX;
					offset[1] = origin;
					break;
			}

			points.push(addPos(basePos, offset));
		};

		addPointsToPolygon(points, first, gridType === 1);

		for (
			let next = first, firstIter = true;
			firstIter || !posEqual(curDir, norm.ND) || !posEqual(next, first);
			firstIter = false
		) {
			const [p1, p2] = (
				offsets[hashPos(curDir)] as [V2CardinalNorm, V2CardinalNorm]
			)
				.map((o) => addPos(next, o))
				.map((p) => {
					return isWithinBounds(p, Vec2.zero, new Vec2(columns, rows))
						? (grid[posToIndex(p, columns)] as unknown as number)
						: 0;
				});

			if (p2 === gridType) {
				if (p1 === gridType) {
					next = addPos(next, curDir);
					curDir = rotateNormBy90Deg(curDir, 1);
				}

				next = addPos(next, curDir);

				if (lastDir !== curDir)
					addPointsToPolygon(points, next, gridType === 1);
			} else {
				curDir = rotateNormBy90Deg(curDir, -1);
				addPointsToPolygon(points, next, gridType === 1);
			}

			lastDir = curDir;

			// if (curDir === normND && next === first) break;
		}
	});

	return polygons;
};

interface Shape {
	gridType: number;
	shapeCells: Vec2[];
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

const findAllShapesInGrid = (
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): Shape[] => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const shapes = [];
	const checked = Array.from({ length: columns * rows }, () => false);

	let nextIndex;
	while ((nextIndex = checked.findIndex((v) => !v)) > -1) {
		const shape = fillShape(
			indexToPos(nextIndex, columns),
			checked,
			grid,
			columns,
			rows,
		);

		// Empty shapes must be enclosed
		if (
			shape.gridType === 0 &&
			(shape.minX === 0 ||
				shape.minY === 0 ||
				shape.maxX >= columns ||
				shape.maxY >= rows)
		)
			continue;

		shapes.push(shape);
	}

	return shapes;
};

const fillShape = (
	start: Vec2,
	checked: boolean[],
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): {
	gridType: number;
	shapeCells: Vec2[];
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
} => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const stride = columns;

	const gridType = grid[posToIndex(start, columns)] as unknown as number;

	const queue = [start];
	const visited: string[] = [];

	let next;
	while ((next = queue.pop())) {
		const hash = hashPos(next);
		if (visited.includes(hash)) continue;

		const index = posToIndex(next, stride);
		visited.push(hash);
		if (grid[posToIndex(next, columns)] !== gridType) continue;

		checked[index] = true;

		const [x, y] = next;
		if (x > 0) queue.push(new Vec2(x - 1, y));
		if (x < columns - 1) queue.push(new Vec2(x + 1, y));
		if (y > 0) queue.push(new Vec2(x, y - 1));
		if (y < rows - 1) queue.push(new Vec2(x, y + 1));
	}

	const shapeCells = visited.map(
		(v) => new Vec2(...v.split(',').map((c) => +c)),
	);

	const shapeBounds = shapeCells.reduce(
		(acc, cell) => {
			const [x, y] = cell;
			return {
				minX: Math.min(x, acc.minX),
				maxX: Math.max(x, acc.maxX),
				minY: Math.min(y, acc.minY),
				maxY: Math.max(y, acc.maxY),
			};
		},
		{
			minX: Number.POSITIVE_INFINITY,
			maxX: Number.NEGATIVE_INFINITY,
			minY: Number.POSITIVE_INFINITY,
			maxY: Number.NEGATIVE_INFINITY,
		},
	);

	return {
		...shapeBounds,
		gridType,
		shapeCells,
	};
};

export interface GridOutline {
	grid: Grid | null;
	polygons: Polygon[];
	show: boolean;

	renderOutline: boolean;
	outlineColor: CSSColor;

	renderPoints: boolean;
	pointsColor: CSSColor;
}

export class GridOutline {
	constructor() {
		this.grid = null;
		this.polygons = [];
		this.show = false;

		this.renderOutline = true;
		this.outlineColor = 'red';

		this.renderPoints = true;
		this.pointsColor = 'red';
	}

	computeOutline(grid: Grid): void {
		this.grid = grid;
		this.polygons = findAllPolygonsInGrid(grid);
	}

	render(ctx: Ctx, camera: Camera): void {
		if (!this.show) return;

		// Draw edges
		if (this.renderOutline) {
			this.polygons.forEach((polygon) => {
				ctx.beginPath();
				ctx.strokeStyle = this.outlineColor;
				const start = addPos(polygon.points[0], [0.5, 0.5]);
				const cameraPos = new Vec2(camera[0], camera[1]);
				const [_x, _y] = subPos(start, cameraPos);
				ctx.moveTo(_x, _y);
				polygon.points
					.slice(1)
					.map((p) => subPos(p, camera))
					.forEach(([x, y]) => {
						ctx.lineTo(x + 0.5, y + 0.5);
					});
				ctx.closePath();
				ctx.stroke();
			});
		}

		// Draw points
		if (this.renderPoints) {
			ctx.fillStyle = this.pointsColor;
			this.polygons.forEach((polygon) => {
				polygon.points
					.map((p) => subPos(p, camera))
					.forEach(([x, y]) => {
						ctx.fillRect(x - 1, y - 1, 3, 3);
					});
			});
		}
	}
}
