export * from './vectors/index.js';
export const EPSILON = 0.000001;
// Math prototype fun :~)
if (typeof Math.clamp === 'undefined') {
    Math.clamp = (val, min, max) => {
        if (val < min)
            return min;
        if (val > max)
            return max;
        return val;
    };
}
if (typeof Math.lerp === 'undefined') {
    Math.lerp = (a, b, t) => {
        return t * (b - a) + a;
    };
}
//# sourceMappingURL=index.js.map