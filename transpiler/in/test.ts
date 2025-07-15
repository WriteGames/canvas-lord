import type { Entity, Input } from 'canvas-lord';
import type { GetSystemUpdate, IEntitySystem } from 'canvas-lord/util/types';

import { Draw, Keys } from 'canvas-lord';
import * as Components from 'canvas-lord/util/components';
import { Ctx } from 'canvas-lord/util/canvas.ts';

interface Player extends Entity {
	speed: number;
	// TODO(bret): we could get aliases based off of these tbh
	moveX: GetSystemUpdate<typeof moveXSystem>;
}

export const moveXSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component(testComponent)!;
		const left = +input.keyCheck(Keys.ArrowLeft);
		const right = +input.keyCheck(Keys.ArrowRight);
		const dir = right - left;
		entity.x += dir * component.speed;
	},
};

export const horizontalMovementComponent = Components.createComponent({});
export const horizontalMovementSystem: IEntitySystem = {
	// @ts-expect-error -- blah
	update(entity: Player, input: Input) {
		entity.moveX(input);
	},
};

export const testComponent = Components.createComponent({
	speed: 5,
	not_used: null,
});
export const testComponent2 = Components.createComponent({
	foo: 'bar',
});
export const moveLeftSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component(testComponent)!;
		if (input.keyCheck(Keys.ArrowLeft)) {
			entity.x -= component.speed;
		}
	},
	// render(entity: Entity, ctx: Ctx, camera: Camera) {
	// 	entity.render(ctx, camera);
	// },
};
export const moveRightSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component(testComponent)!;
		if (input.keyCheck(Keys.ArrowRight)) {
			entity.x += component.speed;
		}
	},
	// render() {
	// 	console.log('render me!!!');
	// },
};
export const deleteSelfSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		if (input.keyCheck(Keys.Space)) {
			entity.scene.removeEntity(entity);
		}
	},
};

export const gmPlayerComponent = Components.createComponent({
	color: 'red',
});
export const gmPlayerSystem: IEntitySystem = {
	update(entity: Entity) {
		entity.x += 1;
	},
	render(entity: Entity, ctx: Ctx) {
		const component = entity.component(gmPlayerComponent)!;
		Draw.rect(
			ctx,
			{
				color: component.color,
				type: 'fill',
			},
			entity.x, entity.y, 32, 32,
		);
	},
};
