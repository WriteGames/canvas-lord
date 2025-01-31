import { collideCircleCircle, collideCircleRightTriangle, collideCirclePolygon, collideLineCircle, collideLineLine, collideLineRect, collideLineRightTriangle, collideLinePolygon, collidePointCircle, collidePointGrid, collidePointLine, collidePointPoint, collidePointRect, collidePointRightTriangle, collidePointPolygon, collideRectCircle, collideRectGrid, collideRectRect, collideRectRightTriangle, collideRectPolygon, collideRightTriangleRightTriangle, collideRightTrianglePolygon, collidePolygonPolygon, } from './collision.js';
const collisionMap = {
    point: {
        point: (p1, p2) => collidePointPoint(p1.x, p1.y, p2.x, p2.y),
        line: (p, l) => collidePointLine(p.x, p.y, l),
        rect: (p, r) => collidePointRect(p.x, p.y, r),
        circle: (p, c) => collidePointCircle(p.x, p.y, c),
        'right-triangle': (p, rt) => collidePointRightTriangle(p.x, p.y, rt),
        polygon: (pt, p) => collidePointPolygon(pt.x, pt.y, p),
        grid: (p, g) => collidePointGrid(p.x, p.y, g),
    },
    line: {
        point: (l, p) => collidePointLine(p.x, p.y, l),
        line: collideLineLine,
        rect: collideLineRect,
        circle: collideLineCircle,
        'right-triangle': collideLineRightTriangle,
        polygon: collideLinePolygon,
        grid: undefined,
    },
    rect: {
        point: (r, p) => collidePointRect(p.x, p.y, r),
        line: (r, l) => collideLineRect(l, r),
        rect: collideRectRect,
        circle: collideRectCircle,
        'right-triangle': collideRectRightTriangle,
        polygon: collideRectPolygon,
        grid: collideRectGrid,
    },
    circle: {
        point: (c, p) => collidePointCircle(p.x, p.y, c),
        line: (c, l) => collideLineCircle(l, c),
        rect: (c, r) => collideRectCircle(r, c),
        circle: collideCircleCircle,
        'right-triangle': collideCircleRightTriangle,
        polygon: collideCirclePolygon,
        grid: undefined,
    },
    'right-triangle': {
        point: (rt, p) => collidePointRightTriangle(p.x, p.y, rt),
        line: (rt, l) => collideLineRightTriangle(l, rt),
        rect: (rt, r) => collideRectRightTriangle(r, rt),
        circle: (rt, c) => collideCircleRightTriangle(c, rt),
        'right-triangle': collideRightTriangleRightTriangle,
        polygon: collideRightTrianglePolygon,
        grid: undefined,
    },
    polygon: {
        point: (p, pt) => collidePointPolygon(pt.x, pt.y, p),
        line: (p, l) => collideLinePolygon(l, p),
        rect: (p, r) => collideRectPolygon(r, p),
        circle: (p, c) => collideCirclePolygon(c, p),
        'right-triangle': (p, rt) => collideRightTrianglePolygon(rt, p),
        polygon: collidePolygonPolygon,
        grid: undefined,
    },
    grid: {
        point: (g, p) => collidePointGrid(p.x, p.y, g),
        line: (g, l) => () => { },
        //collideLineGrid(l, g),
        rect: (g, r) => collideRectGrid(r, g),
        circle: (g, c) => () => { },
        //collideCircleGrid(c, g),
        'right-triangle': (g, rt) => () => { },
        // collideRightTriangleGrid(rt, g),
        polygon: (g, p) => () => { },
        //collidePolygonGrid(t, g),
        grid: () => { },
        //collideGridGrid,
    },
};
export const collide = (shapeA, shapeB) => {
    // @ts-expect-error
    return collisionMap[shapeA.type][shapeB.type](shapeA, shapeB);
};
//# sourceMappingURL=collide.js.map