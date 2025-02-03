/* Canvas Lord v0.5.1 */
import { collideCircleCircle, collideCircleRightTriangle, collideCirclePolygon, collideLineCircle, collideLineLine, collideLineBox, collideLineRightTriangle, collideLinePolygon, collidePointCircle, collidePointGrid, collidePointLine, collidePointPoint, collidePointBox, collidePointRightTriangle, collidePointPolygon, collideBoxCircle, collideBoxGrid, collideBoxBox, collideBoxRightTriangle, collideBoxPolygon, collideRightTriangleRightTriangle, collideRightTrianglePolygon, collidePolygonPolygon, } from './collision.js';
const dePoint = (p) => [p.left, p.top];
const deLine = (l) => [l.xStart, l.yStart, l.xEnd, l.yEnd];
const deBox = (b) => [b.left, b.top, b.right, b.bottom];
const deCircle = (c) => [c.centerX, c.centerY, c.radius];
const deRT = (rt) => [rt];
const dePolygon = (p) => [p];
const deGrid = (g) => [g];
const collisionMap = {
    point: {
        point: (a, b) => collidePointPoint(...dePoint(a), ...dePoint(b)),
        line: (pt, l) => collidePointLine(...dePoint(pt), ...deLine(l)),
        box: (pt, b) => collidePointBox(...dePoint(pt), ...deBox(b)),
        circle: (pt, c) => collidePointCircle(...dePoint(pt), ...deCircle(c)),
        'right-triangle': (pt, rt) => collidePointRightTriangle(...dePoint(pt), ...deRT(rt)),
        polygon: (pt, p) => collidePointPolygon(...dePoint(pt), ...dePolygon(p)),
        grid: (pt, g) => collidePointGrid(...dePoint(pt), ...deGrid(g)),
    },
    line: {
        point: (l, pt) => collidePointLine(...dePoint(pt), ...deLine(l)),
        line: (a, b) => collideLineLine(...deLine(a), ...deLine(b)),
        box: (l, b) => collideLineBox(...deLine(l), ...deBox(b)),
        circle: (l, c) => collideLineCircle(...deLine(l), ...deCircle(c)),
        'right-triangle': (l, rt) => collideLineRightTriangle(...deLine(l), ...deRT(rt)),
        polygon: (l, p) => collideLinePolygon(...deLine(l), ...dePolygon(p)),
        grid: (l, g) => undefined,
    },
    box: {
        point: (b, pt) => collidePointBox(...dePoint(pt), ...deBox(b)),
        line: (b, l) => collideLineBox(...deLine(l), ...deBox(b)),
        box: (a, b) => collideBoxBox(...deBox(a), ...deBox(b)),
        circle: (b, c) => collideBoxCircle(...deBox(b), ...deCircle(c)),
        'right-triangle': (b, rt) => collideBoxRightTriangle(...deBox(b), ...deRT(rt)),
        polygon: (b, p) => collideBoxPolygon(...deBox(b), ...dePolygon(p)),
        grid: (b, g) => collideBoxGrid(...deBox(b), ...deGrid(g)),
    },
    circle: {
        point: (c, pt) => collidePointCircle(...dePoint(pt), ...deCircle(c)),
        line: (c, l) => collideLineCircle(...deLine(l), ...deCircle(c)),
        box: (c, b) => collideBoxCircle(...deBox(b), ...deCircle(c)),
        circle: (a, b) => collideCircleCircle(...deCircle(a), ...deCircle(b)),
        'right-triangle': (c, rt) => collideCircleRightTriangle(...deCircle(c), ...deRT(rt)),
        polygon: (c, p) => collideCirclePolygon(...deCircle(c), ...dePolygon(p)),
        grid: (c, g) => undefined,
    },
    'right-triangle': {
        point: (rt, pt) => collidePointRightTriangle(...dePoint(pt), ...deRT(rt)),
        line: (rt, l) => collideLineRightTriangle(...deLine(l), ...deRT(rt)),
        box: (rt, b) => collideBoxRightTriangle(...deBox(b), ...deRT(rt)),
        circle: (rt, c) => collideCircleRightTriangle(...deCircle(c), ...deRT(rt)),
        'right-triangle': (a, b) => collideRightTriangleRightTriangle(...deRT(a), ...deRT(b)),
        polygon: (rt, p) => collideRightTrianglePolygon(...deRT(rt), ...dePolygon(p)),
        grid: (rt) => undefined,
    },
    polygon: {
        point: (p, pt) => collidePointPolygon(...dePoint(pt), ...dePolygon(p)),
        line: (p, l) => collideLinePolygon(...deLine(l), ...dePolygon(p)),
        box: (p, b) => collideBoxPolygon(...deBox(b), ...dePolygon(p)),
        circle: (p, c) => collideCirclePolygon(...deCircle(c), ...dePolygon(p)),
        'right-triangle': (p, rt) => collideRightTrianglePolygon(...deRT(rt), ...dePolygon(p)),
        polygon: (a, b) => collidePolygonPolygon(...dePolygon(a), ...dePolygon(b)),
        grid: (p, g) => undefined,
    },
    grid: {
        point: (g, pt) => collidePointGrid(...dePoint(pt), ...deGrid(g)),
        line: (g, l) => undefined,
        //collideLineGrid(l, g),
        box: (g, b) => collideBoxGrid(...deBox(b), ...deGrid(g)),
        circle: (g, c) => undefined,
        //collideCircleGrid(c, g),
        'right-triangle': (g, rt) => undefined,
        // collideRightTriangleGrid(rt, g),
        polygon: (g, p) => undefined,
        //collidePolygonGrid(t, g),
        grid: (a, b) => undefined,
        //collideGridGrid,
    },
};
export const collide = (shapeA, shapeB) => {
    // @ts-expect-error
    return collisionMap[shapeA.type][shapeB.type](shapeA, shapeB);
};
//# sourceMappingURL=collide.js.map