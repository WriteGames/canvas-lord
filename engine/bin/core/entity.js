import * as Components from '../util/components.js';
import * as Collision from '../util/collision.js';
import { Draw } from '../util/draw.js';
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
    renderCollider(ctx, camera) {
        if (!this.collider)
            return;
        const color = this.collidable ? 'red' : 'gray';
        switch (this.collider.type) {
            case 'rect':
                const rect = {
                    x: this.x + this.collider.x - camera.x,
                    y: this.y + this.collider.y - camera.y,
                    width: this.collider.w,
                    height: this.collider.h,
                };
                Draw.rect(ctx, { type: 'stroke', color, ...rect }, rect.x, rect.y, rect.width - 1, rect.height - 1);
                break;
            case 'triangle':
                Draw.polygon(ctx, 
                // @ts-ignore
                { type: 'stroke', color }, this.x - camera.x, this.y - camera.y, [
                    [this.collider.x1, this.collider.y1],
                    [this.collider.x2, this.collider.y2],
                    [this.collider.x3, this.collider.y3],
                ]);
                break;
            case 'grid':
                // @ts-ignore
                this.collider.color = color;
                // @ts-ignore
                this.collider.renderOutline(ctx, camera, this.x, this.y);
                break;
            // default:
            // 	console.warn('not supported');
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
            if (!e.collidable || !e.collider)
                continue;
            if (tags.length && !tags.includes(e.collider.tag))
                continue;
            this._moveCollider(this.collider, x, y);
            this._moveCollider(e.collider, e.x, e.y);
            const collision = Collision.collide(this.collider, e.collider);
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
        return Collision.collide({
            type: 'point',
            x: mouseX - x,
            y: mouseY - y,
            collidable: true,
        }, this.collider);
    }
}
//# sourceMappingURL=entity.js.map