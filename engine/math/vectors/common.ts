// TYPE(bret): Find a home for these
/*export*/ type V2 = [x: number, y: number];
export type V3 = [x: number, y: number, z: number];
export type V4 = [x: number, y: number, z: number, w: number];

export type Vector = V2 | Readonly<V2> | V3 | Readonly<V3> | V4 | Readonly<V4>;

export const V2 = Object.defineProperties(
	{},
	{
		zero: {
			value: [0, 0] as V2,
			writable: false,
		},
		one: {
			value: [1, 1] as V2,
			writable: false,
		},
	},
) as {
	zero: V2;
	one: V2;
};
