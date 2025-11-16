import { isVec2, Vec2 } from './vec2';
import { isVec3, Vec3 } from './vec3';
import { isVec4, Vec4 } from './vec4';
export const V2 = Object.defineProperties({}, {
    zero: {
        value: [0, 0],
        writable: false,
    },
    one: {
        value: [1, 1],
        writable: false,
    },
});
export const hashPos = (pos) => pos.join(',');
export const addPos = (a, b) => {
    return a.map((v, i) => v + (b[i] ?? 0));
};
export const addScalar = (p, s) => {
    const sums = p.map((v) => v + s);
    if (isVec2(p))
        return new Vec2(...sums);
    if (isVec3(p))
        return new Vec3(...sums);
    if (isVec4(p))
        return new Vec4(...sums);
    return sums;
};
export const scalePos = (p, s) => {
    const scaled = p.map((v) => v * s);
    if (isVec2(p))
        return new Vec2(...scaled);
    if (isVec3(p))
        return new Vec3(...scaled);
    if (isVec4(p))
        return new Vec4(...scaled);
    return scaled;
};
export const subPos = (a, b) => {
    return a.map((v, i) => v - (b[i] ?? 0));
};
export const equal = (a, b) => {
    return Math.abs(a - b) < Number.EPSILON;
};
export const posEqual = (a, b) => {
    const aa = [...a];
    const bb = [...b];
    return aa.length === bb.length && aa.every((v, i) => equal(v, bb[i]));
};
export const lengthSq = (a) => {
    return a.map((v) => v ** 2).reduce((a, v) => a + v);
};
export const length = (a) => {
    return Math.sqrt(lengthSq(a));
};
//# sourceMappingURL=common.js.map