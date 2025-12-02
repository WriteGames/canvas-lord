import { BoxCollider } from 'canvas-lord/collider';
import { Sprite } from 'canvas-lord/graphic';
import * as Components from 'canvas-lord/util/components';
import { jumpKeys, leftKeys, rightKeys } from './shared';
export const baseSystem = {
    init(entity) {
        entity.collider = new BoxCollider(12, 16);
        entity.graphic = Sprite.createRect(12, 16, '#ff3366');
    },
};
export const xInputLinear = {
    update(entity, input) {
        entity.xSpeed = 0;
        if (input.keyCheck(leftKeys))
            entity.xSpeed -= 4;
        if (input.keyCheck(rightKeys))
            entity.xSpeed += 4;
    },
};
export const xInputAccel = {
    update(entity, input) {
        const left = input.keyCheck(leftKeys);
        const right = input.keyCheck(rightKeys);
        if (left)
            entity.xSpeed -= entity.aSpeed;
        if (right)
            entity.xSpeed -= entity.aSpeed;
        if (!left && !right)
            entity.xSpeed -= entity.fSpeed * Math.sign(entity.xSpeed);
    },
};
export const moveXSystem = {
    update(entity) {
        const xDir = Math.sign(entity.xSpeed);
        for (let i = 0; i < Math.abs(entity.xSpeed); ++i) {
            if (entity.collide(entity.x + xDir, entity.y, 'solid')) {
                entity.xSpeed = 0;
                break;
            }
            else {
                entity.x += xDir;
            }
        }
    },
};
export const moveYSystem = {
    update(entity) {
        entity.yRemainder += entity.ySpeed;
        let moveY = Math.round(entity.yRemainder);
        if (moveY !== 0) {
            entity.yRemainder -= moveY;
            const sign = Math.sign(moveY);
            for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
                if (entity.collide(entity.x, entity.y + sign)) {
                    moveY = 0;
                    entity.ySpeed = 0;
                }
                else {
                    entity.y += sign;
                }
            }
        }
    },
};
export const baseHorizontalMovementComponent = Components.createComponent({
    xSpeed: 0,
});
export const accelerationComponent = Components.createComponent({
    aSpeed: 0.05,
    fSpeed: 0.05,
});
// this.mSpeed = 2.5; // max speed
// this.gSpeed = 0.12; // gravity
// this.jSpeed = -3.95; // initial jump velocity
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
        entity.xSpeed = 0;
        if (input.keyCheck(leftKeys))
            entity.xSpeed = -2;
        if (input.keyCheck(rightKeys))
            entity.xSpeed = 2;
    },
};
export const verticalMovementComponent = Components.createComponent({});
// TODO: do we want to assign components, or make "archetypes" that are relations between components & systems? A lot of these components are going to be the same
// TODO: separate the yspeed & entity.moveY() into a separate component/system, and then have a component that adds a system to do the actual movement
// TODO: alternatively, each scene/world could have its own understanding of how to register that component to systems (probably the best, albeit, the most typing)
export const verticalMovementSystem = {
    update(entity, input) {
        if (input.keyCheck(jumpKeys))
            entity.ySpeed = -1;
        else
            entity.ySpeed = 1;
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
        const vComp = entity.component(verticalMovementComponent2);
        const grounded = entity.collide(entity.x, entity.y + 1);
        if (grounded && input.keyPressed(jumpKeys)) {
            vComp.jumpElapsed = 0;
            vComp.jumpActive = true;
        }
        if (vComp.jumpActive && vComp.jumpElapsed < vComp.jumpDuration) {
            vComp.jumpElapsed += 1;
        }
        else {
            vComp.jumpActive = false;
        }
        if (vComp.jumpActive) {
            entity.ySpeed = -2;
        }
        else {
            // add gravity
            entity.ySpeed = 2;
        }
        // FIXME: don't hardcode strings (currently would result in an import loop)
        if ('scene' in entity && 'logger' in entity.scene) {
            const logger = entity.scene.logger;
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
