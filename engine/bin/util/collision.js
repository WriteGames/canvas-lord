import { Vec2, EPSILON, addPos, scalePos, subPos, crossProduct2D, dotProduct2D, } from './math.js';
export const collidePointPoint = (x1, y1, x2, y2) => {
    return Math.abs(x1 - x2) < EPSILON && Math.abs(y1 - y2) < EPSILON;
};
export const collidePointLine = (x, y, line) => {
    return collideLineCircle(line, { x, y, radius: 0.5 });
};
export const collidePointRect = (x, y, r) => {
    return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
};
export const collidePointCircle = (x, y, c) => {
    const distanceSq = (c.x - x) ** 2 + (c.y - y) ** 2;
    return distanceSq <= c.radius ** 2;
};
// TODO: clean these up (would break some non-TS files unfortunately)
const _lineSegmentIntersection = ([a, b], [c, d]) => {
    const r = b.sub(a);
    const s = d.sub(c);
    const rxs = crossProduct2D(r, s);
    const t = crossProduct2D(subPos(c, a), s) / rxs;
    const u = crossProduct2D(subPos(a, c), r) / -rxs;
    return new Vec2(t, u);
};
export const checkLineSegmentIntersection = (a, b) => {
    const [t, u] = _lineSegmentIntersection(a, b);
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
export const getLineSegmentIntersection = (a, b) => {
    const [t, u] = _lineSegmentIntersection(a, b);
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
        ? addPos(a[0], scalePos(subPos(a[1], a[0]), t))
        : null;
};
export const collideLineLine = (l1, l2) => {
    const A = [new Vec2(l1.x1, l1.y1), new Vec2(l1.x2, l1.y2)];
    const B = [new Vec2(l2.x1, l2.y1), new Vec2(l2.x2, l2.y2)];
    return checkLineSegmentIntersection(A, B);
    {
        const A = new Vec2(l1.x1, l1.y1);
        const B = new Vec2(l1.x2, l1.y2);
        const C = new Vec2(l2.x1, l2.y1);
        const D = new Vec2(l2.x2, l2.y2);
        const CmP = C.sub(A);
        const r = B.sub(A);
        const s = D.sub(C);
        const CmPxr = CmP.x * r.y - CmP.y * r.x;
        const CmPxs = CmP.x * s.y - CmP.y * s.x;
        const rxs = r.x * s.y - r.y * s.x;
        if (rxs === 0) {
            console.log('parallel?');
        }
        if (CmPxr === 0) {
            return (C.x - A.x < EPSILON != C.x - B.x < EPSILON ||
                C.y - A.y < EPSILON != C.y - B.y < EPSILON);
        }
        const rxsr = 1 / rxs;
        const t = CmPxs * rxsr;
        const u = CmPxr * rxsr;
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
};
export const collideLineRect = (l, r) => {
    if (collidePointRect(l.x1, l.y1, r) || collidePointRect(l.x2, l.y2, r))
        return true;
    const right = r.x + r.w;
    const bottom = r.y + r.h;
    const edge = { type: 'line', x1: r.x, y1: r.y, x2: r.x, y2: r.y };
    const edgeT = {
        ...edge,
        x2: right,
    };
    const edgeR = {
        ...edge,
        x1: right,
        x2: right,
        y2: bottom,
    };
    const edgeB = {
        ...edge,
        x1: right,
        y1: bottom,
        y2: bottom,
    };
    const edgeL = {
        ...edge,
        y1: bottom,
    };
    if (collideLineLine(l, edgeT) ||
        collideLineLine(l, edgeR) ||
        collideLineLine(l, edgeB) ||
        collideLineLine(l, edgeL))
        return true;
    return false;
};
const getVecLength = (v) => Math.sqrt(v.x ** 2 + v.y ** 2);
const getLineLength = (l) => Math.sqrt((l.x1 - l.x2) ** 2 + (l.y1 - l.y2) ** 2);
export const collideLineCircle = (l, c) => {
    const pointA = new Vec2(l.x1, l.y1);
    const pointB = new Vec2(l.x2, l.y2);
    const circlePos = new Vec2(c.x, c.y);
    const line = pointB.sub(pointA);
    const lineLength = getLineLength(l);
    const norm = line.invScale(lineLength);
    const segmentToCircle = circlePos.sub(pointA);
    const closestPoint = dotProduct2D(segmentToCircle, line) / lineLength;
    let closest;
    if (closestPoint < 0)
        closest = pointA;
    else if (closestPoint > lineLength)
        closest = pointB;
    else
        closest = pointA.add(norm.scale(closestPoint));
    return circlePos.sub(closest).magnitude <= c.radius;
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
export const collideCircleCircle = (a, b) => {
    const distanceSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    return distanceSq <= (a.radius + b.radius) ** 2;
};
//# sourceMappingURL=collision.js.map