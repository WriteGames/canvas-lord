const linear = (t) => t;
const quad = (t) => t * t;
const cube = (t) => t * t * t;
const quart = (t) => t * t * t * t;
const quint = (t) => t * t * t * t * t;
const HALF_PI = Math.PI / 2;
const sine = (t) => -Math.cos(HALF_PI * t) + 1;
const B_DENOM = 2.75;
const B1 = 1 / B_DENOM;
const B2 = 2 / B_DENOM;
const B3 = 1.5 / B_DENOM;
const B4 = 2.5 / B_DENOM;
const B5 = 2.25 / B_DENOM;
const B6 = 2.625 / B_DENOM;
const bounce = (t) => {
    const _t = 1 - t;
    if (_t < B1)
        return 1 - 7.5625 * _t * _t;
    if (_t < B2)
        return 1 - (7.5625 * (_t - B3) * (_t - B3) + 0.75);
    if (_t < B4)
        return 1 - (7.5625 * (_t - B5) * (_t - B5) + 0.9375);
    return 1 - (7.5625 * (_t - B6) * (_t - B6) + 0.984375);
};
const circ = (t) => -(Math.sqrt(1 - t * t) - 1);
const expo = (t) => Math.pow(2, 10 * (t - 1));
const back = (t) => t * t * (2.70158 * t - 1.70158);
const easeOut = (func) => (t) => 1 - func(1 - t);
const easeInOut = (func) => (t) => 0.5 * (t <= 0.5 ? func(2 * t) : 2 - func(2 * (1 - t)));
const easeOutIn = (func) => (t) => 0.5 * (t <= 0.5 ? 1 - func(1 - t * 2) : func(t * 2 - 1) + 1);
const generateMatrix = (name, func) => {
    return {
        [`${name}In`]: func,
        [`${name}Out`]: easeOut(func),
        [`${name}InOut`]: easeInOut(func),
        [`${name}OutIn`]: easeOutIn(func),
    };
};
export const Ease = Object.freeze({
    linear,
    quad,
    cube,
    quart,
    quint,
    sine,
    bounce,
    circ,
    expo,
    back,
    ...generateMatrix('quad', quad),
    ...generateMatrix('cube', cube),
    ...generateMatrix('quart', quart),
    ...generateMatrix('quint', quint),
    ...generateMatrix('sine', sine),
    ...generateMatrix('bounce', bounce),
    ...generateMatrix('circ', circ),
    ...generateMatrix('expo', expo),
    ...generateMatrix('back', back),
});
//# sourceMappingURL=ease.js.map