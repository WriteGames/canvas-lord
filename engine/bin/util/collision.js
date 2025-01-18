import { Vec2, EPSILON, addPos, scalePos, subPos, crossProduct2D, dotProduct2D, } from './math.js';
const types = [
    'point',
    'line',
    'rect',
    'circle',
    'triangle',
    'right-triangle',
];
const ORIENTATION = ['NE', 'SE', 'SW', 'NW'];
const isPointInPolygon = (x, y, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i];
        const b = polygon[j];
        if (a[1] > y !== b[1] > y &&
            x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
            inside = !inside;
    }
    return inside;
};
const getSideOfLine = (x, y, lineA, lineB) => {
    const d = (lineB.y - lineA.y) * (x - lineA.x) -
        (lineB.x - lineA.x) * (y - lineA.y);
    return Math.sign(d);
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
const getLineLength = (l) => Math.sqrt((l.x1 - l.x2) ** 2 + (l.y1 - l.y2) ** 2);
/// ### Point vs X ###
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
export const collidePointRightTriangle = (x, y, rt) => {
    if (collidePointRect(x, y, rt)) {
        const TL = new Vec2(rt.x, rt.y);
        const TR = new Vec2(rt.x + rt.w, rt.y);
        const BR = new Vec2(rt.x + rt.w, rt.y + rt.h);
        const BL = new Vec2(rt.x, rt.y + rt.h);
        let side;
        switch (rt.orientation) {
            case 'NE':
                side = getSideOfLine(x, y, TL, BR);
                break;
            case 'SE':
                side = getSideOfLine(x, y, TR, BL);
                break;
            case 'SW':
                side = getSideOfLine(x, y, BR, TL);
                break;
            case 'NW':
                side = getSideOfLine(x, y, BL, TR);
                break;
            default:
                throw new Error('need to implement');
        }
        return side <= 0;
    }
    return false;
};
export const collidePointTriangle = (x, y, t) => {
    return isPointInPolygon(x, y, [
        [t.x1, t.y1],
        [t.x2, t.y2],
        [t.x3, t.y3],
    ]);
};
/// ### Line vs X ###
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
export const collideLineRightTriangle = (l, rt) => {
    throw new Error('Unimplemented');
};
export const collideLineTriangle = (l, t) => {
    // TODO: test if using barycentric coords would be faster!
    return (collideLineLine(l, {
        x1: t.x1,
        y1: t.y1,
        x2: t.x2,
        y2: t.y2,
    }) ||
        collideLineLine(l, {
            x1: t.x2,
            y1: t.y2,
            x2: t.x3,
            y2: t.y3,
        }) ||
        collideLineLine(l, {
            x1: t.x3,
            y1: t.y3,
            x2: t.x1,
            y2: t.y1,
        }));
};
/// ### Rect vs X ###
export const collideRectRect = (a, b) => {
    return (a.x + a.w > b.x && a.y + a.h > b.y && a.x < b.x + b.w && a.y < b.y + b.h);
};
export const collideRectCircle = (r, c) => {
    const x = Math.clamp(c.x, r.x, r.x + r.w - 1);
    const y = Math.clamp(c.y, r.y, r.y + r.h - 1);
    const distanceSq = (c.x - x) ** 2 + (c.y - y) ** 2;
    return distanceSq < c.radius ** 2;
};
export const collideRectRightTriangle = (r, rt) => {
    // TODO: just intersect each line with the rect
    throw new Error('Unimplemented');
};
export const collideRectTriangle = (r, t) => {
    // TODO: just intersect each line with the rect
    throw new Error('Unimplemented');
};
/// ### Circle vs X ###
export const collideCircleCircle = (a, b) => {
    const distanceSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    return distanceSq <= (a.radius + b.radius) ** 2;
};
export const collideCircleRightTriangle = (c, rt) => {
    throw new Error('Unimplemented');
};
export const collideCircleTriangle = (c, t) => {
    throw new Error('Unimplemented');
};
/// ### Right Triangle vs X ###
export const collideRightTriangleRightTriangle = (r) => {
    throw new Error('Unimplemented');
};
export const collideRightTriangleTriangle = () => {
    throw new Error('Unimplemented');
};
/// ### Triangle vs X ###
export const collideTriangleTriangle = () => {
    throw new Error('Unimplemented');
};
/// ### collide() ###
const collisionMap = {
    point: {
        point: (p1, p2) => collidePointPoint(p1.x, p1.y, p2.x, p2.y),
        line: (p, l) => collidePointLine(p.x, p.y, l),
        rect: (p, r) => collidePointRect(p.x, p.y, r),
        circle: (p, c) => collidePointCircle(p.x, p.y, c),
        'right-triangle': collidePointRightTriangle,
        triangle: (p, t) => collidePointTriangle(p.x, p.y, t),
    },
    line: {
        point: (l, p) => collidePointLine(p.x, p.y, l),
        line: collideLineLine,
        rect: collideLineRect,
        circle: collideLineCircle,
        'right-triangle': undefined,
        triangle: collideLineTriangle,
    },
    rect: {
        point: (r, p) => collidePointRect(p.x, p.y, r),
        line: (r, l) => collideLineRect(l, r),
        rect: collideRectRect,
        circle: collideRectCircle,
        'right-triangle': undefined,
        triangle: collideRectTriangle,
    },
    circle: {
        point: (c, p) => collidePointCircle(p.x, p.y, c),
        line: (c, l) => collideLineCircle(l, c),
        rect: (c, r) => collideRectCircle(r, c),
        circle: collideCircleCircle,
        'right-triangle': undefined,
        triangle: collideCircleTriangle,
    },
    'right-triangle': {
        point: (rt, p) => collidePointRightTriangle(p.x, p.y, rt),
        line: undefined,
        rect: undefined,
        circle: undefined,
        'right-triangle': undefined,
        triangle: undefined,
    },
    triangle: {
        point: (t, p) => collidePointTriangle(p.x, p.y, t),
        line: (t, l) => collideLineTriangle(l, t),
        rect: (t, r) => collideRectTriangle(r, t),
        circle: (t, c) => collideCircleTriangle(c, t),
        'right-triangle': undefined,
        triangle: collideTriangleTriangle,
    },
};
// TODO: (shapeA, typeA, shapeB, typeB) - that way we don't have to store that data in the shapes themselves! This will make using the Collider classes easier, as they won't have to store that data :)
export const collide = (shapeA, shapeB) => {
    // @ts-ignore
    return collisionMap[shapeA.type][shapeB.type]?.(shapeA, shapeB);
};
//# sourceMappingURL=collision.js.map