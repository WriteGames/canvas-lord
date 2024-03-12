import * as Components from './util/components.js';

class Entity {
	components = new Map();

	constructor(x, y) {
		this.addComponent(Components.pos2D);

		this.x = x;
		this.y = y;
	}

	addComponent(component) {
		// TODO: we'll want to make sure we use a deepCopy
		this.components.set(component, Components.copyObject(component));
		return this.component(component);
	}

	component(component) {
		return this.components.get(component);
	}

	get x() {
		return this.component(Components.pos2D)[0];
	}
	set x(val) {
		this.component(Components.pos2D)[0] = val;
	}

	get y() {
		return this.component(Components.pos2D)[1];
	}
	set y(val) {
		this.component(Components.pos2D)[1] = val;
	}

	update() {}

	render() {}
}

export const leftKeys = ['ArrowLeft', 'a', 'A'];
export const rightKeys = ['ArrowRight', 'd', 'D'];
export const jumpKeys = [' ', 'ArrowUp', 'w', 'W', 'z', 'Z'];

export const EVENT_TYPE = {
	UPDATE_CAN_JUMP: 'update-can-jump',
	UPDATE_COYOTE: 'update-coyote',
	JUMP: 'jump',
};

// TODO(bret): Think about Entity vs Actor terminology
// Scene <-> Actor
// World <-> Entity

export class Player extends Entity {
	constructor(x, y, assetManager) {
		super(x, y);

		this.scene = null;
		this.image = assetManager.images.get('radiohead_spritesheet.png');

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

		this.coyote = 0;
		this.coyoteLimit = 6;

		this.jumpInput = 0;
		this.jumpInputLimit = 8;

		this.timer = 0;
		this.timeout = 5;
		this.frame = 0;
	}

	update(input) {
		const grounded = this.collide(this.x, this.y + 1);

		// See if the player is trying to move left or right
		const xdir = input.keyCheck(rightKeys) - input.keyCheck(leftKeys);
		this.facing = xdir || this.facing;

		// const imageComp = this.component(Components.image);
		// imageComp.scaleX = this.facing;

		if (this.coyote > 0) --this.coyote;
		if (this.jumpInput > 0) --this.jumpInput;

		// Either increase xspeed or apply friction
		if (xdir !== 0) {
			if (Math.sign(this.xspeed) === Math.sign(xdir)) {
				this.xspeed += this.aspeed * xdir;
			} else {
				this.xspeed += this.aspeed * xdir * 2;
			}
		} else {
			if (Math.abs(this.xspeed) < this.fspeed) {
				this.xspeed = 0;
			} else {
				this.xspeed -= this.fspeed * Math.sign(this.xspeed);
			}
		}

		// Make sure xspeed does not exceed mspeed;
		this.xspeed = Math.clamp(this.xspeed, -this.mspeed, this.mspeed);

		// See if we're on the ground
		if (grounded === true) {
			// Set coyote to the limit!
			this.coyote = this.coyoteLimit;
		}

		if (keyJumpPressed) {
			// Set jumpInput to the limit!
			this.jumpInput = this.jumpInputLimit;
		}

		const canJump = grounded || this.coyote > 0;
		this.scene.messages.sendMessage(EVENT_TYPE.UPDATE_CAN_JUMP, canJump);
		this.scene.messages.sendMessage(EVENT_TYPE.UPDATE_COYOTE, this.coyote);

		// Try jumping
		if (input.keyPressed(jumpKeys) && this.jumpInput > 0) {
			this.yspeed = this.jspeed;
			this.coyote = 0;
			this.jumpInput = 0;
			this.scene.messages.sendMessage(EVENT_TYPE.JUMP);
		}

		// Apply gravity
		this.yspeed += this.gspeed;

		// Variable jump height
		if (this.yspeed < 0 && !input.keyCheck(jumpKeys))
			this.yspeed += this.gspeed;

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

		const minX = Math.clamp(
			Math.floor(x / grid.tileW),
			0,
			grid.columns - 1,
		);
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

		// const imageComp = this.component(Components.image);
		// imageComp.frame = this.frame;
	}

	render(ctx, camera) {
		const flipped = this.facing === -1;
		const scaleX = flipped ? -1 : 1;

		const drawX = this.x - camera.x;
		const drawY = this.y - camera.y;

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
			ctx.strokeRect(
				drawX + 0.5,
				drawY + 0.5,
				this.width - 1,
				this.height - 1,
			);
		}
	}
}

export const baseHorizontalMovementComponent = Components.createComponent({});
export const baseHorizontalMovementSystem = {
	update(entity) {
		entity.moveX();
	},
};

export const baseVerticalMovementComponent = Components.createComponent({});
export const baseVerticalMovementSystem = {
	update(entity) {
		entity.moveY();
	},
};

export const horizontalMovementComponent = Components.createComponent({});

// DOCS: make sure to point out the weird behavior here!
export const horizontalMovementSystem = {
	update(entity, input) {
		entity.xspeed = 0;
		if (input.keyCheck(leftKeys)) entity.xspeed = -2;
		if (input.keyCheck(rightKeys)) entity.xspeed = 2;
	},
};

export const verticalMovementComponent = Components.createComponent({});

// TODO: do we want to assign components, or make "archetypes" that are relations between components & systems? A lot of these components are going to be the same
// TODO: separate the yspeed & entity.moveY() into a separate component/system, and then have a component that adds a system to do the actual movement
// TODO: alternatively, each scene/world could have its own understanding of how to register that component to systems (probably the best, albeit, the most typing)

export const verticalMovementSystem = {
	update(entity, input) {
		if (input.keyCheck(jumpKeys)) entity.yspeed = -1;
		else entity.yspeed = 1;
	},
};

// IDEA(bret): find a way to essentially make the FPS a #define constant
// IDEA(bret): Number.EPSILON is a constant globally available. Could Canvas Lord introduce a "scoped global" concept similar to how you can do it in Node.js (might have been a third-party library I'm thinking of)
export const verticalMovementComponent2 = Components.createComponent({
	jumpActive: false,
	jumpElapsed: 0,
	jumpDuration: 30, // 60 FPS
});

// TODO: maybe add a TypeScript feature that allows us to emulate pointers?
// doing something like
//		let { *jumpDuration } = vComp;
// would transpile all future calls like
//		*jumpDuration = 10
// or
//		const x = *jumpDuration
// be rewritten to be `vComp.jumpDuration` instead of `*jumpDuration`
// technically, we could drop the * before each jumpDuration
// NOTE: my code would need to be transpiled, maybe to a .ts file before going to .js, so there is a version of the code that is readable to those who aren't familiar with my syntax additions
// NOTE: that might not be a bad idea - I could write code however I want, and then enforce a style guide on the generated intermediate TS file!
// ie `jumpElapsed = (keyJumpPressed) jumpElapsed + deltaTime : 0`
// could be expanded to a if/else statement (also transform the first chunk into `+=`)
export const verticalMovementSystem2 = {
	update(entity, input) {
		const vComp = entity.component?.(verticalMovementComponent2);

		const grounded = entity.collide(entity.x, entity.y + 1);
		if (grounded && input.keyPressed(jumpKeys)) {
			vComp.jumpElapsed = 0;
			vComp.jumpActive = true;
		}

		if (vComp.jumpActive && vComp.jumpElapsed < vComp.jumpDuration) {
			vComp.jumpElapsed += 1;
		} else {
			vComp.jumpActive = false;
		}

		if (vComp.jumpActive) {
			entity.yspeed = -2;
		} else {
			// add gravity
			entity.yspeed = 2;
		}

		// FIXME: don't hardcode strings (currently would result in an import loop)
		entity.scene.logger.set('Can Jump', grounded);
		entity.scene.logger.set('Jump Elapsed', vComp.jumpElapsed);
		entity.scene.logger.set('Jump Active', vComp.jumpActive);

		// if (keyJumpCheck) {
		// 	vComp.jumpElapsed += 1;
		// } else {
		// 	vComp.jumpActive = false;
		// }

		// FIXME(bret): Log out to CL logger
		// console.log({ jumpElapsed: vComp.jumpElapsed });

		// NOTE(bret): `<`/`<=` is dependent on whether or not `keyJumpCheck` is a standalone `if` or an `else if` following `keyJumpPressed`
		// if (vComp.jumpActive && vComp.jumpElapsed <= jumpDuration) {
		// 	entity.yspeed = -1;
		// } else {
		// 	entity.yspeed = 1;
		// }
	},
};

export class PlayerWithComponents extends Entity {
	constructor(x, y, assetManager) {
		super(x, y);

		this.scene = null;
		this.image = assetManager.images.get('radiohead_spritesheet.png');

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

		this.coyote = 0;
		this.coyoteLimit = 6;

		this.jumpInput = 0;
		this.jumpInputLimit = 8;

		this.timer = 0;
		this.timeout = 5;
		this.frame = 0;

		const imageComp = this.addComponent(Components.image);
		imageComp.offsetX = 10;
		imageComp.offsetY = 11;
		imageComp.originX = 16;
		imageComp.frameW = 32;
		imageComp.frameH = 32;
		imageComp.imageSrc = assetManager.images.get(
			'radiohead_spritesheet.png',
		);
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

		const minX = Math.clamp(
			Math.floor(x / grid.tileW),
			0,
			grid.columns - 1,
		);
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

	render(ctx, camera) {
		const flipped = this.facing === -1;
		const scaleX = flipped ? -1 : 1;

		const drawX = this.x - camera.x;
		const drawY = this.y - camera.y;

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
			ctx.strokeRect(
				drawX + 0.5,
				drawY + 0.5,
				this.width - 1,
				this.height - 1,
			);
		}
	}
}
