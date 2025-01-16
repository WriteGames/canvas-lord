import { EPSILON } from './math.js';
export const collidePoint = (x1, y1, x2, y2) => {
    return Math.abs(x1 - x2) < EPSILON && Math.abs(y1 - y2) < EPSILON;
};
export const collidePointRect = (x, y, rect) => {
    return (x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h);
};
export const collidePointCircle = (x, y, c) => {
    const distanceSq = (c.x - x) ** 2 + (c.y - y) ** 2;
    return distanceSq <= c.radius ** 2;
};
export const collideCircleCircle = (a, b) => {
    const distanceSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    return distanceSq <= (a.radius + b.radius) ** 2;
};
export const collideRectRect = (a, b) => {
    return (a.x + a.w > b.x && a.y + a.h > b.y && a.x < b.x + b.w && a.y < b.y + b.h);
};
export const collideRectCircle = (r, c) => {
    const x = Math.clamp(c.x, r.x, r.x + r.w - 1);
    const y = Math.clamp(c.y, r.y, r.y + r.h - 1);
    const distanceSq = (c.x - x) ** 2 + (c.y - y) ** 2;
    return distanceSq < c.radius ** 2;
};
//# sourceMappingURL=collision.js.map