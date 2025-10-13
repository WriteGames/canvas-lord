/* Canvas Lord v0.6.1 */

import type { Engine } from './engine.js';
import { Vec2 } from '../math/index.js';

type InputStatus = 0 | 1 | 2 | 3;

interface Mouse {
	pos: Vec2;
	x: Vec2[0];
	y: Vec2[1];
	realPos: Vec2;
	realX: Vec2[0];
	realY: Vec2[1];
	cursor: string | undefined;
	_clicked: [InputStatus, InputStatus, InputStatus, InputStatus, InputStatus];
}

interface HTMLElementData {
	element: HTMLElement;
	downCallback: (e: MouseEvent | TouchEvent) => boolean;
	upCallback: (e: MouseEvent | TouchEvent) => boolean;
	keys: Key[];
}

// DECIDE(bret): Could be nice to do a custom binding, so:
// AltLeft/AltRight also activate Alt
// Digit1/Numpad1 also activate some "Generic1"
export const Keys = {
	Backspace: 'Backspace',
	Tab: 'Tab',
	Enter: 'Enter',
	ShiftLeft: 'ShiftLeft',
	ShiftRight: 'ShiftRight',
	ControlLeft: 'ControlLeft',
	ControlRight: 'ControlRight',
	AltLeft: 'AltLeft',
	AltRight: 'AltRight',
	Pause: 'Pause',
	CapsLock: 'CapsLock',
	Escape: 'Escape',
	Space: 'Space',
	PageUp: 'PageUp',
	PageDown: 'PageDown',
	End: 'End',
	Home: 'Home',
	ArrowLeft: 'ArrowLeft',
	ArrowUp: 'ArrowUp',
	ArrowRight: 'ArrowRight',
	ArrowDown: 'ArrowDown',
	PrintScreen: 'PrintScreen',
	Insert: 'Insert',
	Delete: 'Delete',
	Digit0: 'Digit0',
	Digit1: 'Digit1',
	Digit2: 'Digit2',
	Digit3: 'Digit3',
	Digit4: 'Digit4',
	Digit5: 'Digit5',
	Digit6: 'Digit6',
	Digit7: 'Digit7',
	Digit8: 'Digit8',
	Digit9: 'Digit9',
	A: 'KeyA',
	B: 'KeyB',
	C: 'KeyC',
	D: 'KeyD',
	E: 'KeyE',
	F: 'KeyF',
	G: 'KeyG',
	H: 'KeyH',
	I: 'KeyI',
	J: 'KeyJ',
	K: 'KeyK',
	L: 'KeyL',
	M: 'KeyM',
	N: 'KeyN',
	O: 'KeyO',
	P: 'KeyP',
	Q: 'KeyQ',
	R: 'KeyR',
	S: 'KeyS',
	T: 'KeyT',
	U: 'KeyU',
	V: 'KeyV',
	W: 'KeyW',
	X: 'KeyX',
	Y: 'KeyY',
	Z: 'KeyZ',
	MetaLeft: 'MetaLeft',
	MetaRight: 'MetaRight',
	ContextMenu: 'ContextMenu',
	Numpad0: 'Numpad0',
	Numpad1: 'Numpad1',
	Numpad2: 'Numpad2',
	Numpad3: 'Numpad3',
	Numpad4: 'Numpad4',
	Numpad5: 'Numpad5',
	Numpad6: 'Numpad6',
	Numpad7: 'Numpad7',
	Numpad8: 'Numpad8',
	Numpad9: 'Numpad9',
	NumpadMultiply: 'NumpadMultiply',
	NumpadAdd: 'NumpadAdd',
	NumpadSubtract: 'NumpadSubtract',
	NumpadDecimal: 'NumpadDecimal',
	NumpadDivide: 'NumpadDivide',
	F1: 'F1',
	F2: 'F2',
	F3: 'F3',
	F4: 'F4',
	F5: 'F5',
	F6: 'F6',
	F7: 'F7',
	F8: 'F8',
	F9: 'F9',
	F10: 'F10',
	F11: 'F11',
	F12: 'F12',
	NumLock: 'NumLock',
	ScrollLock: 'ScrollLock',
	Semicolon: 'Semicolon',
	Equal: 'Equal',
	Comma: 'Comma',
	Minus: 'Minus',
	Period: 'Period',
	Slash: 'Slash',
	Backquote: 'Backquote',
	BracketLeft: 'BracketLeft',
	Backslash: 'Backslash',
	BracketRight: 'BracketRight',
	Quote: 'Quote',
} as const;

const _keysArr = Object.freeze(Object.values(Keys));

export type Key = (typeof Keys)[keyof typeof Keys];

export interface Input {
	engine: Engine;
	mouse: Mouse;
	keys: Record<Key, InputStatus>;
}

type MousePrototype = Pick<Mouse, 'pos' | 'realPos' | '_clicked' | 'cursor'>;

export class Input {
	constructor(engine: Engine) {
		this.engine = engine;

		const mouse: MousePrototype = {
			pos: new Vec2(-1, -1),
			realPos: new Vec2(-1, -1),
			_clicked: [0, 0, 0, 0, 0],
			cursor: undefined,
		};

		const defineXYProperties = (
			mouse: MousePrototype,
			prefix: 'real' | null = null,
		): void => {
			const posName = prefix !== null ? (`${prefix}Pos` as const) : 'pos';
			const xName = prefix !== null ? (`${prefix}X` as const) : 'x';
			const yName = prefix !== null ? (`${prefix}Y` as const) : 'y';

			([xName, yName] as const).forEach((coordName, i: number) => {
				Object.defineProperties(mouse, {
					[coordName]: {
						get() {
							return mouse[posName][i as 0 | 1];
						},
						set(val: number) {
							mouse[posName][i as 0 | 1] = val;
						},
					},
				});
			});
		};

		defineXYProperties(mouse);
		defineXYProperties(mouse, 'real');

		this.mouse = mouse as Mouse;

		this.clear();
	}

	update(): void {
		for (let i = 0; i < 5; ++i) {
			this.mouse._clicked[i] &= ~1;
		}

		_keysArr.forEach((key) => {
			this.keys[key] &= ~1;
		});

		this.engine.canvas.style.cursor = this.mouse.cursor ?? 'auto';
	}

	// Events
	// NOTE(bret): canvas.offsetLeft/Top is relative to the element's
	// offsetParent, whereas rect.left/top is relative to the viewport.
	// This also means we do not need to account for scrollX/Y
	onMouseMove(e: MouseEvent): void {
		if (document.activeElement !== this.engine.focusElement) return;

		const { canvas } = this.engine;

		const rect = canvas.getBoundingClientRect();

		const realX = e.clientX;
		const realY = e.clientY;

		this.mouse.realX = realX - rect.left - canvas._offsetX;
		this.mouse.realY = realY - rect.top - canvas._offsetY;

		this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
		this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
	}

	onMouseDown(e: MouseEvent): boolean {
		if (document.activeElement !== this.engine.focusElement) return true;

		e.preventDefault();
		if (!this.mouseCheck(e.button)) {
			this.mouse._clicked[e.button] = 3;
		}

		return false;
	}

	onMouseUp(e: MouseEvent): boolean {
		if (document.activeElement !== this.engine.focusElement) return true;

		e.preventDefault();
		if (this.mouseCheck(e.button)) {
			this.mouse._clicked[e.button] = 1;
		}

		return false;
	}

	onKeyDown(e: KeyboardEvent): boolean {
		if (document.activeElement !== this.engine.focusElement) return true;

		e.preventDefault();
		const { code } = e as { code: Key };
		if (code in this.keys && !this.keyCheck(code)) {
			this.keys[code] = 3;
		}

		return false;
	}

	onKeyUp(e: KeyboardEvent): boolean {
		if (document.activeElement !== this.engine.focusElement) return true;

		e.preventDefault();
		const { code } = e as { code: Key };
		if (code in this.keys && this.keyCheck(code)) {
			this.keys[code] = 1;
		}

		return false;
	}

	// Checks
	_checkPressed(value: InputStatus): boolean {
		return value === 3;
	}

	_checkHeld(value: InputStatus): boolean {
		return (value & 2) > 0;
	}

	_checkReleased(value: InputStatus): boolean {
		return value === 1;
	}

	mousePressed(button = 0): boolean {
		return this._checkPressed(this.mouse._clicked[button]);
	}

	mouseCheck(button = 0): boolean {
		return this._checkHeld(this.mouse._clicked[button]);
	}

	mouseReleased(button = 0): boolean {
		return this._checkReleased(this.mouse._clicked[button]);
	}

	keyPressed(...keys: Key[] | Key[][]): boolean {
		return keys.flat().some((key) => {
			if (!(key in this.keys))
				throw new Error(`"${key}" is not a valid KeyboardEvent code`);
			return this._checkPressed(this.keys[key as Key]);
		});
	}

	keyCheck(...keys: Key[] | Key[][]): boolean {
		return keys.flat().some((key) => {
			if (!(key in this.keys))
				throw new Error(`"${key}" is not a valid KeyboardEvent code`);
			return this._checkHeld(this.keys[key as Key]);
		});
	}

	keyReleased(...keys: Key[] | Key[][]): boolean {
		return keys.flat().some((key) => {
			if (!(key in this.keys))
				throw new Error(`"${key}" is not a valid KeyboardEvent code`);
			return this._checkReleased(this.keys[key as Key]);
		});
	}

	_findHTMLElement(element: string | HTMLElement): HTMLElement {
		if (typeof element !== 'string') return element;

		const foundElement = document.getElementById(element);
		if (foundElement === null)
			throw new Error(`Could not find element "${element}"`);
		return foundElement;
	}

	htmlButtons: HTMLElementData[] = [];

	registerHTMLButton(
		element: string | HTMLElement,
		...keys: Key[] | Key[][]
	): void {
		const _element = this._findHTMLElement(element);
		const _keys = keys.flat();

		_element.dataset.keys = _keys.join(',');

		const downCallback = (e: MouseEvent | TouchEvent): boolean => {
			if (e.target !== _element) return true;

			e.preventDefault();
			_keys.forEach((key) => {
				const event = new KeyboardEvent('keydown', {
					code: key,
				});
				this.engine.focusElement.focus();
				this.onKeyDown(event);
			});
			return false;
		};

		const upCallback = (e: MouseEvent | TouchEvent): boolean => {
			// if (e.target !== _element) return true;

			e.preventDefault();
			_keys.forEach((key) => {
				const event = new KeyboardEvent('keyup', {
					code: key,
				});
				this.onKeyUp(event);
			});
			return false;
		};

		_element.addEventListener('mousedown', downCallback);
		_element.addEventListener('touchstart', downCallback);
		window.addEventListener('mouseup', upCallback);
		_element.addEventListener('touchend', upCallback);
		_element.addEventListener('touchcancel', upCallback);

		this.htmlButtons.push({
			element: _element,
			downCallback,
			upCallback,
			keys: _keys,
		});
	}

	// TODO(bret): Make it so it conditionally unregisters keys
	// NOTE(bret): I do not remember what the above means
	unregisterHTMLButton(
		element: string | HTMLElement,
		...keys: Key[] | Key[][]
	): void {
		const _element = this._findHTMLElement(element);
		const _keys = keys.flat();

		const data = this.htmlButtons.find(
			({ element }) => element === _element,
		);
		if (!data) return;

		const { downCallback, upCallback } = data;

		_element.removeEventListener('mousedown', downCallback);
		_element.removeEventListener('touchstart', downCallback);
		window.addEventListener('mouseup', upCallback);
		_element.removeEventListener('touchend', upCallback);
		_element.removeEventListener('mouseleave', upCallback);
		_element.removeEventListener('touchcancel', upCallback);

		delete _element.dataset.keys;
	}

	clear(): void {
		this.keys = _keysArr.reduce<typeof this.keys>((acc, v) => {
			acc[v] = 0;
			return acc;
			// TYPE(bret): revisit this
			// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter -- tee hee will fix later
		}, {} as typeof this.keys);
	}
}
