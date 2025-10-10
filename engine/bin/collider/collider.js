/* Canvas Lord v0.6.1 */
import { collide } from './collide.js';
// TODO(bret): getters for left/right/top/bottom :)
export class Collider {
    type = 'point';
    #tags = [];
    collidable = true;
    x;
    y;
    originX = 0;
    originY = 0;
    parent; // NOTE(bret): This gets set via Entity
    color = 'red';
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
    addTag(tag) {
        if (this.tags.includes(tag))
            return;
        this.tags.push(tag);
    }
    addTags(...tags) {
        tags.forEach((tag) => this.addTag(tag));
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
        this.parent = parent;
    }
    collide(other) {
        collide(this, other);
    }
    render(_ctx, _x, _y) {
        throw new Error('render() unimplemented');
    }
}
//# sourceMappingURL=collider.js.map