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
//# sourceMappingURL=math.js.map