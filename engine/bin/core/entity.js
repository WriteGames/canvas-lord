/* Canvas Lord v0.5.3 */
import * as Collide from '../collider/collide.js';
import { PointCollider } from '../collider/index.js';
import { Vec2 } from '../math/index.js';
import * as Components from '../util/components.js';
import { Delegate } from '../util/delegate.js';
// TODO(bret): hook this up
const _mouseCollider = new PointCollider();
export class Entity {
    #scene; // NOTE: set by scene
    components = new Map();
    depth = 0;
    #collider = undefined;
    visible = true;
    colliderVisible = false;
    #graphic = undefined;
    #graphics = [];
    // TODO(bret): below
    onAdded = new Delegate();
    onPreUpdate = new Delegate();
    onUpdate = new Delegate();
    onPostUpdate = new Delegate();
    // TODO(bret): below
    onRemoved = new Delegate();
    onRender = new Delegate();
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
    get pos() {
        return this.component(Components.pos2D).clone();
    }
    set pos(val) {
        this.component(Components.pos2D).set(val);
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
    get graphic() {
        return this.#graphic;
    }
    set graphic(graphic) {
        this.#graphic = graphic;
        if (this.#graphic)
            this.#graphic.parent = this;
    }
    get collider() {
        return this.#collider;
    }
    set collider(value) {
        // TODO(bret): Might be good to do this, not sure yet
        // this.#collider?.assignParent(null);
        this.#collider = value;
        this.#collider?.assignParent(this);
    }
    get scene() {
        return this.#scene;
    }
    z__setScene(value) {
        this.#scene = value;
    }
    constructor(x = 0, y = 0, graphic, collider) {
        this.addComponent(Components.pos2D);
        this.x = x;
        this.y = y;
        this.graphic = graphic;
        this.collider = collider;
    }
    setPos(...args) {
        if (typeof args[0] === 'number' && typeof args[1] === 'number') {
            const [x, y] = args;
            this.x = x;
            this.y = y;
        }
        else if (args[0] instanceof Vec2) {
            const [vec] = args;
            this.x = vec[0];
            this.y = vec[1];
        }
    }
    addComponent(component) {
        // TODO: we'll want to make sure we use a deepCopy
        this.components.set(component, Components.copyObject(component).data);
        return this.component(component);
    }
    component(component) {
        const c = this.components.get(component);
        if (!c)
            return undefined;
        return c;
    }
    resetComponent(component) {
        if (!this.components.has(component))
            return undefined;
        // TODO(bret): We might want to be smarter about this and not create a new object each time
        this.components.set(component, Components.copyObject(component).data);
        return this.component(component);
    }
    removeComponent(component) {
        if (!this.components.has(component))
            return undefined;
        const comp = this.component(component);
        this.components.delete(component);
        return comp;
    }
    addGraphic(graphic) {
        this.#graphics.push(graphic);
        graphic.parent = this;
        return graphic;
    }
    addGraphics(graphics) {
        graphics.forEach((g) => this.addGraphic(g));
        return graphics;
    }
    removeGraphic(graphic) {
        const index = this.#graphics.indexOf(graphic);
        if (index < 0)
            return graphic;
        this.#graphics.splice(index, 1);
        return graphic;
    }
    removeGraphics(graphics) {
        graphics.forEach((g) => this.removeGraphic(g));
        return graphics;
    }
    getScene() {
        return this.#scene;
    }
    tweens = [];
    addTween(tween) {
        if (tween.parent)
            throw new Error('Tween already has parent');
        this.tweens.push(tween);
        tween.parent = this;
        return tween;
    }
    removeTween(tween) {
        const index = this.tweens.indexOf(tween);
        if (index < 0)
            return tween;
        this.tweens.splice(index, 1);
        return tween;
    }
    clearTweens() {
        this.tweens.splice(0, this.tweens.length);
    }
    updateTweens() {
        this.tweens.forEach((t) => t.update());
    }
    addedInternal() {
        this.added();
    }
    added() {
        //
    }
    preUpdateInternal(input) {
        this.onPreUpdate.invoke(input);
        this.preUpdate(input);
    }
    preUpdate(_input) {
        //
    }
    updateInternal(input) {
        this.onUpdate.invoke(input);
        this.updateTweens();
        this.update(input);
    }
    update(_input) {
        //
    }
    postUpdateInternal(input) {
        this.postUpdate(input);
        this.onPostUpdate.invoke(input);
        this.graphic?.update?.(input);
    }
    postUpdate(_input) {
        //
    }
    renderInternal(ctx, camera) {
        // TODO(bret): .visible should probably be on the Graphic, not the Entity itself
        if (!this.visible)
            return;
        this.#graphic?.render(ctx, camera);
        this.#graphics.forEach((g) => g.render(ctx, camera));
        this.render(ctx, camera);
        if (this.colliderVisible)
            this.renderCollider(ctx, camera);
        this.onRender.invoke(ctx, camera);
    }
    render(_ctx, _camera) {
        //
    }
    renderCollider(ctx, camera = Vec2.zero) {
        if (!this.collider)
            return;
        this.collider.render(ctx, -camera.x, -camera.y);
    }
    #collide(x, y, match, earlyOut) {
        if (!this.collider)
            return [];
        const _x = this.x;
        const _y = this.y;
        this.x = x;
        this.y = y;
        let entities = this.#scene.entities.inScene;
        let tags = [];
        switch (true) {
            case match === undefined:
                break;
            case match instanceof Entity: {
                entities = [match];
                break;
            }
            case typeof match === 'string': {
                tags = [match];
                break;
            }
            case Array.isArray(match): {
                if (match.every((item) => item instanceof Entity)) {
                    entities = match;
                }
                else {
                    tags = match;
                }
                break;
            }
            default:
                console.log(match);
                throw new Error('unknown error!!');
        }
        const n = entities.length;
        const collide = [];
        for (let i = 0; i < n; ++i) {
            const e = entities[i];
            if (e === this)
                continue;
            if (!e.collider?.collidable)
                continue;
            if (tags.length > 0) {
                if (!e.collider.tag)
                    continue;
                if (!tags.includes(e.collider.tag))
                    continue;
            }
            const collision = Collide.collide(this.collider, e.collider);
            const result = collision ? e : null;
            if (result === null)
                continue;
            collide.push(result);
            if (earlyOut)
                break;
        }
        this.x = _x;
        this.y = _y;
        return collide;
    }
    collideEntity(x, y, match) {
        return this.#collide(x, y, match, true)[0] ?? null;
    }
    collideEntities(x, y, match) {
        return this.#collide(x, y, match, false);
    }
    collide(x, y, match) {
        return this.#collide(x, y, match, true).length > 0;
    }
    collideMouse(x, y, cameraRelative = true) {
        if (!this.collider)
            return false;
        const { input } = this.#scene.engine;
        const mouseX = input.mouse.x + (cameraRelative ? this.#scene.camera.x : 0);
        const mouseY = input.mouse.y + (cameraRelative ? this.#scene.camera.y : 0);
        const _x = this.x;
        const _y = this.y;
        this.x = x;
        this.y = y;
        const res = Collide.collide(
        // TODO(bret): input.mouse.collider or smth
        {
            type: 'point',
            x: mouseX,
            // TODO(bret): fix meeeee
            // @ts-expect-error -- left and top don't exist??
            left: mouseX,
            y: mouseY,
            top: mouseY,
            collidable: true,
        }, this.collider);
        this.x = _x;
        this.y = _y;
        return res;
    }
}
//# sourceMappingURL=entity.js.map