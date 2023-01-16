import './canvas-lord';

const engine = {
	focus: true,
} as Engine;

const loadCanvasLordScript = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.async = true;
		script.setAttribute('src', './canvas-lord/src/canvas-lord.js');

		script.addEventListener('load', () => resolve());
		script.addEventListener('error', reject);

		document.body.appendChild(script);
	});
};

const KEY = {
	LEFT: 37 as KeyCode,
	UP: 38 as KeyCode,
	RIGHT: 39 as KeyCode,
} as const;

const emulateKeyDown = (input: Input, key: KeyCode | KeyCode[]): void => {
	input.onKeyDown({
		preventDefault: () => {
			/**/
		},
		keyCode: key,
	} as KeyboardEvent);
};

const emulateKeyUp = (input: Input, key: KeyCode | KeyCode[]): void => {
	input.onKeyUp({
		preventDefault: () => {
			/**/
		},
		keyCode: key,
	} as KeyboardEvent);
};

beforeAll(async () => {
	// TODO: find a better solution for this!
	await loadCanvasLordScript();
});

let input: Input;
beforeEach(() => {
	input = new Input(engine);
});

describe('input', () => {
	test('should not have any state on a key at init', () => {
		const input = new Input(engine);
		const leftPressed = input.keyCodePressed(KEY.LEFT);
		expect(leftPressed).toEqual(false);
		const leftHeld = input.keyCodeCheck(KEY.LEFT);
		expect(leftHeld).toEqual(false);
		const leftReleased = input.keyCodeReleased(KEY.LEFT);
		expect(leftReleased).toEqual(false);
	});

	// key down
	describe('on keydown', () => {
		beforeEach(() => {
			emulateKeyDown(input, KEY.LEFT);
		});

		describe('first frame', () => {
			test('should register keydown events', () => {
				const leftPressed = input.keyCodePressed(KEY.LEFT);
				expect(leftPressed).toEqual(true);
			});

			test('should be held on press frame', () => {
				const leftHeld = input.keyCodeCheck(KEY.LEFT);
				expect(leftHeld).toEqual(true);
			});
		});

		describe('second frame', () => {
			beforeEach(() => {
				input.update();
			});

			test('should only be pressed for a single frame', () => {
				const leftPressed = input.keyCodePressed(KEY.LEFT);
				expect(leftPressed).toEqual(false);
			});

			test('should be held after press frame', () => {
				const leftHeld = input.keyCodeCheck(KEY.LEFT);
				expect(leftHeld).toEqual(true);
			});
		});
	});

	// key up
	describe('on keyup', () => {
		beforeEach(() => {
			emulateKeyDown(input, KEY.LEFT);
			emulateKeyUp(input, KEY.LEFT);
		});

		describe('first frame', () => {
			test('should register keyup events', () => {
				const leftReleased = input.keyCodeReleased(KEY.LEFT);
				expect(leftReleased).toEqual(true);
			});

			test('should not be held on release frame', () => {
				const leftHeld = input.keyCodeCheck(KEY.LEFT);
				expect(leftHeld).toEqual(false);
			});
		});

		describe('second frame', () => {
			beforeEach(() => {
				input.update();
			});

			test('should only be released for a single frame', () => {
				const leftReleased = input.keyCodeReleased(KEY.LEFT);
				expect(leftReleased).toEqual(false);
			});

			test('should not be held after release frame', () => {
				const leftHeld = input.keyCodeCheck(KEY.LEFT);
				expect(leftHeld).toEqual(false);
			});
		});
	});
});
