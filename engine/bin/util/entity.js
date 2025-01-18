import * as Components from './components.js';
import * as Collision from './collision.js';
export class Entity {
    scene; // NOTE: set by scene
    components = new Map();
    depth = 0;
    collider = undefined;
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
    collideEntity(x, y) {
        if (!this.collider)
            return null;
        // TODO(bret): Remove this hack
        if (this.collider.type === 'line' || this.collider.type === 'triangle')
            return null;
        const n = this.scene.entities.inScene.length;
        let collide = null;
        for (let i = 0; !collide && i < n; ++i) {
            const e = this.scene.entities.inScene[i];
            if (e === this)
                continue;
            if (!e.collider)
                continue;
            // TODO(bret): Remove this hack
            if (e.collider.type === 'line' || e.collider.type === 'triangle')
                return null;
            this.collider.x += x;
            this.collider.y += y;
            e.collider.x += e.x;
            e.collider.y += e.y;
            if (Collision.collide(this.collider, e.collider)) {
                collide = e;
            }
            this.collider.x -= x;
            this.collider.y -= y;
            e.collider.x -= e.x;
            e.collider.y -= e.y;
        }
        return collide;
    }
    collideEntities(x, y) {
        if (!this.collider)
            return [];
        // TODO(bret): Remove this hack
        if (this.collider.type === 'line' || this.collider.type === 'triangle')
            return null;
        const n = this.scene.entities.inScene.length;
        let collide = [];
        for (let i = 0; i < n; ++i) {
            const e = this.scene.entities.inScene[i];
            if (e === this)
                continue;
            if (!e.collider)
                continue;
            // TODO(bret): Remove this hack
            if (e.collider.type === 'line' || e.collider.type === 'triangle')
                return null;
            this.collider.x += x;
            this.collider.y += y;
            e.collider.x += e.x;
            e.collider.y += e.y;
            if (Collision.collide(this.collider, e.collider)) {
                collide.push(e);
            }
            this.collider.x -= x;
            this.collider.y -= y;
            e.collider.x -= e.x;
            e.collider.y -= e.y;
        }
        return collide;
    }
    collide(x, y) {
        if (!this.collider)
            return false;
        return this.collideEntity(x, y) !== null;
    }
    update(input) { }
    render(ctx) { }
}
//# sourceMappingURL=entity.js.map