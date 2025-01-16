import { EPSILON } from './math.js';

interface Shape {
	x: number;
	y: number;
}

interface Rect extends Shape {
	w: number;
	h: number;
}

interface Circle extends Shape {
	radius: number;
}

export const collidePoint = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
) => {
	return Math.abs(x1 - x2) < EPSILON && Math.abs(y1 - y2) < EPSILON;
};

export const collidePointRect = (x: number, y: number, rect: Rect) => {
	return (
		x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h
	);
};

export const collidePointCircle = (x: number, y: number, c: Circle) => {
	const distanceSq = (c.x - x) ** 2 + (c.y - y) ** 2;
	return distanceSq <= c.radius ** 2;
};

export const collideCircleCircle = (a: Circle, b: Circle) => {
	const distanceSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
	return distanceSq <= (a.radius + b.radius) ** 2;
};

export const collideRectRect = (a: Rect, b: Rect) => {
	return (
		a.x + a.w > b.x && a.y + a.h > b.y && a.x < b.x + b.w && a.y < b.y + b.h
	);
};

export const collideRectCircle = (r: Rect, c: Circle) => {
	const x = Math.clamp(c.x, r.x, r.x + r.w - 1);
	const y = Math.clamp(c.y, r.y, r.y + r.h - 1);
	const distanceSq = (c.x - x) ** 2 + (c.y - y) ** 2;
	return distanceSq < c.radius ** 2;
};
