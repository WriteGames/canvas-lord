import { collideCircleCircle, collideCircleRightTriangle, collideCircleTriangle, collideLineCircle, collideLineLine, collideLineRect, collideLineRightTriangle, collideLineTriangle, collidePointCircle, collidePointGrid, collidePointLine, collidePointPoint, collidePointRect, collidePointRightTriangle, collidePointTriangle, collideRectCircle, collideRectGrid, collideRectRect, collideRectRightTriangle, collideRectTriangle, collideRightTriangleRightTriangle, collideRightTriangleTriangle, collideTriangleTriangle, } from './collision.js';
const collisionMap = {
    point: {
        point: (p1, p2) => collidePointPoint(p1.x, p1.y, p2.x, p2.y),
        line: (p, l) => collidePointLine(p.x, p.y, l),
        rect: (p, r) => collidePointRect(p.x, p.y, r),
        circle: (p, c) => collidePointCircle(p.x, p.y, c),
        'right-triangle': (p, rt) => collidePointRightTriangle(p.x, p.y, rt),
        triangle: (p, t) => collidePointTriangle(p.x, p.y, t),
        grid: (p, g) => collidePointGrid(p.x, p.y, g),
    },
    line: {
        point: (l, p) => collidePointLine(p.x, p.y, l),
        line: collideLineLine,
        rect: collideLineRect,
        circle: collideLineCircle,
        'right-triangle': collideLineRightTriangle,
        triangle: collideLineTriangle,
        grid: undefined,
    },
    rect: {
        point: (r, p) => collidePointRect(p.x, p.y, r),
        line: (r, l) => collideLineRect(l, r),
        rect: collideRectRect,
        circle: collideRectCircle,
        'right-triangle': collideRectRightTriangle,
        triangle: collideRectTriangle,
        grid: collideRectGrid,
    },
    circle: {
        point: (c, p) => collidePointCircle(p.x, p.y, c),
        line: (c, l) => collideLineCircle(l, c),
        rect: (c, r) => collideRectCircle(r, c),
        circle: collideCircleCircle,
        'right-triangle': collideCircleRightTriangle,
        triangle: collideCircleTriangle,
        grid: undefined,
    },
    'right-triangle': {
        point: (rt, p) => collidePointRightTriangle(p.x, p.y, rt),
        line: (rt, l) => collideLineRightTriangle(l, rt),
        rect: (rt, r) => collideRectRightTriangle(r, rt),
        circle: (rt, c) => collideCircleRightTriangle(c, rt),
        'right-triangle': collideRightTriangleRightTriangle,
        triangle: collideRightTriangleTriangle,
        grid: undefined,
    },
    triangle: {
        point: (t, p) => collidePointTriangle(p.x, p.y, t),
        line: (t, l) => collideLineTriangle(l, t),
        rect: (t, r) => collideRectTriangle(r, t),
        circle: (t, c) => collideCircleTriangle(c, t),
        'right-triangle': (t, rt) => collideRightTriangleTriangle(rt, t),
        triangle: collideTriangleTriangle,
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
        triangle: (g, t) => () => { },
        //collideTriangleGrid(t, g),
        grid: () => { },
        //collideGridGrid,
    },
};
export const collide = (shapeA, shapeB) => {
    // @ts-expect-error
    return collisionMap[shapeA.type][shapeB.type](shapeA, shapeB);
};
//# sourceMappingURL=collide.js.map