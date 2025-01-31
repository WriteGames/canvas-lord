/* Canvas Lord v0.4.4 */
import { Vec2, EPSILON, addPos, scalePos, subPos, crossProduct2D, dotProduct2D, } from '../math/index.js';
// TODO: bounds!
// type AlwaysOmit =
// 	| 'type'
// 	| 'collide'
// 	| 'render'
// 	| 'options'
// 	| 'tag'
// 	| 'collidable'
// 	| 'parent';
// type RawCollider<T, O extends keyof Omit<T, AlwaysOmit>> = Omit<
// 	Line,
// 	AlwaysOmit | O
// >;
// type RawLine = RawCollider<Line, 'x' | 'y'>;
// type RawRightTriangle = RawCollider<RightTriangle, 'width' | 'height'>;
// type RawGrid = Omit<GridShape, AlwaysOmit>;
// type RawRect = RawCollider<Rect, 'width' | 'height'>;
// type RawCircle = RawCollider<Circle, 'r'>;
// type RawPolygon = Omit<Polygon, AlwaysOmit>;
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
// TODO(bret): Gonna be able to get this from the collider itself :)
const constructPolygonFromRightTriangle = (rt) => {
    const TL = new Vec2(rt.left, rt.top);
    const TR = new Vec2(rt.right, rt.top);
    const BR = new Vec2(rt.right, rt.bottom);
    const BL = new Vec2(rt.left, rt.bottom);
    let verts;
    switch (rt.orientation) {
        case 'NE': {
            verts = [TL, BR, BL];
            break;
        }
        case 'SE': {
            verts = [TR, BL, TL];
            break;
        }
        case 'SW': {
            verts = [BR, TL, TR];
            break;
        }
        case 'NW': {
            verts = [BL, TR, BR];
            break;
        }
        default:
            throw new Error(`Invalid orientation (${rt.orientation})`);
    }
    // console.log(points[0][0], rt.points[0][0]);
    const lines = [];
    const n = verts.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const x1 = verts[j][0];
        const y1 = verts[j][1];
        const x2 = verts[i][0];
        const y2 = verts[i][1];
        // @ts-expect-error
        lines.push({
            x1,
            y1,
            x2,
            y2,
            xStart: x1,
            yStart: y1,
            xEnd: x2,
            yEnd: y2,
        });
    }
    const polygon = {
        type: 'polygon',
        vertices: verts.map((v) => [v.x, v.y]),
        lines: lines,
        edges: [],
        axes: [],
        collidable: true,
        // x: 0,
        // y: 0,
        x: (rt.x ?? 0) + (rt.parent?.x ?? 0),
        y: (rt.y ?? 0) + (rt.parent?.y ?? 0),
    };
    return polygon;
};
/// ### Point vs X ###
export const collidePointPoint = (aX, aY, bX, bY) => {
    return Math.abs(aX - bX) < EPSILON && Math.abs(aY - bY) < EPSILON;
};
export const collidePointLine = (x, y, x1, y1, x2, y2) => {
    return collideLineCircle(x1, y1, x2, y2, x, y, 0.5);
};
export const collidePointRect = (x, y, left, top, right, bottom) => {
    return x >= left && y >= top && x <= right && y <= bottom;
};
export const collidePointCircle = (x, y, cX, cY, radius) => {
    const distanceSq = (cX - x) ** 2 + (cY - y) ** 2;
    return distanceSq <= radius ** 2;
};
export const collidePointRightTriangle = (x, y, rt) => {
    if (collidePointRect(x, y, rt.left, rt.top, rt.right, rt.bottom)) {
        const TL = new Vec2(rt.left, rt.top);
        const TR = new Vec2(rt.right, rt.top);
        const BR = new Vec2(rt.right, rt.bottom);
        const BL = new Vec2(rt.left, rt.bottom);
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
    const { vertices } = p;
    const n = vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const a = vertices[i];
        const b = vertices[j];
        if (a[1] > y !== b[1] > y &&
            x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
            inside = !inside;
    }
    return inside;
};
// TODO(bret): make sure this is still working
export const collidePointGrid = (x, y, g) => {
    const left = g.x + g.parent.x;
    const top = g.y + g.parent.y;
    const right = g.x + g.parent.x + g.grid.width - 1;
    const bottom = g.y + g.parent.y + g.grid.height - 1;
    if (!collidePointRect(x, y, left, top, right, bottom))
        return false;
    const xx = Math.floor(x / g.grid.tileW);
    const yy = Math.floor(y / g.grid.tileH);
    console.assert(xx === Math.clamp(xx, 0, g.grid.columns - 1));
    console.assert(yy === Math.clamp(yy, 0, g.grid.rows - 1));
    return g.grid.getTile(xx, yy) === 1;
};
/// ### Line vs X ###
export const collideLineLine = (aX1, aY1, aX2, aY2, bX1, bY1, bX2, bY2) => {
    const A = [new Vec2(aX1, aY1), new Vec2(aX2, aY2)];
    const B = [new Vec2(bX1, bY1), new Vec2(bX2, bY2)];
    return checkLineSegmentIntersection(A, B);
};
export const collideLineRect = (x1, y1, x2, y2, left, top, right, bottom) => {
    if (collidePointRect(x1, y1, left, top, right, bottom) ||
        collidePointRect(x2, y2, left, top, right, bottom))
        return true;
    const collideLine = collideLineLine.bind(null, x1, y1, x2, y2);
    return (collideLine(left, top, right, top) ||
        collideLine(right, top, right, bottom) ||
        collideLine(right, bottom, left, bottom) ||
        collideLine(left, bottom, left, top));
};
export const collideLineCircle = (x1, y1, x2, y2, cX, cY, radius) => {
    const pointA = new Vec2(x1, y1);
    const pointB = new Vec2(x2, y2);
    const circlePos = new Vec2(cX, cY);
    const line = pointB.sub(pointA);
    const lineLength = pointB.sub(pointA).magnitude;
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
    return circlePos.sub(closest).magnitude <= radius;
};
export const collideLineRightTriangle = (x1, y1, x2, y2, rt) => {
    return collideLinePolygon(x1, y1, x2, y2, 
    // @ts-expect-error
    constructPolygonFromRightTriangle(rt));
};
export const collideLinePolygon = (x1, y1, x2, y2, p) => {
    // TODO: test if using barycentric coords would be faster!
    const { vertices } = p;
    if (!vertices)
        return false;
    const n = vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        if (collideLineLine(x1, y1, x2, y2, vertices[j][0], vertices[j][1], vertices[i][0], vertices[i][1]))
            return true;
    }
    return false;
};
/// ### Rect vs X ###
export const collideRectRect = (aLeft, aTop, aRight, aBottom, bLeft, bTop, bRight, bBottom) => {
    return (aRight >= bLeft && aBottom >= bTop && aLeft <= bRight && aTop <= bBottom);
};
export const collideRectCircle = (left, top, right, bottom, cX, cY, radius) => {
    const x = Math.clamp(cX, left, right);
    const y = Math.clamp(cY, top, bottom - 1);
    const distanceSq = (cX - x) ** 2 + (cY - y) ** 2;
    return distanceSq < radius ** 2;
};
export const collideRectRightTriangle = (left, top, right, bottom, rt) => {
    // TODO(bret): write a better version of this
    // NOTE(bret): Found this online https://seblee.me/2009/05/super-fast-trianglerectangle-intersection-test/
    return collideRectPolygon(left, top, right, bottom, 
    // @ts-expect-error
    constructPolygonFromRightTriangle(rt));
};
export const collideRectPolygon = (left, top, right, bottom, p) => {
    // TODO(bret): revisit
    // this won't check if it's fully submerged :/ we would need SAT for that!
    const { vertices } = p;
    const n = vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        if (collideLineRect(vertices[j][0], vertices[j][1], vertices[i][0], vertices[i][1], left, top, right, bottom))
            return true;
    }
    return false;
};
export const collideRectGrid = (left, top, right, bottom, g) => {
    // are we within the bounds of the grid???
    const gLeft = g.x + g.parent.x;
    const gTop = g.y + g.parent.y;
    const gRight = g.x + g.parent.x + g.grid.width - 1;
    const gBottom = g.y + g.parent.y + g.grid.height - 1;
    if (!collideRectRect(left, right, top, bottom, gLeft, gTop, gRight, gBottom))
        return false;
    const x = left - gLeft;
    const y = top - gTop;
    // TODO(bret): uncertain if a clamp here is correct
    const minX = Math.clamp(Math.floor(x / g.grid.tileW), 0, g.grid.columns - 1);
    const minY = Math.clamp(Math.floor(y / g.grid.tileH), 0, g.grid.rows - 1);
    // NOTE(bret): these already have -1 applied
    const rectW = right - left;
    const rectH = bottom - top;
    const maxX = Math.clamp(Math.floor((x + rectW) / g.grid.tileW), 0, g.grid.columns - 1);
    const maxY = Math.clamp(Math.floor((y + rectH) / g.grid.tileH), 0, g.grid.rows - 1);
    for (let yy = minY; yy <= maxY; ++yy) {
        for (let xx = minX; xx <= maxX; ++xx) {
            if (g.grid.getTile(xx, yy) === 1)
                return true;
        }
    }
    return false;
};
/// ### Circle vs X ###
export const collideCircleCircle = (aX, aY, aRadius, bX, bY, bRadius) => {
    const distanceSq = (aX - bX) ** 2 + (aY - bY) ** 2;
    return distanceSq <= (aRadius + bRadius) ** 2;
};
export const collideCircleRightTriangle = (cX, cY, radius, rt) => {
    // TODO(bret): Revisit
    return (collideLineCircle(rt.x1, rt.y1, rt.x2, rt.y2, cX, cY, radius) ||
        collideLineCircle(rt.x2, rt.y2, rt.x3, rt.y3, cX, cY, radius) ||
        collideLineCircle(rt.x3, rt.y3, rt.x1, rt.y1, cX, cY, radius));
};
export const collideCirclePolygon = (cX, cY, radius, p) => {
    // TODO(bret): revisit, use SAT
    // this won't check if it's the circle is fully inside the polygon :/ might need SAT for that
    const { vertices } = p;
    const n = vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        if (collideLineCircle(vertices[j][0], vertices[j][1], vertices[i][0], vertices[i][1], cX, cY, radius))
            return true;
    }
    return false;
};
/// ### Right Triangle vs X ###
export const collideRightTriangleRightTriangle = (a, b) => {
    // TODO: revisit
    return collidePolygonPolygon(
    // @ts-expect-error
    constructPolygonFromRightTriangle(a), constructPolygonFromRightTriangle(b));
};
export const collideRightTrianglePolygon = (rt, p) => {
    // TODO: revisit
    // @ts-expect-error
    return collidePolygonPolygon(constructPolygonFromRightTriangle(rt), p);
};
/// ### Polygon vs X ###
const project = (p, axis) => {
    const { vertices } = p;
    let min = axis.dot(new Vec2(vertices[0][0], vertices[0][1]));
    let max = min;
    for (let i = 1; i < vertices.length; ++i) {
        let p = axis.dot(new Vec2(vertices[i][0], vertices[i][1]));
        if (p < min) {
            min = p;
        }
        else if (p > max) {
            max = p;
        }
    }
    return { min, max };
};
export const collidePolygonPolygon = (a, b) => {
    // TODO(bret): revisit
    // we need proper SAT for when shapes are engulfed in their parent
    const axesA = a.axes;
    const axesB = b.axes;
    for (let i = 0; i < axesA.length; ++i) {
        const axis = axesA[i];
        const aa = project(a, axis);
        const bb = project(b, axis);
        if (aa.max >= bb.min && aa.min <= bb.max) {
            return false;
        }
    }
    for (let i = 0; i < axesB.length; ++i) {
        const axis = axesB[i];
        const aa = project(a, axis);
        const bb = project(b, axis);
        if (aa.max >= bb.min && aa.min <= bb.max) {
            return false;
        }
    }
    return true;
};
//# sourceMappingURL=collision.js.map