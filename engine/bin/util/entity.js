import * as Components from './components.js';
import * as Collision from './collision.js';
export class Entity {
    scene; // NOTE: set by scene
    components = new Map();
    depth = 0;
    collider = undefined;
    visible = true;
    collidable = true;
    #graphic = undefined;
    get graphic() {
        return this.#graphic;
    }
    set graphic(graphic) {
        this.#graphic = graphic;
        if (this.#graphic)
            this.#graphic.parent = this;
    }
    constructor(x = 0, y = 0) {
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
    // TODO(bret): Set up setters for these as well
    // TODO(bret): Would be good to set up for non-rect shapes :)
    get width() {
        if (this.collider && 'w' in this.collider)
            return this.collider.w;
        return 0;
    }
    get w() {
        return this.width;
    }
    get height() {
        if (this.collider && 'h' in this.collider)
            return this.collider.h;
        return 0;
    }
    get h() {
        return this.height;
    }
    update(input) { }
    render(ctx, camera) {
        // TODO(bret): .visible should probably be on the Graphic, not the Entity itself
        if (this.visible) {
            this.#graphic?.render(ctx, camera);
        }
    }
    _moveCollider(c, x, y) {
        switch (c.type) {
            case 'line':
                c.x1 += x;
                c.x2 += x;
                c.y1 += y;
                c.y2 += y;
                break;
            case 'triangle':
                c.x1 += x;
                c.x2 += x;
                c.x3 += x;
                c.y1 += y;
                c.y2 += y;
                c.y3 += y;
                break;
            default:
                c.x += x;
                c.y += y;
        }
    }
    _collide(x, y, e) {
        if (!this.collidable || !this.collider || !e.collidable || !e.collider)
            return null;
        let result = null;
        this._moveCollider(this.collider, x, y);
        this._moveCollider(e.collider, e.x, e.y);
        if (Collision.collide(this.collider, e.collider)) {
            result = e;
        }
        this._moveCollider(this.collider, -x, -y);
        this._moveCollider(e.collider, -e.x, -e.y);
        return result;
    }
    collideEntity(x, y, tag) {
        if (!this.collidable || !this.collider)
            return null;
        const tags = tag ? [tag].flat() : [];
        const n = this.scene.entities.inScene.length;
        let collide = null;
        for (let i = 0; !collide && i < n; ++i) {
            const e = this.scene.entities.inScene[i];
            if (e === this)
                continue;
            if (!e.collidable || !e.collider)
                continue;
            if (tags.length && !tags.includes(e.collider.tag))
                continue;
            collide = this._collide(x, y, e);
        }
        return collide;
    }
    collideEntities(x, y, tag) {
        if (!this.collidable || !this.collider)
            return [];
        const tags = tag ? [tag].flat() : [];
        const n = this.scene.entities.inScene.length;
        let collide = [];
        for (let i = 0; i < n; ++i) {
            const e = this.scene.entities.inScene[i];
            if (e === this)
                continue;
            if (!e.collidable || !e.collider)
                continue;
            if (tags.length && !tags.includes(e.collider.type))
                continue;
            if (this._collide(x, y, e)) {
                collide.push(e);
            }
        }
        return collide;
    }
    collide(x, y, tag) {
        if (!this.collidable || !this.collider)
            return false;
        return this.collideEntity(x, y, tag) !== null;
    }
}
//# sourceMappingURL=entity.js.map