export const isVec2 = (vec) => {
    return vec instanceof Vec2;
};
const X = 0;
const Y = 1;
export class Vec2 extends Array {
    // length: 2 = 2 as const;
    constructor(x = 0, y = 0) {
        super(x, y);
    }
    static get zero() {
        return new Vec2(0, 0);
    }
    static get one() {
        return new Vec2(1, 1);
    }
    static get right() {
        return new Vec2(1, 0);
    }
    static get up() {
        return new Vec2(0, 1);
    }
    get x() {
        return this[X];
    }
    set x(value) {
        this[X] = value;
    }
    get y() {
        return this[Y];
    }
    set y(value) {
        this[Y] = value;
    }
    get magnitude() {
        return magnitude2D(this);
    }
    set(v) {
        this.x = v.x;
        this.y = v.y;
    }
    setXY(x, y) {
        this.x = x;
        this.y = y;
    }
    static normalize = (v) => {
        return v.clone().invScale(v.magnitude);
    };
    normalize() {
        const mag = this.magnitude;
        this.x /= mag;
        this.y /= mag;
        return this;
    }
    map(
    // DECIDE: index: 0 | 1 ?
    callbackfn, thisArg) {
        return super.map(callbackfn, thisArg);
    }
    every(predicate, thisArg) {
        return super.every(predicate, thisArg);
    }
    join(separator) {
        return super.join(separator);
    }
    [Symbol.iterator]() {
        return super.values();
    }
    clone() {
        return new Vec2(...this);
    }
    static add = (a, b) => addPos(a, b);
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    static plus = (a, b) => Vec2.add(a, b);
    plus(v) {
        return this.add(v);
    }
    static sub = (a, b) => subPos(a, b);
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    static minus = (a, b) => Vec2.sub(a, b);
    minus(v) {
        return this.sub(v);
    }
    static scale = (v, s) => scalePos(v, s);
    scale(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    static invScale = (v, s) => scalePos(v, 1 / s);
    invScale(s) {
        const iS = 1 / s;
        this.x *= iS;
        this.y *= iS;
        return this;
    }
    static cross = (a, b) => crossProduct2D(a, b);
    cross(v) {
        return Vec2.cross(this, v);
    }
    static dot = (a, b) => dotProduct2D(a, b);
    dot(v) {
        return Vec2.dot(this, v);
    }
    static rotate = (v, angle) => rotate2D(v, angle);
    rotate(angle) {
        return Vec2.rotate(this, angle);
    }
    static equal = (a, b) => posEqual(a, b);
    equal(v) {
        return Vec2.equal(this, v);
    }
    static lerp = (a, b, t) => {
        return Vec2.sub(b, a).scale(t).add(a);
    };
}
export const hashPos = (pos) => pos.join(',');
export const addPos = (a, b) => {
    return a.map((v, i) => v + (b[i] ?? 0));
};
export const subPos = (a, b) => {
    return a.map((v, i) => v - (b[i] ?? 0));
};
export const addScalar = (p, s) => {
    const sums = p.map((v) => v + s);
    if (isVec2(p))
        return new Vec2(...sums);
    return sums;
};
export const scalePos = (p, s) => {
    const scaled = p.map((v) => v * s);
    if (isVec2(p))
        return new Vec2(...scaled);
    return scaled;
};
export const posEqual = (a, b) => {
    const aa = [...a];
    const bb = [...b];
    return aa.length === bb.length && aa.every((v, i) => equal(v, bb[i]));
};
export const equal = (a, b) => {
    return Math.abs(a - b) < Number.EPSILON;
};
export const indexToPos = (index, stride) => new Vec2(index % stride, Math.floor(index / stride));
export const posToIndex = ([x, y], stride) => y * stride + x;
export const rotate2D = (v, angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
};
export const crossProduct2D = (a, b) => a[0] * b[1] - a[1] * b[0];
export const dotProduct2D = (a, b) => a[0] * b[0] + a[1] * b[1];
export const magnitude2D = (v) => Math.sqrt(v.x ** 2 + v.y ** 2);
//# sourceMappingURL=vec2.js.map