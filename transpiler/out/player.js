import { Entity } from 'canvas-lord';

export class GenPlayer extends Entity {
	jumpActive = false;
	jumpElapsed = 0;
	jumpDuration = 30;
	
	update(input) {
		this.xspeed = 0;
		if (input.keyCheck(leftKeys)) this.xspeed = -2;
		if (input.keyCheck(rightKeys)) this.xspeed = 2;
		

		const grounded = this.collide(this.x, this.y + 1);
		if (grounded && input.keyPressed(jumpKeys)) {
			this.jumpElapsed = 0;
			this.jumpActive = true;
		}

		if (this.jumpActive && this.jumpElapsed < this.jumpDuration) {
			this.jumpElapsed += 1;
		} else {
			this.jumpActive = false;
		}

		if (this.jumpActive) {
			this.yspeed = -2;
		} else {
			// add gravity
			this.yspeed = 2;
		}

		// FIXME: don't hardcode strings (currently would result in an import loop)
		this.scene.logger.set('Can Jump', grounded);
		this.scene.logger.set('Jump Elapsed', this.jumpElapsed);
		this.scene.logger.set('Jump Active', this.jumpActive);

		// if (keyJumpCheck) {
		// 	this.jumpElapsed += 1;
		// } else {
		// 	this.jumpActive = false;
		// }

		// FIXME(bret): Log out to CL logger
		// console.log({ jumpElapsed: this.jumpElapsed });

		// NOTE(bret): `<`/`<=` is dependent on whether or not `keyJumpCheck` is a standalone `if` or an `else if` following `keyJumpPressed`
		// if (this.jumpActive && this.jumpElapsed <= jumpDuration) {
		// 	this.yspeed = -1;
		// } else {
		// 	this.yspeed = 1;
		// }
	}
}