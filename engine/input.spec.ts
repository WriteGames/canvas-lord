import { Input, type Key, type Engine } from './canvas-lord.js';
import { beforeEach, describe, expect, test } from 'vitest';

const engine = {
	focus: true,
	focusElement: document.activeElement,
} as Engine;

let input: Input;
beforeEach(() => {
	input = new Input(engine);
});

const emulateKeyDown = (input: Input, key: Key): void => {
	input.onKeyDown({
		preventDefault: () => {
			/**/
		},
		key,
	} as KeyboardEvent);
};

const emulateKeyUp = (input: Input, key: Key): void => {
	input.onKeyUp({
		preventDefault: () => {
			/**/
		},
		key,
	} as KeyboardEvent);
};

describe('input / keyboard', () => {
	test('should not have any keyboard state on a key at init', () => {
		const leftPressed = input.keyPressed('ArrowLeft');
		expect(leftPressed).toEqual(false);
		const leftHeld = input.keyCheck('ArrowLeft');
		expect(leftHeld).toEqual(false);
		const leftReleased = input.keyReleased('ArrowLeft');
		expect(leftReleased).toEqual(false);
	});

	// key down
	describe('on keydown', () => {
		beforeEach(() => {
			emulateKeyDown(input, 'ArrowLeft');
		});

		describe('first frame', () => {
			test('should register keydown events', () => {
				const leftPressed = input.keyPressed('ArrowLeft');
				expect(leftPressed).toEqual(true);
			});

			test('should be held on press frame', () => {
				const leftHeld = input.keyCheck('ArrowLeft');
				expect(leftHeld).toEqual(true);
			});
		});

		describe('second frame', () => {
			beforeEach(() => {
				input.update();
			});

			test('should only be pressed for a single frame', () => {
				const leftPressed = input.keyPressed('ArrowLeft');
				expect(leftPressed).toEqual(false);
			});

			test('should be held after press frame', () => {
				const leftHeld = input.keyCheck('ArrowLeft');
				expect(leftHeld).toEqual(true);
			});
		});
	});

	// key up
	describe('on keyup', () => {
		beforeEach(() => {
			emulateKeyDown(input, 'ArrowLeft');
			emulateKeyUp(input, 'ArrowLeft');
		});

		describe('first frame', () => {
			test('should register keyup events', () => {
				const leftReleased = input.keyReleased('ArrowLeft');
				expect(leftReleased).toEqual(true);
			});

			test('should not be held on release frame', () => {
				const leftHeld = input.keyCheck('ArrowLeft');
				expect(leftHeld).toEqual(false);
			});
		});

		describe('second frame', () => {
			beforeEach(() => {
				input.update();
			});

			test('should only be released for a single frame', () => {
				const leftReleased = input.keyReleased('ArrowLeft');
				expect(leftReleased).toEqual(false);
			});

			test('should not be held after release frame', () => {
				const leftHeld = input.keyCheck('ArrowLeft');
				expect(leftHeld).toEqual(false);
			});
		});
	});
});

const emulateMouseDown = (input: Input, button: number): void => {
	input.onMouseDown({
		preventDefault: () => {
			/**/
		},
		button,
	} as MouseEvent);
};

const emulateMouseUp = (input: Input, button: number): void => {
	input.onMouseUp({
		preventDefault: () => {
			/**/
		},
		button,
	} as MouseEvent);
};

describe('input / mouse', () => {
	test('should not have any mouse state at init', () => {
		const leftPressed = input.mousePressed();
		expect(leftPressed).toEqual(false);
		const leftHeld = input.mouseCheck();
		expect(leftHeld).toEqual(false);
		const leftReleased = input.mouseReleased();
		expect(leftReleased).toEqual(false);
	});

	// mouse down
	describe('on mousedown', () => {
		beforeEach(() => {
			emulateMouseDown(input, 0);
		});

		describe('first frame', () => {
			test('should register mousedown events', () => {
				const leftPressed = input.mousePressed();
				expect(leftPressed).toEqual(true);
			});

			test('should be held on press frame', () => {
				const leftHeld = input.mouseCheck();
				expect(leftHeld).toEqual(true);
			});
		});

		describe('second frame', () => {
			beforeEach(() => {
				input.update();
			});

			test('should only be pressed for a single frame', () => {
				const leftPressed = input.mousePressed();
				expect(leftPressed).toEqual(false);
			});

			test('should be held after press frame', () => {
				const leftHeld = input.mouseCheck();
				expect(leftHeld).toEqual(true);
			});
		});
	});

	// mouse up
	describe('on mouseup', () => {
		beforeEach(() => {
			emulateMouseDown(input, 0);
			emulateMouseUp(input, 0);
		});

		describe('first frame', () => {
			test('should register mouseup events', () => {
				const leftReleased = input.mouseReleased();
				expect(leftReleased).toEqual(true);
			});

			test('should not be held on release frame', () => {
				const leftHeld = input.mouseCheck();
				expect(leftHeld).toEqual(false);
			});
		});

		describe('second frame', () => {
			beforeEach(() => {
				input.update();
			});

			test('should only be released for a single frame', () => {
				const leftReleased = input.mouseReleased();
				expect(leftReleased).toEqual(false);
			});

			test('should not be held after release frame', () => {
				const leftHeld = input.mouseCheck();
				expect(leftHeld).toEqual(false);
			});
		});
	});
});
