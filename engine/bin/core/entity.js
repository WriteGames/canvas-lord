/* Canvas Lord v0.6.1 */
import * as Collide from '../collider/collide.js';
import { Vec2 } from '../math/index.js';
import * as Components from '../util/components.js';
import { Delegate } from '../util/delegate.js';
// TODO(bret): hook this up
// const _mouseCollider = new PointCollider();
export class Entity {
    #scene; // NOTE: set by scene
    components = new Map();
    depth = 0;
    #collider = undefined;
    #colliders = [];
    visible = true;
    colliderVisible = false;
    #graphic = undefined;
    #graphics = [];
    onAdded = new Delegate();
    onPreUpdate = new Delegate();
    onUpdate = new Delegate();
    onPostUpdate = new Delegate();
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
    // TODO(bret): Are we sure we want to clone this?
    get pos() {
        return this.component(Components.pos2D).clone();
    }
    set pos(val) {
        this.component(Components.pos2D).set(val);
    }
    get width() {
        return this.collider?.w ?? 0;
    }
    set width(value) {
        if (this.collider)
            this.collider.width = value;
    }
    get w() {
        return this.width;
    }
    set w(value) {
        this.width = value;
    }
    get height() {
        return this.collider?.h ?? 0;
    }
    set height(value) {
        if (this.collider)
            this.collider.height = value;
    }
    get h() {
        return this.height;
    }
    set h(value) {
        this.height = value;
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
        return this.#colliders[0];
    }
    set collider(value) {
        this.#colliders[0]?.assignParent(null);
        this.#colliders = value ? [value] : [];
        this.#colliders[0]?.assignParent(this);
    }
    get colliders() {
        return this.#colliders;
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
    addCollider(collider) {
        if (this.colliders.includes(collider))
            return;
        this.colliders.push(collider);
        collider.assignParent(this);
    }
    addColliders(...colliders) {
        colliders.forEach((collider) => this.addCollider(collider));
    }
    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index < 0)
            return;
        this.colliders.splice(index, 1);
        collider.assignParent(null);
    }
    removeColliders(...colliders) {
        colliders.forEach((collider) => this.removeCollider(collider));
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
        this.preUpdate(input);
        this.onPreUpdate.invoke(input);
    }
    preUpdate(_input) {
        //
    }
    updateInternal(input) {
        this.updateTweens();
        this.update(input);
        this.onUpdate.invoke(input);
    }
    update(_input) {
        //
    }
    postUpdateInternal(input) {
        this.postUpdate(input);
        this.onPostUpdate.invoke(input);
        this.graphic?.update(input);
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
        this.colliders.forEach((collider) => {
            collider.render(ctx, -camera.x, -camera.y);
        });
    }
    removedInternal() {
        this.removed();
        this.onRemoved.invoke();
    }
    removed() {
        //
    }
    collideEntity(x, y, match) {
        if (!this.collider)
            return null;
        return this.collider.collideEntity(x, y, 
        // TODO(bret): is there a cleaner way to do this?
        match);
    }
    collideEntities(x, y, match) {
        if (!this.collider)
            return [];
        return this.collider.collideEntities(x, y, match);
    }
    collide(x, y, match) {
        if (!this.collider)
            return false;
        return this.collider.collide(x, y, match);
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