/* eslint-disable unicorn/filename-case -- don't worry about it */
/* Canvas Lord v0.5.3 */

import type { Engine } from './engine.js';
import type { Input } from './input.js';
import type { Scene } from './scene.js';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- we want a static class here
export class CL {
	static #engine: Engine | undefined;
	static #scene: Scene | undefined;

	constructor() {
		throw new Error('this is a static class');
	}

	static get isEngineSet(): boolean {
		return CL.#engine !== undefined;
	}

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

	static __setEngine(engine: Engine | undefined): void {
		CL.#engine = engine;
	}

	static __setScene(scene: Scene | undefined): void {
		CL.#scene = scene;
	}
}
/* eslint-enable unicorn/filename-case -- don't worry about it */
