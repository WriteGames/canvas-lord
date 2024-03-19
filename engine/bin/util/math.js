export const hashTuple = (pos) => pos.join(',');
const _tupleMap = new Map();
export const Tuple = (...args) => {
    const hash = hashTuple(args);
    if (!_tupleMap.has(hash)) {
        const tuple = Object.freeze(args);
        _tupleMap.set(hash, tuple);
    }
    return _tupleMap.get(hash);
};
export const v2zero = Tuple(0, 0);
export const v2one = Tuple(1, 1);
export const addPos = (a, b) => {
    return Tuple(...a.map((v, i) => v + (b[i] ?? 0)));
};
export const subPos = (a, b) => {
    return Tuple(...a.map((v, i) => v - (b[i] ?? 0)));
};
export const scalePos = (p, s) => {
    return Tuple(...p.map((v) => v * s));
};
export const posEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
//# sourceMappingURL=math.js.map