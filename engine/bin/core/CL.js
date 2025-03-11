/* eslint-disable unicorn/filename-case -- don't worry about it */
/* Canvas Lord v0.5.3 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- we want a static class here
export class CL {
    static #engine;
    static #scene;
    constructor() {
        throw new Error('this is a static class');
    }
    static get engine() {
        if (CL.#engine === undefined)
            throw new Error('CL.#engine is undefined');
        return CL.#engine;
    }
    static get input() {
        if (CL.#engine === undefined)
            throw new Error('CL.#engine is undefined');
        return CL.#engine.input;
    }
    static get scene() {
        if (CL.#scene === undefined)
            throw new Error('CL.#scene is undefined');
        return CL.#scene;
    }
    static __setEngine(engine) {
        CL.#engine = engine;
    }
    static __setScene(scene) {
        CL.#scene = scene;
    }
}
/* eslint-enable unicorn/filename-case -- don't worry about it */
//# sourceMappingURL=CL.js.map