/* Canvas Lord v0.5.3 */
// TODO(bret): This file is a bunch of random stuff, will need to clean up
import { addPos, EPSILON, hashPos, subPos, Vec2, } from './index.js';
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
export const RAD_TO_DEG = 180.0 / Math.PI;
export const radToDeg = (rad) => rad * RAD_TO_DEG;
export const DEG_TO_RAD = Math.PI / 180.0;
export const degToRad = (deg) => deg * DEG_TO_RAD;
export const RAD_45 = 45 * DEG_TO_RAD;
export const RAD_90 = 90 * DEG_TO_RAD;
export const RAD_180 = 180 * DEG_TO_RAD;
export const RAD_270 = 270 * DEG_TO_RAD;
export const RAD_360 = 360 * DEG_TO_RAD;
export const RAD_540 = 540 * DEG_TO_RAD;
export const RAD_720 = 720 * DEG_TO_RAD;
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
export const rotateNormBy45Deg = (curDir, turns) => {
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
export const rotateNormBy90Deg = (curDir, turns) => rotateNormBy45Deg(curDir, 2 * turns);
//# sourceMappingURL=misc.js.map