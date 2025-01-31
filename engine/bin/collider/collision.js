/* Canvas Lord v0.4.4 */
import { Vec2, EPSILON, addPos, scalePos, subPos, crossProduct2D, dotProduct2D, } from '../math/index.js';
const getSideOfLine = (x, y, lineA, lineB) => {
    const d = (lineB.y - lineA.y) * (x - lineA.x) -
        (lineB.x - lineA.x) * (y - lineA.y);
    return Math.sign(d);
};
// TODO: clean these up (would break some non-TS files unfortunately)
const _lineSegmentIntersection = ([a, b], [c, d]) => {
    const r = subPos(b, a);
    const s = subPos(d, c);
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
// TODO(bret): Gonna be able to get this from the collider itself :)
const constructPolygonFromRightTriangle = (rt) => {
    const TL = new Vec2(0, 0);
    const TR = new Vec2(0 + rt.w, 0);
    const BR = new Vec2(0 + rt.w, 0 + rt.h);
    const BL = new Vec2(0, 0 + rt.h);
    let points;
    switch (rt.orientation) {
        case 'NE': {
            points = [TL, BR, BL];
            break;
        }
        case 'SE': {
            points = [TR, BL, TL];
            break;
        }
        case 'SW': {
            points = [BR, TL, TR];
            break;
        }
        case 'NW': {
            points = [BL, TR, BR];
            break;
        }
        default:
            throw new Error(`Invalid orientation (${rt.orientation})`);
    }
    const lines = [];
    const n = points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        lines.push({
            x1: rt.x + points[j][0],
            y1: rt.y + points[j][1],
            x2: rt.x + points[i][0],
            y2: rt.y + points[i][1],
        });
    }
    const polygon = {
        type: 'polygon',
        points: points.map((v) => [v.x, v.y]),
        lines,
        collidable: true,
        x: rt.x,
        y: rt.y,
    };
    return polygon;
};
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
                throw new Error(`Invalid orientation (${rt.orientation})`);
        }
        return side <= 0;
    }
    return false;
};
export const collidePointPolygon = (x, y, p) => {
    let inside = false;
    const points = p.points.map(([_x, _y]) => [_x + p.x, _y + p.y]);
    const n = points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const a = points[i];
        const b = points[j];
        if (a[1] > y !== b[1] > y &&
            x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
            inside = !inside;
    }
    return inside;
};
export const collidePointGrid = (x, y, g) => {
    const gridRect = {
        x: g.x,
        y: g.y,
        w: g.grid.width,
        h: g.grid.height,
    };
    if (!collidePointRect(x, y, gridRect))
        return false;
    const xx = Math.floor(x / g.grid.tileW);
    const yy = Math.floor(y / g.grid.tileH);
    console.assert(xx === Math.clamp(xx, 0, g.grid.columns - 1));
    console.assert(yy === Math.clamp(yy, 0, g.grid.rows - 1));
    return g.grid.getTile(xx, yy) === 1;
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
    const edge = {
        x1: r.x,
        y1: r.y,
        x2: r.x,
        y2: r.y,
    };
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
    return collideLinePolygon(l, constructPolygonFromRightTriangle(rt));
};
export const collideLinePolygon = (l, p) => {
    // TODO: test if using barycentric coords would be faster!
    const { lines } = p;
    if (!lines)
        return false;
    const n = lines.length;
    for (let i = 0; i < n; ++i) {
        if (collideLineLine(l, lines[i]))
            return true;
    }
    return false;
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
    // TODO(bret): write a better version of this
    // NOTE(bret): Found this online https://seblee.me/2009/05/super-fast-trianglerectangle-intersection-test/
    return collideRectPolygon(r, constructPolygonFromRightTriangle(rt));
};
export const collideRectPolygon = (r, p) => {
    // TODO(bret): revisit
    // this won't check if it's fully submerged :/ we would need SAT for that!
    const { lines } = p;
    const n = lines.length;
    for (let i = 0; i < n; ++i) {
        if (collideLineRect(lines[i], r))
            return true;
    }
    return false;
};
export const collideRectGrid = (r, g) => {
    // are we within the bounds of the grid???
    const x = r.x - g.x;
    const y = r.y - g.y;
    const gridRect = {
        x: g.x,
        y: g.y,
        w: g.grid.width,
        h: g.grid.height,
    };
    if (!collideRectRect(r, gridRect))
        return false;
    // TODO(bret): uncertain if a clamp here is correct
    const minX = Math.clamp(Math.floor(x / g.grid.tileW), 0, g.grid.columns - 1);
    const minY = Math.clamp(Math.floor(y / g.grid.tileH), 0, g.grid.rows - 1);
    const maxX = Math.clamp(Math.floor((x + r.w - 1) / g.grid.tileW), 0, g.grid.columns - 1);
    const maxY = Math.clamp(Math.floor((y + r.h - 1) / g.grid.tileH), 0, g.grid.rows - 1);
    for (let yy = minY; yy <= maxY; ++yy) {
        for (let xx = minX; xx <= maxX; ++xx) {
            if (g.grid.getTile(xx, yy) === 1)
                return true;
        }
    }
    return false;
};
/// ### Circle vs X ###
export const collideCircleCircle = (a, b) => {
    const distanceSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    return distanceSq <= (a.radius + b.radius) ** 2;
};
export const collideCircleRightTriangle = (c, rt) => {
    // TODO(bret): Revisit
    return collideCirclePolygon(c, constructPolygonFromRightTriangle(rt));
};
export const collideCirclePolygon = (c, p) => {
    // TODO(bret): revisit
    // this won't check if it's the circle is fully inside the polygon :/ might need SAT for that
    const { lines } = p;
    const n = lines.length;
    for (let i = 0; i < n; ++i) {
        if (collideLineCircle(lines[i], c))
            return true;
    }
    return false;
};
/// ### Right Triangle vs X ###
export const collideRightTriangleRightTriangle = (a, b) => {
    // TODO: revisit
    return collidePolygonPolygon(constructPolygonFromRightTriangle(a), constructPolygonFromRightTriangle(b));
};
export const collideRightTrianglePolygon = (rt, p) => {
    // TODO: revisit
    return collidePolygonPolygon(constructPolygonFromRightTriangle(rt), p);
};
/// ### Polygon vs X ###
export const collidePolygonPolygon = (a, b) => {
    // TODO(bret): revisit
    // we need proper SAT for when shapes are engulfed in their parent
    const linesA = a.lines;
    const linesB = b.lines;
    for (let x = 0; x < linesA.length; ++x) {
        for (let y = 0; y < linesB.length; ++y) {
            if (collideLineLine(linesA[x], linesB[y])) {
                return true;
            }
        }
    }
    return false;
};
//# sourceMappingURL=collision.js.map