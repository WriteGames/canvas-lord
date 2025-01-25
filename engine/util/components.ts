import { IEntityComponentType } from './types.js';
import { Vec2 } from './math.js';

// NOTE: This is necessary since Components.createComponent() returns a Readonly<IEntityComponent> - we can use this to remove Readable<>
export type ComponentProps<T extends IEntityComponentType> =
	T extends IEntityComponentType<infer P>
		? {
				-readonly [K in keyof P]: P[K];
		  }
		: never;

type RawComponent = object | unknown[];

type InferTuple<T> = T extends readonly [...infer Tuple] ? Tuple : T;
export const copyObject = <T extends RawComponent, U = InferTuple<T>>(
	obj: U,
): U => (Array.isArray(obj) ? ([...obj] as U) : structuredClone(obj));

// TODO: rename to registerComponent? And then do something with that?
// TODO: how should prerequisites be handled? ie rect needs pos2D maybe, and then adding that component needs to either add an initial pos2D or warn/error that there isn't one there
export const createComponent = <T extends RawComponent>(initialState: T) =>
	Object.freeze(
		copyObject({
			data: initialState,
		}),
	) as IEntityComponentType<T>;

export const pos2D = createComponent(Vec2.zero);

// TODO: export this from a better place lol
interface DrawOptions {
	originX?: number;
	originY?: number;
	angle?: number;
	scaleX?: number;
	scaleY?: number;
	offsetX?: number;
	offsetY?: number;
	color?: string;
	blend?: boolean;
}

const drawable = {
	angle: 0,
	scaleX: 1,
	scaleY: 1,
	originX: 0,
	originY: 0,
	offsetX: 0,
	offsetY: 0,
} as DrawOptions;

const style = {
	type: 'fill' as 'fill' | 'stroke',
	color: 'white',
};

export const image = createComponent({
	imageSrc: null as HTMLCanvasElement | HTMLImageElement | null,
	frame: 0,
	frameW: 0,
	frameH: 0,
	...drawable,
});

export const rect = createComponent({
	width: 0,
	height: 0,
	...drawable,
	...style,
});
export const circle = createComponent({ radius: 0, ...drawable, ...style });

export const moveEightComponent = createComponent({
	originX: 30,
	originY: 90,
	dt: 0,
});

// TODO: how do I do a component group??
