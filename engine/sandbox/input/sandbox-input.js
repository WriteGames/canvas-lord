import { Scene, Entity } from '../../bin/canvas-lord.js';
import { Keys } from '../../bin/core/input.js';
import { CL } from '../../bin/core/CL.js';
import { BoxCollider } from '../../bin/collider/box-collider.js';
import { GraphicList } from '../../bin/graphic/graphic-list.js';
import { Sprite } from '../../bin/graphic/sprite.js';
import { Text } from '../../bin/graphic/text.js';
import { init } from '../sandbox.js';

class CursorChanger extends Entity {
	constructor(x, y, cursorStyle) {
		super(x, y);
		const sprite = Sprite.createRect(32, 32, 'yellow');
		const text = new Text(cursorStyle, 16, 40, {
			color: 'white',
			size: 24,
			align: 'center',
		});
		this.sprite = sprite;
		this.text = text;
		this.graphic = new GraphicList(this.sprite, this.text);

		this.collider = new BoxCollider(sprite.width, sprite.height);

		this.cursorStyle = cursorStyle;
	}

	update(input) {
		super.update(input);

		const colliding = this.collideMouse(this.x, this.y);
		this.sprite.color = colliding ? 'white' : undefined;

		if (colliding) {
			input.mouse.cursor = this.cursorStyle;
		}
	}
}

class MouseScene extends Scene {
	constructor(...args) {
		super(...args);

		[
			'auto',
			'pointer',
			'zoom-out',
			'help',
			'not-allowed',
			'grab',
			'wait',
			'crosshair',
		].forEach((cursorStyle, i) => {
			const perRow = 4;
			const x = 64 + (i % perRow) * 128;
			const y = 32 + Math.floor(i / perRow) * 92;
			this.addEntity(new CursorChanger(x, y, cursorStyle));
		});

		// lil' hack bc of Sprite.createRect taking a frame
		window.requestAnimationFrame(() => {
			this.engine.render();
		});
	}

	update(...args) {
		CL.input.mouse.cursor = undefined;

		super.update(...args);
	}
}

class ButtonEntity extends Entity {
	constructor(x, y, key) {
		super(x, y);

		this.graphic = Sprite.createRect(32, 32, 'red');
		this.graphic.centerOO();

		this.key = key;
	}

	update(input) {
		if (input.keyCheck(this.key)) {
			this.graphic.color = 'lime';
		} else {
			this.graphic.color = 'red';
		}
	}
}

class ButtonScene extends Scene {
	begin() {
		const { width, height } = this.engine;
		const hWidth = width >> 1;
		const hHeight = height >> 1;
		const spacing = 50;
		this.addEntities(new ButtonEntity(hWidth - spacing, hHeight, Keys.X));
		this.addEntities(new ButtonEntity(hWidth + spacing, hHeight, Keys.Z));
	}
}

const xxx = init({
	games: [
		init.game('mouse', MouseScene, { remove: false }),
		init.game('button', ButtonScene, { remove: false }),
	],
	onLoad: (games) => {
		games[1].registerHTMLButton('button-x', Keys.X);

		games[1].registerHTMLButton('button-z', Keys.Z);
	},
	assetSrc: '../../img/',
});
