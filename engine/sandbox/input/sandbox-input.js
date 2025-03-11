import { Scene, Entity } from '../../bin/canvas-lord.js';
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

init({
	games: [init.game('mouse', MouseScene)],
	assetSrc: '../../img/',
});
