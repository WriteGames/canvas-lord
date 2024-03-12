import * as Components from './components.js';
import { type IEntityComponent } from './types.js';

export class Entity {
	components = new Map<IEntityComponent, any>();
	constructor(x: number, y: number) {
		this.addComponent(Components.pos2D);
		this.x = x;
		this.y = y;
	}

	addComponent<C extends IEntityComponent>(component: C) {
		// TODO: we'll want to make sure we use a deepCopy
		this.components.set(component, Components.copyObject(component));
		return this.component(component);
	}

	component<C extends IEntityComponent>(component: C) {
		return this.components.get(component);
	}

	get x() {
		return this.component(Components.pos2D)[0];
	}

	set x(val) {
		this.component(Components.pos2D)[0] = val;
	}

	get y() {
		return this.component(Components.pos2D)[1];
	}

	set y(val) {
		this.component(Components.pos2D)[1] = val;
	}

	update() {}

	render() {}
}
