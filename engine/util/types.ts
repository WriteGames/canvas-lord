export type IEntityComponent<T = any> = {
	[index in keyof T]: T[index];
} & {
	__IEntityComponent: symbol;
};

export type IEntityComponentType<T = any> = {
	data: T;
	__IEntityComponent: symbol;
};

export type CSSColor = string;
