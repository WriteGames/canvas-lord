import type { Engine } from '../canvas-lord.js';
import { Vec2 } from './math.js';

type InputStatus = 0 | 1 | 2 | 3;

interface Mouse {
	pos: Vec2;
	x: Vec2[0];
	y: Vec2[1];
	realPos: Vec2;
	realX: Vec2[0];
	realY: Vec2[1];
	_clicked: [InputStatus, InputStatus, InputStatus, InputStatus, InputStatus];
}

// TODO(bret): Will need to allow for evt.key & evt.which
const _keys = [
	'Unidentified',
	'Alt',
	'AltGraph',
	'CapsLock',
	'Control',
	'Fn',
	'FnLock',
	'Hyper',
	'Meta',
	'NumLock',
	'ScrollLock',
	'Shift',
	'Super',
	'Symbol',
	'SymbolLock',
	'Enter',
	'Tab',
	' ',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowUp',
	'End',
	'Home',
	'PageDown',
	'PageUp',
	'Backspace',
	'Clear',
	'Copy',
	'CrSel',
	'Cut',
	'Delete',
	'EraseEof',
	'ExSel',
	'Insert',
	'Paste',
	'Redo',
	'Undo',
	'Accept',
	'Again',
	'Attn',
	'Cancel',
	'ContextMenu',
	'Escape',
	'Execute',
	'Find',
	'Finish',
	'Help',
	'Pause',
	'Play',
	'Props',
	'Select',
	'ZoomIn',
	'ZoomOut',
	'F1',
	'F2',
	'F3',
	'F4',
	'F5',
	'F6',
	'F7',
	'F8',
	'F9',
	'F10',
	'F11',
	'F12',
	' ',
	'!',
	'"',
	'#',
	'$',
	'%',
	'&',
	"'",
	'(',
	')',
	'*',
	'+',
	',',
	'-',
	'.',
	'/',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	':',
	';',
	'<',
	'=',
	'>',
	'?',
	'@',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
	'[',
	'\\',
	']',
	'^',
	'_',
	'`',
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
	'{',
	'|',
	'}',
	'~',
] as const;

export type Key = (typeof _keys)[number];

export interface Input {
	engine: Engine;
	mouse: Mouse;
	keys: Record<Key, InputStatus>;
}

type MousePrototype = Pick<Mouse, 'pos' | 'realPos' | '_clicked'>;

export class Input {
	constructor(engine: Engine) {
		this.engine = engine;

		const mouse: MousePrototype = {
			pos: new Vec2(-1, -1),
			realPos: new Vec2(-1, -1),
			_clicked: [0, 0, 0, 0, 0],
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

		_keys.forEach((key) => {
			this.keys[key] &= ~1;
		});
	}

	// Events
	onMouseMove(e: MouseEvent): void {
		if (document.activeElement !== this.engine.focusElement) return;

		const { canvas } = this.engine;

		const realX = e.clientX + Math.round(window.scrollX);
		const realY = e.clientY + Math.round(window.scrollY);

		this.mouse.realX = realX - canvas.offsetLeft - canvas._offsetX;
		this.mouse.realY = realY - canvas.offsetTop - canvas._offsetY;

		this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
		this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
	}

	onMouseDown(e: MouseEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		if (!this.mouseCheck(e.button)) {
			this.mouse._clicked[e.button] = 3;
		}

		return false;
	}

	onMouseUp(e: MouseEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		if (this.mouseCheck(e.button)) {
			this.mouse._clicked[e.button] = 1;
		}

		return false;
	}

	onKeyDown(e: KeyboardEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		let { key } = e as { key: Key };
		if (key.length === 1) key = key.toLowerCase() as Key;

		if (!this.keyCheck(key)) {
			this.keys[key] = 3;
		}

		return false;
	}

	onKeyUp(e: KeyboardEvent): boolean | void {
		if (document.activeElement !== this.engine.focusElement) return;

		e.preventDefault();
		const { key } = e as { key: Key };
		if (this.keyCheck(key)) {
			this.keys[key] = 1;
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

	mousePressed(button: number = 0): boolean {
		return this._checkPressed(this.mouse._clicked[button]);
	}

	mouseCheck(button: number = 0): boolean {
		return this._checkHeld(this.mouse._clicked[button]);
	}

	mouseReleased(button: number = 0): boolean {
		return this._checkReleased(this.mouse._clicked[button]);
	}

	keyPressed(key: Key | Key[]): boolean {
		if (Array.isArray(key)) return key.some((k) => this.keyPressed(k));
		return this._checkPressed(this.keys[key]);
	}

	keyCheck(key: Key | Key[]): boolean {
		if (Array.isArray(key)) return key.some((k) => this.keyCheck(k));
		return this._checkHeld(this.keys[key]);
	}

	keyReleased(key: Key | Key[]): boolean {
		if (Array.isArray(key)) return key.some((k) => this.keyReleased(k));
		return this._checkReleased(this.keys[key]);
	}

	clear(): void {
		this.keys = _keys.reduce((acc, key) => {
			acc[key] = 0;
			return acc;
		}, {} as typeof this.keys);
	}
}
