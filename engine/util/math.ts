// type Vector = number[];
export type V2 = readonly [x: number, y: number];
export type V3 = readonly [x: number, y: number, z: number];
export type V4 = readonly [x: number, y: number, z: number, w: number];

type Writeable<T> = {
	-readonly [P in keyof T]: T[P];
};

export type V2Editable = Writeable<V2>;
// type V3Editable = Readable<V2>;
// type V4Editable = Readable<V2>;

export type Tuple = V2 | V3 | V4;

export type TupleT<T extends Tuple> = T extends V2
	? V2
	: // V3
	T extends V3
	? V3
	: // V4
	T extends V4
	? V4
	: // other
	  never; // could also just return T at this point, or add some extra cases that aren't cool (like [] or [number])

export const hashTuple = (pos: Tuple): string => pos.join(',');

const _tupleMap = new Map<string, V2 | V3 | V4>();
export const Tuple = <V extends Tuple>(...args: V): TupleT<V> => {
	const hash = hashTuple(args);
	if (!_tupleMap.has(hash)) {
		const tuple = Object.freeze<Tuple>(args);
		_tupleMap.set(hash, tuple);
	}
	return _tupleMap.get(hash) as TupleT<V>;
};

export const v2zero = Tuple(0, 0);
export const v2one = Tuple(1, 1);

type FuncMapTuple = <A extends Tuple, B extends Tuple>(a: A, b: B) => A;
type FuncMapTupleByScalar = <P extends Tuple>(p: P, s: number) => P;

export const addPos: FuncMapTuple = (a, b) => {
	return Tuple(
		...(a.map((v, i) => v + (b[i] ?? 0)) as unknown as typeof a),
	) as unknown as typeof a;
};

export const subPos: FuncMapTuple = (a, b) => {
	return Tuple(
		...(a.map((v, i) => v - (b[i] ?? 0)) as unknown as typeof a),
	) as unknown as typeof a;
};
export const scalePos: FuncMapTupleByScalar = (p, s) => {
	return Tuple(
		...(p.map((v) => v * s) as unknown as typeof p),
	) as unknown as typeof p;
};
export const posEqual = (a: Tuple, b: Tuple): boolean =>
	a.length === b.length && a.every((v, i) => v === b[i]);
