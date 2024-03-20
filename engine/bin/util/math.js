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
    return p.map((v) => v + s);
};
export const subPos = (a, b) => {
    return a.map((v, i) => v - (b[i] ?? 0));
};
export const scalePos = (p, s) => {
    return p.map((v) => v * s);
};
export const posEqual = (a, b) => a.length === b.length && a.every((v, i) => equal(v, b[i]));
export const equal = (a, b) => {
    return Math.abs(a - b) < Number.EPSILON;
};
export const indexToPos = (index, stride) => [
    index % stride,
    Math.floor(index / stride),
];
export const posToIndex = ([x, y], stride) => y * stride + x;
//# sourceMappingURL=math.js.map