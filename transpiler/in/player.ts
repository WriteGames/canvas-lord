import { IEntity, Input, Key } from 'canvas-lord';
import * as Components from 'canvas-lord/util/components.js';
import { Logger } from 'canvas-lord/util/logger.js';

export const leftKeys: Key[] = ['ArrowLeft', 'a', 'A'];
export const rightKeys: Key[] = ['ArrowRight', 'd', 'D'];
export const jumpKeys: Key[] = [' ', 'ArrowUp', 'w', 'W', 'z', 'Z'];

export const EVENT_TYPE = {
	UPDATE_CAN_JUMP: 'update-can-jump',
	UPDATE_COYOTE: 'update-coyote',
	JUMP: 'jump',
};

type PlayerEntity = IEntity & {
	xspeed: number;
	yspeed: number;
	xRemainder: number;
	yRemainder: number;
	moveX: () => void;
	moveY: () => void;
	collide: (x: number, y: number) => boolean;
};

export const moveXSystem = {
	update(entity: PlayerEntity) {
		const grounded = entity.collide(entity.x, entity.y + 1);
		const ledgeBoostHeights = Array.from({ length: 2 }, (_, i) => i + 1);

		entity.xRemainder += entity.xspeed;

		let moveX = Math.round(entity.xRemainder);

		if (moveX !== 0) {
			entity.xRemainder -= moveX;

			const sign = Math.sign(moveX);
			for (let xx = 0, n = Math.abs(moveX); xx < n; ++xx) {
				if (entity.collide(entity.x + sign, entity.y)) {
					const yy =
						grounded === false &&
						entity.yspeed >= 0 &&
						(ledgeBoostHeights.find(
							(y) =>
								!entity.collide(entity.x + sign, entity.y - y),
						) ??
							false);

					if (yy === false) {
						moveX = 0;
						entity.xspeed =
							Math.min(Math.abs(entity.xspeed), 1.0) * sign;
						entity.xRemainder = 0;
						break;
					}

					entity.y -= yy;
				}

				entity.x += sign;
			}
		}
	},
};

export const moveYSystem = {
	update(entity: PlayerEntity) {
		entity.yRemainder += entity.yspeed;
		let moveY = Math.round(entity.yRemainder);

		if (moveY !== 0) {
			entity.yRemainder -= moveY;

			const sign = Math.sign(moveY);
			for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
				if (entity.collide(entity.x, entity.y + sign)) {
					moveY = 0;
					entity.yspeed = 0;
				} else {
					entity.y += sign;
				}
			}
		}
	},
};

export const baseHorizontalMovementComponent = Components.createComponent({});
export const baseHorizontalMovementSystem = {
	update(entity: PlayerEntity) {
		entity.moveX();
	},
};

export const baseVerticalMovementComponent = Components.createComponent({});
export const baseVerticalMovementSystem = {
	update(entity: PlayerEntity) {
		entity.moveY();
	},
};

export const horizontalMovementComponent = Components.createComponent({});

// DOCS: make sure to point out the weird behavior here!
export const horizontalMovementSystem = {
	update(entity: PlayerEntity, input: Input) {
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
	update(entity: PlayerEntity, input: Input) {
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
	update(entity: PlayerEntity, input: Input) {
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
		if (entity.scene && 'logger' in entity.scene) {
			const logger = entity.scene.logger as Logger;
			logger.set('Can Jump', grounded);
			logger.set('Jump Elapsed', vComp.jumpElapsed);
			logger.set('Jump Active', vComp.jumpActive);
		}

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
