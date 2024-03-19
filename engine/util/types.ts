export type IEntityComponentType<T = any> = {
	data: T;
	__IEntityComponent: symbol;
};

export type CSSColor = string;
