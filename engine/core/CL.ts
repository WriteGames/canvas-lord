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

	// Engine
	static get isEngineSet(): boolean {
		return CL.#engine !== undefined;
	}

	static #setEngine(engine: Engine | undefined): void {
		CL.#engine = engine;
	}

	static getEngine<T extends Engine>(): T {
		return this.engine as T;
	}

	static get engine(): Engine {
		if (CL.#engine === undefined)
			throw new Error('CL.#engine is undefined');
		return CL.#engine;
	}

	static useEngine<T>(
		engine: Engine,
		callback: (...args: unknown[]) => T,
	): T {
		const temp = CL.#engine;
		CL.#setEngine(engine);
		const result = callback();
		CL.#setEngine(temp);
		return result;
	}

	// Input
	static getInput<T extends Input>(): T {
		return this.input as T;
	}

	static get input(): Input {
		if (CL.#engine === undefined)
			throw new Error('CL.#engine is undefined');
		return CL.#engine.input;
	}

	// Scene
	static get isSceneSet(): boolean {
		return CL.#scene !== undefined;
	}

	static #setScene(scene: Scene | undefined): void {
		CL.#scene = scene;
	}

	static getScene<T extends Scene>(): T {
		return this.scene as T;
	}

	static get scene(): Scene {
		if (CL.#scene === undefined) throw new Error('CL.#scene is undefined');
		return CL.#scene;
	}

	static useScene(
		scene: Scene,
		callback: (...args: unknown[]) => void,
	): void {
		const temp = CL.#scene;
		CL.#setScene(scene);
		callback();
		CL.#setScene(temp);
	}

	// Stats
	static get width(): number {
		return CL.engine.width;
	}

	static get height(): number {
		return CL.engine.height;
	}

	static get halfWidth(): number {
		return CL.engine.halfWidth;
	}

	static get halfHeight(): number {
		return CL.engine.halfHeight;
	}
}
