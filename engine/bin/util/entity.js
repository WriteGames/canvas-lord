import * as Components from './components.js';
export class Entity {
    scene; // NOTE: set by scene
    components = new Map();
    depth = 0;
    constructor(x, y) {
        this.addComponent(Components.pos2D);
        this.x = x;
        this.y = y;
    }
    addComponent(component) {
        // TODO: we'll want to make sure we use a deepCopy
        this.components.set(component, Components.copyObject(component.data));
        return this.component(component);
    }
    component(component) {
        const c = this.components.get(component);
        if (!c)
            return undefined;
        return c;
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
    update(input) { }
    render(ctx) { }
}
//# sourceMappingURL=entity.js.map