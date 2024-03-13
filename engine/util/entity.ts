import * as Components from './components.js';
import { type ComponentProps } from './components.js';
import type { IEntityComponentType } from './types.js';

// TODO: canvas-lord.ts defines IEntity and the type there is not matching here
export class Entity {
	components = new Map<IEntityComponentType, any>();

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

	update() {}

	render() {}
}
