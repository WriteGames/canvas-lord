const linear = (t: number): number => t;
const quad = (t: number): number => t * t;
const cube = (t: number): number => t * t * t;
const quart = (t: number): number => t * t * t * t;
const quint = (t: number): number => t * t * t * t * t;
const HALF_PI: number = Math.PI / 2;
const sine = (t: number): number => -Math.cos(HALF_PI * t) + 1;
const elastic = (t: number): number => {
	const c4 = (2 * Math.PI) / 3;

	if (t === 0) return 0;
	return t === 1
		? 1
		: -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};
const B_DENOM = 2.75;
const B1: number = 1 / B_DENOM;
const B2: number = 2 / B_DENOM;
const B3: number = 1.5 / B_DENOM;
const B4: number = 2.5 / B_DENOM;
const B5: number = 2.25 / B_DENOM;
const B6: number = 2.625 / B_DENOM;
const bounce = (t: number): number => {
	const _t = 1 - t;
	if (_t < B1) return 1 - 7.5625 * _t * _t;
	if (_t < B2) return 1 - (7.5625 * (_t - B3) * (_t - B3) + 0.75);
	if (_t < B4) return 1 - (7.5625 * (_t - B5) * (_t - B5) + 0.9375);
	return 1 - (7.5625 * (_t - B6) * (_t - B6) + 0.984375);
};
const circ = (t: number): number => -(Math.sqrt(1 - t * t) - 1);
const expo = (t: number): number => Math.pow(2, 10 * (t - 1));
const back = (t: number): number => t * t * (2.70158 * t - 1.70158);

export type EaseFunc = (t: number) => number;
type EaseWrap = (func: EaseFunc) => EaseFunc;

export const easeOut: EaseWrap = (func) => (t) => 1 - func(1 - t);
export const easeInOut: EaseWrap = (func) => (t) =>
	0.5 * (t <= 0.5 ? func(2 * t) : 2 - func(2 * (1 - t)));
export const easeOutIn: EaseWrap = (func) => (t) =>
	0.5 * (t <= 0.5 ? 1 - func(1 - t * 2) : func(t * 2 - 1) + 1);

type EaseMatrix<T extends string> = Record<
	`${T}In` | `${T}Out` | `${T}InOut` | `${T}OutIn`,
	EaseFunc
>;
const generateMatrix = <T extends string>(
	name: T,
	func: EaseFunc,
): EaseMatrix<T> => {
	return {
		[`${name}In`]: func,
		[`${name}Out`]: easeOut(func),
		[`${name}InOut`]: easeInOut(func),
		[`${name}OutIn`]: easeOutIn(func),
	} as EaseMatrix<T>;
};

export const Ease = Object.freeze({
	linear,
	quad,
	cube,
	quart,
	quint,
	sine,
	elastic,
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
