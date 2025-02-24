export class CL {
    static #engine;
    static #scene;
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
//# sourceMappingURL=CL.js.map