import { collide } from './collide.js';
// TODO(bret): getters for left/right/top/bottom :)
export class Collider {
    type = 'point';
    tag;
    collidable = true;
    x;
    y;
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
    collide(other) {
        collide(this, other);
    }
    render(ctx, x, y) {
        throw new Error('render() unimplemented');
    }
}
//# sourceMappingURL=collider.js.map