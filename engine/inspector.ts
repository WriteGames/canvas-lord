/* Canvas Lord v0.6.1 */

import type { Engine } from './core/engine.js';
import type { Entity } from './core/entity.js';

interface Item {
	input: HTMLInputElement;
	latestInput: string | null;
	property: string;
	focused: boolean;
	options?: InspectorWatchOptions;
}

export interface Inspector {
	engine: Engine;
	wrapper: HTMLElement;
	items: Item[];
}

export interface InspectorWatchOptions {
	type?: 'checkbox' | 'number';
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

	watch(property: string, options?: InspectorWatchOptions): void {
		const input = document.createElement('input');
		input.type = options?.type ?? 'number';
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
			options,
		};

		if (options?.type === 'checkbox') {
			input.addEventListener('change', (e) => {
				const { checked } = e.target as HTMLInputElement;
				item.latestInput = checked.toString();
			});
		} else {
			input.addEventListener('input', (e) => {
				const { value } = e.target as HTMLInputElement;
				if (!value) return;

				item.latestInput = value;
			});
		}

		this.items.push(item);
	}

	onUpdate(): void {
		const scene = this.engine.currentScenes?.[0];
		if (!scene) return;

		// TODO(bret): Adjust TS settings so this is undefined!
		const player = scene.entities.inScene[0] as Entity | undefined;
		if (!player) return;

		this.items.forEach((item) => {
			item.focused = document.activeElement === item.input;
		});

		const updatedInputs = this.items.filter((p) => p.latestInput !== null);
		const otherInputs = this.items.filter((p) => p.latestInput === null);

		updatedInputs.forEach((item) => {
			let newValue;
			switch (item.options?.type) {
				case 'checkbox': {
					if (item.latestInput !== null)
						newValue = JSON.parse(item.latestInput) as string;
					item.latestInput = null;
					break;
				}

				case 'number':
				default: {
					newValue = Number(item.latestInput);
					if (isNaN(newValue)) {
						newValue = undefined;
					}
					if (!item.focused) item.latestInput = null;
					break;
				}
			}
			if (newValue !== undefined) {
				// @ts-expect-error -- TODO(bret): fix this
				player[item.property] = newValue;
			}
		});

		otherInputs.forEach((item) => {
			// @ts-expect-error -- TODO(bret): fix this
			item.input.value = player[item.property] as string;
		});
	}
}
