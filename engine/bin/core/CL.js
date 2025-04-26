/* eslint-disable unicorn/filename-case -- don't worry about it */
/* Canvas Lord v0.5.3 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- we want a static class here
export class CL {
    static #engine;
    static #scene;
    constructor() {
        throw new Error('this is a static class');
    }
    // Engine
    static get isEngineSet() {
        return CL.#engine !== undefined;
    }
    static #setEngine(engine) {
        CL.#engine = engine;
    }
    static getEngine() {
        return this.engine;
    }
    static get engine() {
        if (CL.#engine === undefined)
            throw new Error('CL.#engine is undefined');
        return CL.#engine;
    }
    static useEngine(engine, callback) {
        const temp = CL.#engine;
        CL.#setEngine(engine);
        const result = callback();
        CL.#setEngine(temp);
        return result;
    }
    // Input
    static getInput() {
        return this.input;
    }
    static get input() {
        if (CL.#engine === undefined)
            throw new Error('CL.#engine is undefined');
        return CL.#engine.input;
    }
    // Scene
    static get isSceneSet() {
        return CL.#scene !== undefined;
    }
    static #setScene(scene) {
        CL.#scene = scene;
    }
    static getScene() {
        return this.scene;
    }
    static get scene() {
        if (CL.#scene === undefined)
            throw new Error('CL.#scene is undefined');
        return CL.#scene;
    }
    static useScene(scene, callback) {
        const temp = CL.#scene;
        CL.#setScene(scene);
        callback();
        CL.#setScene(temp);
    }
    // Stats
    static get width() {
        return CL.engine.width;
    }
    static get height() {
        return CL.engine.height;
    }
    static get halfWidth() {
        return CL.engine.halfWidth;
    }
    static get halfHeight() {
        return CL.engine.halfHeight;
    }
}
/* eslint-enable unicorn/filename-case -- don't worry about it */
//# sourceMappingURL=CL.js.map