import { Entity } from 'canvas-lord';

export class GenPlayer extends Entity {
	jumpActive = false;
	jumpElapsed = 0;
	jumpDuration = 30;
	
	update(input) {
		this.xspeed = 0;
		if (input.keyCheck(leftKeys))
			this.xspeed = -2;
		if (input.keyCheck(rightKeys))
			this.xspeed = 2;
		
		const grounded = this.collide(this.x, this.y + 1);
		if (grounded && input.keyPressed(jumpKeys)) {
			this.jumpElapsed = 0;
			this.jumpActive = true;
		}
		if (this.jumpActive && this.jumpElapsed < this.jumpDuration) {
			this.jumpElapsed += 1;
		}
		else {
			this.jumpActive = false;
		}
		if (this.jumpActive) {
			this.yspeed = -2;
		}
		else {
			// add gravity
			this.yspeed = 2;
		}
		// FIXME: don't hardcode strings (currently would result in an import loop)
		if (this.scene && 'logger' in this.scene) {
			const logger = this.scene.logger;
			logger.set('Can Jump', grounded);
			logger.set('Jump Elapsed', this.jumpElapsed);
			logger.set('Jump Active', this.jumpActive);
		}
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
		
		const grounded = this.collide(this.x, this.y + 1);
		const ledgeBoostHeights = Array.from({ length: 2 }, (_, i) => i + 1);
		this.xRemainder += this.xspeed;
		let moveX = Math.round(this.xRemainder);
		if (moveX !== 0) {
			this.xRemainder -= moveX;
			const sign = Math.sign(moveX);
			for (let xx = 0, n = Math.abs(moveX); xx < n; ++xx) {
				if (this.collide(this.x + sign, this.y)) {
					const yy = grounded === false &&
						this.yspeed >= 0 &&
						(ledgeBoostHeights.find((y) => !this.collide(this.x + sign, this.y - y)) ??
							false);
					if (yy === false) {
						moveX = 0;
						this.xspeed =
							Math.min(Math.abs(this.xspeed), 1.0) * sign;
						this.xRemainder = 0;
						break;
					}
					this.y -= yy;
				}
				this.x += sign;
			}
		}
		
		this.yRemainder += this.yspeed;
		let moveY = Math.round(this.yRemainder);
		if (moveY !== 0) {
			this.yRemainder -= moveY;
			const sign = Math.sign(moveY);
			for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
				if (this.collide(this.x, this.y + sign)) {
					moveY = 0;
					this.yspeed = 0;
				}
				else {
					this.y += sign;
				}
			}
		}
	}
}