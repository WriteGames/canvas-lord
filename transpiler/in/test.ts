import { Entity, Input, Keys } from 'canvas-lord';
import * as Components from 'canvas-lord/util/components.js';

export const testComponent = Components.createComponent({
	speed: 5,
	not_used: null,
});
export const moveLeftSystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component?.(testComponent)!;
		if (input.keyCheck(Keys.ArrowLeft)) {
			entity.x -= component.speed;
		}
	},
};
export const moveRightSystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component?.(testComponent)!;
		if (input.keyCheck(Keys.ArrowRight)) {
			entity.x += component.speed;
		}
	},
};
export const deleteSelfSystem = {
	update(entity: Entity, input: Input) {
		if (input.keyCheck(Keys.Space)) {
			entity.scene.removeEntity(entity);
		}
	},
};
