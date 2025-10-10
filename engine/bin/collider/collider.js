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
        throw new Error('not implemented in Collider');
    }
    set w(_value) {
        throw new Error('not implemented in Collider');
    }
    get h() {
        throw new Error('not implemented in Collider');
    }
    set h(_value) {
        throw new Error('not implemented in Collider');
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
    collide(other) {
        collide(this, other);
    }
    render(_ctx, _x, _y) {
        throw new Error('render() unimplemented');
    }
}
//# sourceMappingURL=collider.js.map