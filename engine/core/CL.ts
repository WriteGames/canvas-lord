import type { Engine } from './engine.js';
import type { Input } from './input.js';
import type { Scene } from './scene.js';

export class CL {
	static #engine: Engine | undefined;
	static #scene: Scene | undefined;

	static get engine(): Engine {
		if (CL.#engine === undefined)
			throw new Error('CL.#engine is undefined');
		return CL.#engine;
	}

	static get input(): Input {
		if (CL.#engine === undefined)
			throw new Error('CL.#engine is undefined');
		return CL.#engine.input;
	}

	static get scene(): Scene {
		if (CL.#scene === undefined) throw new Error('CL.#scene is undefined');
		return CL.#scene;
	}

	static __setEngine(engine: Engine | undefined) {
		CL.#engine = engine;
	}

	static __setScene(scene: Scene | undefined) {
		CL.#scene = scene;
	}
}
