/* Canvas Lord v0.6.1 */
import { collide } from './collide.js';
import { Entity } from '../core/entity.js';
export class Collider {
    type = 'point';
    #tags = [];
    collidable = true;
    x;
    y;
    originX = 0;
    originY = 0;
    #parent;
    color = 'red';
    get parent() {
        if (!this.#parent)
            throw new Error("No entity has been set as this collider's parent");
        return this.#parent;
    }
    get tag() {
        return this.tags[0];
    }
    set tag(value) {
        this.#tags = value !== undefined ? [value] : [];
    }
    get tags() {
        return this.#tags;
    }
    static #optionsCollidable = {
        type: 'stroke',
        color: 'red',
    };
    static #optionsNonCollidable = {
        type: 'stroke',
        color: 'gray',
    };
    get options() {
        return this.collidable
            ? Collider.#optionsCollidable
            : Collider.#optionsNonCollidable;
    }
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    get w() {
        return this.width;
    }
    set w(value) {
        this.width = value;
    }
    get h() {
        return this.height;
    }
    set h(value) {
        this.height = value;
    }
    get width() {
        throw new Error('not implemented in Collider');
    }
    set width(_value) {
        throw new Error('not implemented in Collider');
    }
    get height() {
        throw new Error('not implemented in Collider');
    }
    set height(_value) {
        throw new Error('not implemented in Collider');
    }
    get left() {
        throw new Error('not implemented in Collider');
    }
    get right() {
        throw new Error('not implemented in Collider');
    }
    get top() {
        throw new Error('not implemented in Collider');
    }
    get bottom() {
        throw new Error('not implemented in Collider');
    }
    addTag(tag) {
        if (this.tags.includes(tag))
            return;
        this.tags.push(tag);
    }
    addTags(...tags) {
        tags.forEach((tag) => this.addTag(tag));
    }
    hasTag(tag) {
        return this.tags.includes(tag);
    }
    hasTags(...tags) {
        return tags.every((tag) => this.tags.includes(tag));
    }
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index < 0)
            return;
        this.tags.splice(index, 1);
    }
    removeTags(...tags) {
        tags.forEach((tag) => this.removeTag(tag));
    }
    assignParent(parent) {
        this.#parent = parent;
    }
    #collideEntity(x, y, entity) {
        if (!this.#parent)
            return false;
        if (!this.collidable)
            return false;
        if (entity === this.#parent)
            return false;
        const _x = this.#parent.x;
        const _y = this.#parent.y;
        this.#parent.x = x;
        this.#parent.y = y;
        const result = entity.colliders.some((other) => {
            return collide(this, other);
        });
        this.#parent.x = _x;
        this.#parent.y = _y;
        return result;
    }
    #collide(x, y, match, earlyOut) {
        if (!this.#parent)
            return [];
        let entities = this.#parent.scene.entities.inScene;
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
            if (tags.length > 0) {
                if (!e.colliders.some((c) => tags.some((t) => c.hasTag(t))))
                    continue;
            }
            const collision = this.#collideEntity(x, y, e);
            const result = collision ? e : null;
            if (result === null)
                continue;
            collide.push(result);
            if (earlyOut)
                break;
        }
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
    /**
     * @deprecated Use collide() instead
     */
    _collide(other) {
        return collide(this, other);
    }
    render(_ctx, _x, _y) {
        throw new Error('render() unimplemented');
    }
}
//# sourceMappingURL=collider.js.map