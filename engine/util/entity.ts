import type { Input, IRenderable } from '../canvas-lord.js';
import * as Components from './components.js';
import { type ComponentProps } from './components.js';
import type { Scene } from './scene.js';
import type { IEntityComponentType } from './types.js';

export interface IEntity {
	x: number;
	y: number;
	scene: Scene;
	components: Map<IEntityComponentType, any>;
	update: (input: Input) => void;
	// TODO(bret): What about allowing component to take in an array and return an array? IE allow for destructuring instead of multiple calls?
	addComponent: <T extends IEntityComponentType>(
		component: T,
	) => ReturnType<IEntity['component']>;
	component: <T extends IEntityComponentType>(
		component: T,
	) => ComponentProps<T> | undefined;
}

export class Entity implements IEntity, IRenderable {
	scene!: Scene; // NOTE: set by scene
	components = new Map<IEntityComponentType, any>();
	depth = 0;

	constructor(x: number, y: number) {
		this.addComponent(Components.pos2D);
		this.x = x;
		this.y = y;
	}

	addComponent<C extends IEntityComponentType>(
		component: C,
	): ReturnType<typeof this.component<C>> {
		// TODO: we'll want to make sure we use a deepCopy
		this.components.set(component, Components.copyObject(component.data));
		return this.component(component);
	}

	component<C extends IEntityComponentType>(
		component: C,
	): ComponentProps<C> | undefined {
		const c = this.components.get(component);
		if (!c) return undefined;
		return c as ComponentProps<C>;
	}

	get x() {
		return this.component(Components.pos2D)![0];
	}

	set x(val) {
		this.component(Components.pos2D)![0] = val;
	}

	get y() {
		return this.component(Components.pos2D)![1];
	}

	set y(val) {
		this.component(Components.pos2D)![1] = val;
	}

	update(input: Input): void {}

	render(ctx: CanvasRenderingContext2D): void {}
}
