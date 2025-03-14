/* Canvas Lord v0.5.3 */
import * as Collide from '../collider/collide.js';
import { PointCollider } from '../collider/index.js';
import { Vec2 } from '../math/index.js';
import * as Components from '../util/components.js';
// TODO(bret): hook this up
const _mouseCollider = new PointCollider();
export class Entity {
    scene; // NOTE: set by scene
    components = new Map();
    depth = 0;
    #collider = undefined;
    visible = true;
    #graphic = undefined;
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
    constructor(x = 0, y = 0) {
        this.addComponent(Components.pos2D);
        this.x = x;
        this.y = y;
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
    preUpdateInternal(input) {
        this.preUpdate(input);
    }
    preUpdate(_input) {
        //
    }
    updateInternal(input) {
        this.updateTweens();
        this.update(input);
    }
    update(_input) {
        //
    }
    postUpdateInternal(input) {
        this.postUpdate(input);
        this.graphic?.update?.(input);
    }
    postUpdate(_input) {
        //
    }
    render(ctx, camera) {
        // TODO(bret): .visible should probably be on the Graphic, not the Entity itself
        if (this.visible) {
            this.#graphic?.render(ctx, camera);
        }
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
        let entities = this.scene.entities.inScene;
        let tags = [];
        switch (true) {
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
                throw new Error('unknown error');
        }
        const n = entities.length;
        const collide = [];
        for (let i = 0; i < n; ++i) {
            const e = entities[i];
            if (e === this)
                continue;
            if (!e.collider?.collidable)
                continue;
            if (e.collider.tag && !tags.includes(e.collider.tag))
                continue;
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
    collideMouse(x, y) {
        if (!this.collider)
            return false;
        const { input } = this.scene.engine;
        const mouseX = input.mouse.x + this.scene.camera.x;
        const mouseY = input.mouse.y + this.scene.camera.y;
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