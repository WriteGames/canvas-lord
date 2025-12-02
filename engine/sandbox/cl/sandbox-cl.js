import { CL, Scene, Entity } from '../../bin/main.js';
import { init } from '../sandbox.js';

class MyEntity extends Entity {
	updated = false;
	rendered = false;

	validateCL(func, input) {
		console.log(
			`[${func}] this.scene === CL.scene: `,
			this.scene === CL.scene,
		);
		console.log(
			`[${func}] this.scene.engine === CL.engine: `,
			this.scene.engine === CL.engine,
		);
		if (input) {
			console.log(
				`[${func}] this.scene.engine.input === CL.input: `,
				this.scene.engine.input === CL.input,
			);
		}
	}

	update(input) {
		if (this.updated) return;
		this.validateCL('update', input);
		this.updated = true;
	}

	render(ctx, camera) {
		super.render(ctx, camera);

		if (this.rendered) return;
		this.validateCL('render');
		this.rendered = true;
	}
}
class MyScene extends Scene {
	constructor(engine) {
		super(engine);

		this.addEntities(new MyEntity());
	}
}

init({
	games: ['1', '2', '3']
		.map((id) => `scene-${id}`)
		.map((id) => init.game(id, MyScene)),
	assetSrc: '../../img/',
	gameSettings: {
		backgroundColor: '#330000',
	},
});
