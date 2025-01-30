import { addPos, subPos, scalePos, posToIndex, indexToPos, hashPos, posEqual, Vec2, EPSILON, } from './math/index.js';
import { Grid } from './util/grid.js';
// exports
export * from './core/asset-manager.js';
export * from './core/engine.js';
export { Input, Keys } from './core/input.js';
export { Entity } from './core/entity.js';
export { Scene } from './core/scene.js';
// TODO: only export these from math/index.js
export { V2, addPos, subPos, scalePos, EPSILON, } from './math/index.js';
export { Draw } from './util/draw.js';
export { Camera } from './util/camera.js';
export * as Collision from './util/collision.js';
export { checkLineSegmentIntersection, getLineSegmentIntersection, } from './util/collision.js';
export { Grid } from './util/grid.js';
export { Tileset } from './util/graphic.js';
const reduceSum = (acc, v) => acc + v;
const reduceProduct = (acc, v) => acc * v;
const distance = (dimensions) => Math.abs(Math.sqrt(dimensions.map((d) => d * d).reduce(reduceSum, 0)));
const distanceSq = (dimensions) => Math.abs(dimensions.map((d) => d * d).reduce(reduceSum, 0));
const isDefined = (v) => Boolean(v);
const interlaceArrays = (a, b) => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);
export const mapByOffset = (offset) => {
    return (pos) => addPos(offset, pos);
};
export const mapFindOffset = (origin) => {
    return (pos) => subPos(pos, origin);
};
export const flatMapByOffsets = (offsets) => {
    return (pos) => offsets.map((offset) => addPos(offset, pos));
};
export const posDistance = (a, b) => distance(subPos(b, a));
export const posDistanceSq = (a, b) => distanceSq(subPos(b, a));
// const pathToSegments = (path) =>
// 	path.map((vertex, i, vertices) => [
// 		vertex,
// 		vertices[(i + 1) % vertices.length],
// 	]);
const RAD_TO_DEG = 180.0 / Math.PI;
const radToDeg = (rad) => rad * RAD_TO_DEG;
const DEG_TO_RAD = Math.PI / 180.0;
const degToRad = (deg) => deg * DEG_TO_RAD;
const RAD_45 = 45 * DEG_TO_RAD;
const RAD_90 = 90 * DEG_TO_RAD;
const RAD_180 = 180 * DEG_TO_RAD;
const RAD_270 = 270 * DEG_TO_RAD;
const RAD_360 = 360 * DEG_TO_RAD;
const RAD_540 = 540 * DEG_TO_RAD;
const RAD_720 = 720 * DEG_TO_RAD;
// const getAngle = (a, b) => Math.atan2(...subPos(b, a)) * 180 / Math.PI;
const getAngle = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const getAngleBetween = (a, b) => ((b - a + RAD_540) % RAD_360) - RAD_180;
export const isPointOnLine = (point, a, b) => Math.abs(posDistance(a, point) + posDistance(point, b) - posDistance(a, b)) < EPSILON;
// TODO(bret): Would be fun to make this work with any dimensions
export const isWithinBounds = ([x, y], [x1, y1], [x2, y2]) => x >= x1 && y >= y1 && x < x2 && y < y2;
export const filterWithinBounds = (a, b) => (pos) => a.every((p, i) => ([...pos][i] ?? -Infinity) >= p) &&
    b.every((p, i) => ([...pos][i] ?? Infinity) < p);
export const isPointInsidePath = (point, path) => {
    const wind = path
        .map((vertex) => getAngle(point, vertex))
        .map((angle, i, arr) => getAngleBetween(angle, arr[(i + 1) % arr.length]))
        .reduce(reduceSum, 0);
    return Math.abs(wind) > EPSILON;
};
const createBitEnum = (..._names) => {
    const names = _names.flat();
    const bitEnumObj = {};
    names.forEach((name, i) => {
        const val = 1 << i;
        bitEnumObj[i] = val;
        bitEnumObj[name.toUpperCase()] = val;
    });
    return bitEnumObj;
};
export const dirNN = 0;
export const [dirRN, dirNU, dirLN, dirND] = Object.freeze(Array.from({ length: 4 }).map((_, i) => 1 << i));
// prettier-ignore
export const [dirLU, dirRU, dirLD, dirRD,] = [
    dirLN | dirNU, dirRN | dirNU,
    dirLN | dirND, dirRN | dirND,
];
let nnn;
{
    // prettier-ignore
    const [normLU, normNU, normRU, normLN, normNN, normRN, normLD, normND, normRD,] = [
        new Vec2(-1, -1),
        new Vec2(0, -1),
        new Vec2(1, -1),
        new Vec2(-1, 0),
        new Vec2(0, 0),
        new Vec2(1, 0),
        new Vec2(-1, 1),
        new Vec2(0, 1),
        new Vec2(1, 1),
    ];
    // prettier-ignore
    nnn = {
        LU: normLU, NU: normNU, RU: normRU,
        LN: normLN, NN: normNN, RN: normRN,
        LD: normLD, ND: normND, RD: normRD,
    };
}
export const norm = nnn;
const orthogonalNorms = [norm.RN, norm.NU, norm.LN, norm.ND];
const diagonalNorms = [norm.RU, norm.LU, norm.LD, norm.RD];
export const cardinalNorms = interlaceArrays(orthogonalNorms, diagonalNorms);
// Starts right, goes counter-clockwise
export const reduceBitFlags = (acc, val) => acc | val;
const cardinalNormStrs = [
    'RN',
    'RU',
    'NU',
    'LU',
    'LN',
    'LD',
    'ND',
    'RD',
];
const CARDINAL_NORM = createBitEnum(...cardinalNormStrs);
const mapStrToCardinalDirBitFlag = (str) => CARDINAL_NORM[str];
class V2Map {
    #map = new Map();
    constructor() {
        this.#map = new Map();
    }
    delete(key) {
        return this.#map.delete(hashPos(key));
    }
    get(key) {
        return this.#map.get(hashPos(key));
    }
    has(key) {
        return this.#map.has(hashPos(key));
    }
    set(key, value) {
        this.#map.set(hashPos(key), value);
        return this;
    }
}
export const normToBitFlagMap = new V2Map();
[
    [norm.RN, CARDINAL_NORM.RN], // 1
    [norm.RU, CARDINAL_NORM.RU], // 2
    [norm.NU, CARDINAL_NORM.NU], // 4
    [norm.LU, CARDINAL_NORM.LU], // 8
    [norm.LN, CARDINAL_NORM.LN], // 16
    [norm.LD, CARDINAL_NORM.LD], // 32
    [norm.ND, CARDINAL_NORM.ND], // 64
    [norm.RD, CARDINAL_NORM.RD],
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(dir, bitFlag));
const orTogetherCardinalDirs = (...dirs) => dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);
export const globalSetTile = (tileset, x, y, bitFlag) => {
    switch (bitFlag & ~orTogetherCardinalDirs('LD', 'RD', 'LU', 'RU')) {
        case 0:
            tileset.setTile(x, y, 0, 5);
            break;
        case orTogetherCardinalDirs('NU'):
            tileset.setTile(x, y, 0, 7);
            break;
        case orTogetherCardinalDirs('ND'):
            tileset.setTile(x, y, 0, 6);
            break;
        case orTogetherCardinalDirs('LN'):
            tileset.setTile(x, y, 3, 4);
            break;
        case orTogetherCardinalDirs('RN'):
            tileset.setTile(x, y, 1, 4);
            break;
        case orTogetherCardinalDirs('LN', 'RN'):
            tileset.setTile(x, y, 0, 2);
            break;
        case orTogetherCardinalDirs('ND', 'NU'):
            tileset.setTile(x, y, 0, 3);
            break;
        case orTogetherCardinalDirs('RN', 'NU', 'ND'):
            tileset.setTile(x, y, 1, 6);
            break;
        case orTogetherCardinalDirs('NU', 'LN', 'ND'):
            tileset.setTile(x, y, 3, 6);
            break;
        case orTogetherCardinalDirs('RN', 'NU', 'LN', 'ND'):
            tileset.setTile(x, y, 2, 6);
            break;
        case orTogetherCardinalDirs('LN', 'ND'):
            tileset.setTile(x, y, 2, 5);
            break;
        case orTogetherCardinalDirs('LN', 'NU'):
            tileset.setTile(x, y, 3, 7);
            break;
        case orTogetherCardinalDirs('RN', 'ND'):
            tileset.setTile(x, y, 2, 3);
            break;
        case orTogetherCardinalDirs('LN', 'RN', 'ND'):
            tileset.setTile(x, y, 2, 2);
            break;
        case orTogetherCardinalDirs('RN', 'NU'):
            tileset.setTile(x, y, 1, 7);
            break;
        case orTogetherCardinalDirs('RN', 'NU', 'LN'):
            tileset.setTile(x, y, 2, 7);
            break;
        case orTogetherCardinalDirs('NU', 'LN'):
            tileset.setTile(x, y, 3, 7);
            break;
    }
};
// TODO(bret): Rewrite these to use Vectors once those are implemented :)
const rotateNormBy45Deg = (curDir, turns) => {
    const norms = cardinalNorms; // .flatMap(v => [v, v]);
    const index = cardinalNorms.indexOf(curDir);
    if (index === -1) {
        console.error('rotateNormBy45Deg expects a norm array');
        return curDir;
    }
    const n = cardinalNorms.length;
    return cardinalNorms[(index - turns + n) % n];
};
// NOTE: The generic allows it to use V2's orthogonal or diagonal norm types, depending on the `curDir`
const rotateNormBy90Deg = (curDir, turns) => rotateNormBy45Deg(curDir, 2 * turns);
function getGridData(_grid, _columns, _rows) {
    if (_grid instanceof Grid) {
        const { data: grid, columns, rows } = _grid;
        return [grid, columns, rows];
    }
    return [_grid, _columns, _rows];
}
export const findAllPolygonsInGrid = (_grid, _columns, _rows) => {
    const [grid, columns, rows] = getGridData(_grid, _columns, _rows);
    const polygons = [];
    const offsets = {
        [hashPos(norm.NU)]: [norm.RU, norm.NU],
        [hashPos(norm.ND)]: [norm.LD, norm.ND],
        [hashPos(norm.RN)]: [norm.RD, norm.RN],
        [hashPos(norm.LN)]: [norm.LU, norm.LN],
    };
    const shapes = findAllShapesInGrid(grid, columns, rows);
    shapes.forEach((shape) => {
        const [first] = shape.shapeCells;
        if (first === undefined)
            return;
        const { gridType } = shape;
        let curDir = norm.ND;
        let lastDir = curDir;
        const points = [];
        const polygon = { points };
        polygons.push(polygon);
        const addPointsToPolygon = (points, pos, interior) => {
            const origin = interior ? 0 : -1;
            const size = 16;
            const m1 = size - 1;
            const basePos = scalePos(pos, size);
            const [lastX, lastY] = points.length
                ? subPos(points[points.length - 1], basePos)
                : [origin, origin];
            const offset = new Vec2(0, 0);
            switch (curDir) {
                case norm.ND:
                    offset[0] = origin;
                    offset[1] = lastY;
                    break;
                case norm.NU:
                    offset[0] = m1 - origin;
                    offset[1] = lastY;
                    break;
                case norm.RN:
                    offset[0] = lastX;
                    offset[1] = m1 - origin;
                    break;
                case norm.LN:
                    offset[0] = lastX;
                    offset[1] = origin;
                    break;
            }
            points.push(addPos(basePos, offset));
        };
        addPointsToPolygon(points, first, gridType === 1);
        for (let next = first, firstIter = true; firstIter || !posEqual(curDir, norm.ND) || !posEqual(next, first); firstIter = false) {
            const [p1, p2] = offsets[hashPos(curDir)]
                .map((o) => addPos(next, o))
                .map((p) => {
                return isWithinBounds(p, Vec2.zero, new Vec2(columns, rows))
                    ? grid[posToIndex(p, columns)]
                    : 0;
            });
            if (p2 === gridType) {
                if (p1 === gridType) {
                    next = addPos(next, curDir);
                    curDir = rotateNormBy90Deg(curDir, 1);
                }
                next = addPos(next, curDir);
                if (lastDir !== curDir)
                    addPointsToPolygon(points, next, gridType === 1);
            }
            else {
                curDir = rotateNormBy90Deg(curDir, -1);
                addPointsToPolygon(points, next, gridType === 1);
            }
            lastDir = curDir;
            // if (curDir === normND && next === first) break;
        }
    });
    return polygons;
};
const findAllShapesInGrid = (_grid, _columns, _rows) => {
    const [grid, columns, rows] = getGridData(_grid, _columns, _rows);
    const shapes = [];
    const checked = Array.from({ length: columns * rows }, () => false);
    let nextIndex;
    while ((nextIndex = checked.findIndex((v) => !v)) > -1) {
        const shape = fillShape(indexToPos(nextIndex, columns), checked, grid, columns, rows);
        // Empty shapes must be enclosed
        if (shape.gridType === 0 &&
            (shape.minX === 0 ||
                shape.minY === 0 ||
                shape.maxX >= columns ||
                shape.maxY >= rows))
            continue;
        shapes.push(shape);
    }
    return shapes;
};
const fillShape = (start, checked, _grid, _columns, _rows) => {
    const [grid, columns, rows] = getGridData(_grid, _columns, _rows);
    const stride = columns;
    const gridType = grid[posToIndex(start, columns)];
    const queue = [start];
    const visited = [];
    let next;
    while ((next = queue.pop())) {
        const hash = hashPos(next);
        if (visited.includes(hash))
            continue;
        const index = posToIndex(next, stride);
        visited.push(hash);
        if (grid[posToIndex(next, columns)] !== gridType)
            continue;
        checked[index] = true;
        const [x, y] = next;
        if (x > 0)
            queue.push(new Vec2(x - 1, y));
        if (x < columns - 1)
            queue.push(new Vec2(x + 1, y));
        if (y > 0)
            queue.push(new Vec2(x, y - 1));
        if (y < rows - 1)
            queue.push(new Vec2(x, y + 1));
    }
    const shapeCells = visited.map((v) => new Vec2(...v.split(',').map((c) => +c)));
    const shapeBounds = shapeCells.reduce((acc, cell) => {
        const [x, y] = cell;
        return {
            minX: Math.min(x, acc.minX),
            maxX: Math.max(x, acc.maxX),
            minY: Math.min(y, acc.minY),
            maxY: Math.max(y, acc.maxY),
        };
    }, {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
    });
    return {
        ...shapeBounds,
        gridType,
        shapeCells,
    };
};
export class GridOutline {
    constructor() {
        this.grid = null;
        this.polygons = [];
        this.show = false;
        this.renderOutline = true;
        this.outlineColor = 'red';
        this.renderPoints = true;
        this.pointsColor = 'red';
    }
    computeOutline(grid) {
        this.grid = grid;
        this.polygons = findAllPolygonsInGrid(grid);
    }
    render(ctx, camera) {
        if (!this.show)
            return;
        // Draw edges
        if (this.renderOutline) {
            this.polygons.forEach((polygon) => {
                ctx.beginPath();
                ctx.strokeStyle = this.outlineColor;
                const start = addPos(polygon.points[0], [0.5, 0.5]);
                const cameraPos = new Vec2(camera[0], camera[1]);
                const [_x, _y] = subPos(start, cameraPos);
                ctx.moveTo(_x, _y);
                polygon.points
                    .slice(1)
                    .map((p) => subPos(p, camera))
                    .forEach(([x, y]) => {
                    ctx.lineTo(x + 0.5, y + 0.5);
                });
                ctx.closePath();
                ctx.stroke();
            });
        }
        // Draw points
        if (this.renderPoints) {
            ctx.fillStyle = this.pointsColor;
            this.polygons.forEach((polygon) => {
                polygon.points
                    .map((p) => subPos(p, camera))
                    .forEach(([x, y]) => {
                    ctx.fillRect(x - 1, y - 1, 3, 3);
                });
            });
        }
    }
}
//# sourceMappingURL=canvas-lord.js.map