import { Vec2 } from './math.js';
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
];
export class Input {
    constructor(engine) {
        this.engine = engine;
        const mouse = {
            pos: new Vec2(-1, -1),
            realPos: new Vec2(-1, -1),
            _clicked: [0, 0, 0, 0, 0],
        };
        const defineXYProperties = (mouse, prefix = null) => {
            const posName = prefix !== null ? `${prefix}Pos` : 'pos';
            const xName = prefix !== null ? `${prefix}X` : 'x';
            const yName = prefix !== null ? `${prefix}Y` : 'y';
            [xName, yName].forEach((coordName, i) => {
                Object.defineProperties(mouse, {
                    [coordName]: {
                        get() {
                            return mouse[posName][i];
                        },
                        set(val) {
                            mouse[posName][i] = val;
                        },
                    },
                });
            });
        };
        defineXYProperties(mouse);
        defineXYProperties(mouse, 'real');
        this.mouse = mouse;
        this.clear();
    }
    update() {
        for (let i = 0; i < 5; ++i) {
            this.mouse._clicked[i] &= ~1;
        }
        _keys.forEach((key) => {
            this.keys[key] &= ~1;
        });
    }
    // Events
    onMouseMove(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        const { canvas } = this.engine;
        const realX = e.clientX + Math.round(window.scrollX);
        const realY = e.clientY + Math.round(window.scrollY);
        this.mouse.realX = realX - canvas.offsetLeft - canvas._offsetX;
        this.mouse.realY = realY - canvas.offsetTop - canvas._offsetY;
        this.mouse.x = Math.floor(this.mouse.realX / canvas._scaleX);
        this.mouse.y = Math.floor(this.mouse.realY / canvas._scaleY);
    }
    onMouseDown(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        if (!this.mouseCheck(e.button)) {
            this.mouse._clicked[e.button] = 3;
        }
        return false;
    }
    onMouseUp(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        if (this.mouseCheck(e.button)) {
            this.mouse._clicked[e.button] = 1;
        }
        return false;
    }
    onKeyDown(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        let { key } = e;
        if (key.length === 1)
            key = key.toLowerCase();
        if (!this.keyCheck(key)) {
            this.keys[key] = 3;
        }
        return false;
    }
    onKeyUp(e) {
        if (document.activeElement !== this.engine.focusElement)
            return;
        e.preventDefault();
        const { key } = e;
        if (this.keyCheck(key)) {
            this.keys[key] = 1;
        }
        return false;
    }
    // Checks
    _checkPressed(value) {
        return value === 3;
    }
    _checkHeld(value) {
        return (value & 2) > 0;
    }
    _checkReleased(value) {
        return value === 1;
    }
    mousePressed(button = 0) {
        return this._checkPressed(this.mouse._clicked[button]);
    }
    mouseCheck(button = 0) {
        return this._checkHeld(this.mouse._clicked[button]);
    }
    mouseReleased(button = 0) {
        return this._checkReleased(this.mouse._clicked[button]);
    }
    keyPressed(key) {
        if (Array.isArray(key))
            return key.some((k) => this.keyPressed(k));
        return this._checkPressed(this.keys[key]);
    }
    keyCheck(key) {
        if (Array.isArray(key))
            return key.some((k) => this.keyCheck(k));
        return this._checkHeld(this.keys[key]);
    }
    keyReleased(key) {
        if (Array.isArray(key))
            return key.some((k) => this.keyReleased(k));
        return this._checkReleased(this.keys[key]);
    }
    clear() {
        this.keys = _keys.reduce((acc, key) => {
            acc[key] = 0;
            return acc;
        }, {});
    }
}
//# sourceMappingURL=input.js.map