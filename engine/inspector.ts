import { Engine } from './canvas-lord.js';

interface Item {
	input: HTMLInputElement;
	latestInput: string | null;
	property: string;
	focused: boolean;
}

export interface Inspector {
	engine: Engine;
	wrapper: HTMLElement;
	items: Item[];
}

export interface InspectorWatchOptions {
	min?: number;
	max?: number;
}

export class Inspector {
	engine: Engine;
	wrapper: HTMLElement;
	items: Item[] = [];

	constructor(engine: Engine) {
		this.engine = engine;

		const inspectorElem = document.createElement('div');
		inspectorElem.classList.add('inspector');

		engine.focusElement.append(inspectorElem);

		engine.listeners.update.add(this.onUpdate.bind(this));

		this.wrapper = inspectorElem;
	}

	watch(property: string, options?: InspectorWatchOptions) {
		const input = document.createElement('input');
		input.type = 'number';
		this.wrapper.append(property, input);

		if (options) {
			if (options.min !== undefined) input.min = String(options.min);
			if (options.max !== undefined) input.max = String(options.max);
		}

		const item: Item = {
			input,
			latestInput: null,
			property,
			focused: false,
		};

		input.addEventListener('input', (e) => {
			const { value } = e.target as HTMLInputElement;
			if (!value) return;

			item.latestInput = value;
		});

		this.items.push(item);
	}

	onUpdate() {
		const scene = this.engine.currentScenes?.[0];
		if (!scene) return;

		const player = scene.entities?.[0];
		if (!player) return;

		this.items.forEach((item) => {
			item.focused = document.activeElement === item.input;
		});

		const updatedInputs = this.items.filter((p) => p.latestInput !== null);
		const otherInputs = this.items.filter((p) => p.latestInput === null);

		updatedInputs.forEach((item) => {
			const newValue = Number(item.latestInput);
			if (!isNaN(newValue)) {
				// @ts-expect-error
				player[item.property] = newValue;
			}
			if (!item.focused) item.latestInput = null;
		});

		otherInputs.forEach((item) => {
			// @ts-expect-error
			item.input.value = player[item.property];
		});
	}
}
