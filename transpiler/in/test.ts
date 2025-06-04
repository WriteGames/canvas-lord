import { Entity, Input, Keys } from 'canvas-lord';
import * as Components from 'canvas-lord/util/components';
import { IEntitySystem } from 'canvas-lord/util/types';

interface PlayerEntity {
	moveX: () => void;
}

export const horizontalMovementComponent = Components.createComponent({});
export const horizontalMovementSystem = {
	update(entity: PlayerEntity) {
		entity.moveX();
	},
};

export const testComponent = Components.createComponent({
	speed: 5,
	not_used: null,
});
export const moveLeftSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component?.(testComponent)!;
		if (input.keyCheck(Keys.ArrowLeft)) {
			entity.x -= component.speed;
		}
	},
};
export const moveRightSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component?.(testComponent)!;
		if (input.keyCheck(Keys.ArrowRight)) {
			entity.x += component.speed;
		}
	},
};
export const deleteSelfSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		if (input.keyCheck(Keys.Space)) {
			entity.scene.removeEntity(entity);
		}
	},
};
