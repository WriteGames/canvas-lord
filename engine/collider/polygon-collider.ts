/* Canvas Lord v0.6.1 */

import { Collider } from './collider.js';
import { Vec2 } from '../math/index.js';
import type { Ctx } from '../util/canvas.js';
import { Draw } from '../util/draw.js';

type Point = [number, number];
type Points = [Point, Point, Point];

interface IPolygonCollider {
	type: 'polygon';
}

interface Line {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export class PolygonCollider extends Collider implements IPolygonCollider {
	type = 'polygon' as const;

	#points: Points;

	get left(): number {
		return Math.min(...this.vertices.map(([x]) => x - this.originX));
	}
	get top(): number {
		return Math.min(...this.vertices.map(([_, y]) => y - this.originY));
	}
	get right(): number {
		return Math.max(...this.vertices.map(([x]) => x - this.originX));
	}
	get bottom(): number {
		return Math.max(...this.vertices.map(([_, y]) => y - this.originY));
	}

	setPoints(value: Points): void {
		this.#points = value;
	}

	get vertices(): Points {
		return this.#points.map(([x, y]) => [
			x + this.x + this.parent.x - this.originX,
			y + this.y + this.parent.y - this.originY,
		]) as Points;
	}

	get lines(): Line[] {
		const lines: Line[] = [];
		const { vertices } = this;
		const n = vertices.length;
		for (let i = 0, j = n - 1; i < n; j = i++) {
			lines.push({
				x1: vertices[j][0],
				y1: vertices[j][1],
				x2: vertices[i][0],
				y2: vertices[i][1],
			});
		}
		return lines;
	}

	get edges(): Vec2[] {
		const lines = this.lines;
		return lines.map(({ x1, y1, x2, y2 }) => new Vec2(x2 - x1, y2 - y1));
	}

	get axes(): Vec2[] {
		const axes = this.edges.map(([_x, _y]) => new Vec2(-_y, _x));
		axes.forEach((axis) => Vec2.normalize(axis));
		return axes;
	}

	// TODO(bret): throw error if points are invalid
	constructor(points: Points, x = 0, y = 0) {
		super(x, y);

		this.#points = points;
	}

	render(ctx: Ctx, x = 0, y = 0): void {
		const drawX = x + this.parent.x;
		const drawY = y + this.parent.y;
		Draw.polygon(ctx, this.options, drawX, drawY, this.#points);
	}
}
