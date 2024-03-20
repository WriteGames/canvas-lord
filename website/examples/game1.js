import { V2 } from 'canvas-lord';

import { Inspector } from 'canvas-lord/inspector';

import { initGamesBase, assetManager } from './base-game';

class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;

		this.scene = null;

		this.facing = 1;

		this.xspeed = 0;
		this.xRemainder = 0;
		this.yspeed = 0;
		this.yRemainder = 0;

		this.width = 12;
		this.height = 16;

		this.aspeed = 0.05; // acceleration
		this.fspeed = 0.05; // friction

		this.mspeed = 2.5; // max speed
		this.gspeed = 0.12; // gravity
		this.jspeed = -3.95; // initial jump velocity

		this.image = assetManager.images.get('radiohead_spritesheet.png');

		this.coyote = 0;
		this.coyoteLimit = 6;

		this.jumpInput = 0;
		this.jumpInputLimit = 8;

		this.timer = 0;
		this.timeout = 5;
		this.frame = 0;
	}

	update(input) {
		const leftKeys = ['ArrowLeft', 'a', 'A'];
		const rightKeys = ['ArrowRight', 'd', 'D'];
		const jumpKeys = [' ', 'ArrowUp', 'w', 'W', 'z', 'Z'];

		const keyLeftCheck = input.keyCheck(leftKeys);
		const keyRightCheck = input.keyCheck(rightKeys);
		const keyJumpCheck = input.keyCheck(jumpKeys);

		const keyJumpPressed = input.keyPressed(jumpKeys);

		const grounded = this.collide(this.x, this.y + 1);

		// See if the player is trying to move left or right
		const xdir = keyRightCheck - keyLeftCheck;
		this.facing = xdir || this.facing;

		if (this.coyote > 0) --this.coyote;
		if (this.jumpInput > 0) --this.jumpInput;

		this.xspeed = xdir * this.mspeed;

		// See if we're on the ground
		if (grounded === true) {
			// Set coyote to the limit!
			this.coyote = this.coyoteLimit;
		}

		if (keyJumpPressed) {
			// Set jumpInput to the limit!
			this.jumpInput = this.jumpInputLimit;
		}

		// Try jumping
		if ((grounded || this.coyote > 0) && this.jumpInput > 0) {
			this.yspeed = this.jspeed;
			this.coyote = 0;
			this.jumpInput = 0;
		}

		// Apply gravity
		this.yspeed += this.gspeed;

		// Variable jump height
		if (this.yspeed < 0 && !keyJumpCheck) this.yspeed += this.gspeed;

		// Actually move
		this.moveX();
		this.moveY();

		// Handle animation
		this.updateSprite(xdir);
	}

	moveX() {
		const grounded = this.collide(this.x, this.y + 1);
		const ledgeBoostHeights = Array.from({ length: 2 }, (_, i) => i + 1);

		this.xRemainder += this.xspeed;

		let moveX = Math.round(this.xRemainder);

		if (moveX !== 0) {
			this.xRemainder -= moveX;

			const sign = Math.sign(moveX);
			for (let xx = 0, n = Math.abs(moveX); xx < n; ++xx) {
				if (this.collide(this.x + sign, this.y)) {
					const yy =
						grounded === false &&
						this.yspeed >= 0 &&
						(ledgeBoostHeights.find(
							(y) => !this.collide(this.x + sign, this.y - y),
						) ??
							false);

					if (yy === false) {
						moveX = 0;
						this.xspeed = Math.min(Math.abs(this.xspeed), 1.0) * sign;
						this.xRemainder = 0;
						break;
					}

					this.y -= yy;
				}

				this.x += sign;
			}
		}
	}

	moveY() {
		this.yRemainder += this.yspeed;
		let moveY = Math.round(this.yRemainder);

		if (moveY !== 0) {
			this.yRemainder -= moveY;

			const sign = Math.sign(moveY);
			for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
				if (this.collide(this.x, this.y + sign)) {
					moveY = 0;
					this.yspeed = 0;
				} else {
					this.y += sign;
				}
			}
		}
	}

	// TODO(bret): See if you could write this functionally :)
	collide(_x, _y) {
		const { width: w, height: h, scene } = this;

		const { grid } = scene;

		const x = Math.round(_x);
		const y = Math.round(_y);

		// TODO(bret): Should this exist as part of the Scene, or part of the grid?
		if (
			scene.boundsX !== null &&
			(x < scene.boundsX[0] || x + w > scene.boundsX[1])
		)
			return true;

		if (
			scene.boundsY !== null &&
			(y < scene.boundsY[0] || y + h > scene.boundsY[1])
		)
			return true;

		const minX = Math.clamp(Math.floor(x / grid.tileW), 0, grid.columns - 1);
		const minY = Math.clamp(Math.floor(y / grid.tileH), 0, grid.rows - 1);

		const maxX = Math.clamp(
			Math.floor((x + w - 1) / grid.tileW),
			0,
			grid.columns - 1,
		);
		const maxY = Math.clamp(
			Math.floor((y + h - 1) / grid.tileH),
			0,
			grid.rows - 1,
		);

		for (let yy = minY; yy <= maxY; ++yy) {
			for (let xx = minX; xx <= maxX; ++xx) {
				if (grid.getTile(xx, yy) === 1) {
					return true;
				}
			}
		}

		return false;
	}

	updateSprite(xdir) {
		const numFrames = 4;
		if (xdir !== 0 || this.xspeed !== 0) {
			this.timer += Math.abs(this.xspeed * 0.5);
			if (this.timer >= this.timeout) {
				this.timer = 0;
				this.frame = (this.frame + 1) % numFrames;
			}
		} else {
			this.frame = 0;
			this.timer = this.timeout - 1;
		}
	}

	render(ctx, camera = V2.zero) {
		const flipped = this.facing === -1;
		const scaleX = flipped ? -1 : 1;

		const [cameraX, cameraY] = camera;

		const drawX = this.x - cameraX;
		const drawY = this.y - cameraY;

		const drawW = this.image.width / 4;
		const drawH = this.image.height;

		const offsetX = -10;

		if (flipped) {
			ctx.save();
			ctx.scale(-1, 1);
		}

		ctx.drawImage(
			this.image,
			this.frame * 32,
			0,
			32,
			32,
			scaleX * (drawX + offsetX),
			drawY - 11,
			scaleX * drawW,
			drawH,
		);

		if (flipped) ctx.restore();

		const drawHitbox = false;
		if (drawHitbox === true) {
			ctx.strokeStyle = 'red';
			ctx.strokeRect(drawX + 0.5, drawY + 0.5, this.width - 1, this.height - 1);
		}
	}
}
export const initGames = initGamesBase(Player, ['x', 'y']);

console.log({ initGamesBase, initGames });
