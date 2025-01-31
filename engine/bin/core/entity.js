import * as Collide from '../collider/collide.js';
import { PointCollider } from '../collider/index.js';
import * as Components from '../util/components.js';
const mouseCollider = new PointCollider();
export class Entity {
    scene; // NOTE: set by scene
    components = new Map();
    depth = 0;
    collider = undefined;
    visible = true;
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
            // TODO(bret): fix "as number"
            return this.collider.w;
        return 0;
    }
    get w() {
        return this.width;
    }
    get height() {
        if (this.collider && 'h' in this.collider)
            // TODO(bret): fix "as number"
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
    renderCollider(ctx, camera) {
        if (!this.collider)
            return;
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        this.collider.render?.(ctx, drawX, drawY);
    }
    _moveCollider(c, x, y) {
        c.x += x;
        c.y += y;
    }
    _collide(x, y, tag, earlyOut) {
        if (!this.collider)
            return [];
        const tags = tag ? [tag].flat() : [];
        const n = this.scene.entities.inScene.length;
        let collide = [];
        for (let i = 0; i < n; ++i) {
            const e = this.scene.entities.inScene[i];
            if (e === this)
                continue;
            if (!e.collider?.collidable)
                continue;
            if (tags.length && !tags.includes(e.collider.tag))
                continue;
            this._moveCollider(this.collider, x, y);
            this._moveCollider(e.collider, e.x, e.y);
            const collision = Collide.collide(this.collider, e.collider);
            const result = collision ? e : null;
            this._moveCollider(this.collider, -x, -y);
            this._moveCollider(e.collider, -e.x, -e.y);
            if (result === null)
                continue;
            collide.push(result);
            if (earlyOut)
                break;
        }
        return collide;
    }
    collideEntity(x, y, tag) {
        return this._collide(x, y, tag, true)[0] ?? null;
    }
    collideEntities(x, y, tag) {
        return this._collide(x, y, tag, false);
    }
    collide(x, y, tag) {
        if (!this.collider)
            return false;
        return this.collideEntity(x, y, tag) !== null;
    }
    collideMouse(x, y) {
        if (!this.collider)
            return false;
        const { input } = this.scene.engine;
        const mouseX = input.mouse.x + this.scene.camera.x;
        const mouseY = input.mouse.y + this.scene.camera.y;
        return Collide.collide(
        // TODO(bret): input.mouse.collider or smth
        // @ts-expect-error
        {
            type: 'point',
            x: mouseX - x,
            y: mouseY - y,
            collidable: true,
        }, this.collider);
    }
}
//# sourceMappingURL=entity.js.map