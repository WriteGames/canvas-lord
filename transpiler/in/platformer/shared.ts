import type { IEntity } from 'canvas-lord/core/entity';
import type { Key } from 'canvas-lord/core/input';

export const leftKeys: Key[] = ['ArrowLeft', 'KeyA'];
export const rightKeys: Key[] = ['ArrowRight', 'KeyD'];
export const jumpKeys: Key[] = ['Space', 'ArrowUp', 'KeyW', 'KeyZ'];

export const EVENT_TYPE = {
	UPDATE_CAN_JUMP: 'update-can-jump',
	UPDATE_COYOTE: 'update-coyote',
	JUMP: 'jump',
};

export type PlayerEntity = IEntity & {
	xSpeed: number;
	ySpeed: number;
	aSpeed: number;
	fSpeed: number;
	xRemainder: number;
	yRemainder: number;
	moveX: () => void;
	moveY: () => void;
	collide: (x: number, y: number) => boolean;
};
