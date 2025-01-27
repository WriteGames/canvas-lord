/* Canvas Lord v0.4.4 */
export type IEntityComponentType<T = any> = {
	data: T;
	__IEntityComponent: symbol;
};

export type CSSColor = string;
