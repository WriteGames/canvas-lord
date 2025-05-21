/* Canvas Lord v0.6.0 */
export class Delegate {
    #callbacks;
    constructor() {
        this.#callbacks = [];
    }
    invoke(...args) {
        this.#callbacks.forEach((callback) => callback(...args));
    }
    add(callback) {
        this.#callbacks.push(callback);
    }
    remove(callback) {
        const index = this.#callbacks.indexOf(callback);
        if (index < 0)
            return;
        this.#callbacks.splice(index, 1);
    }
    removeAll() {
        this.#callbacks.splice(0, this.#callbacks.length);
    }
}
//# sourceMappingURL=delegate.js.map