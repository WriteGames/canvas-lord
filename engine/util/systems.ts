/* Canvas Lord v0.5.3 */

import { IEntitySystem } from './types.js';
import { Draw } from './draw.js';
import { image } from './components.js';

import * as Components from './components.js';

export const imageSystem: IEntitySystem = {
	render(entity, ctx, camera) {
		const _image = entity.component?.(image);

		if (!_image) return;

		// TODO(bret): Remove the ignore!
		// @ts-ignore
		const drawX = entity.x - camera.x - _image.originX;
		// TODO(bret): Remove the ignore!
		// @ts-ignore
		const drawY = entity.y - camera.y - _image.originY;

		const sourceX = _image.frame * _image.frameW;

		Draw.image(
			ctx,
			_image,
			drawX,
			drawY,
			sourceX,
			0,
			_image.frameW,
			_image.frameH,
		);
	},
};

export const rectSystem: IEntitySystem = {
	update(entity) {
		const _rect = entity.component?.(Components.rect);
		if (!_rect) return;

		// TODO(bret): Remove the ignore!
		// @ts-ignore
		_rect.angle += 2;
	},
	render(entity, ctx, camera) {
		const _rect = entity.component?.(Components.rect);
		if (!_rect) return;

		Draw.rect(
			ctx,
			_rect,
			// TODO(bret): Remove the ignore!
			// @ts-ignore
			entity.x - camera.x - _rect.originX,
			// TODO(bret): Remove the ignore!
			// @ts-ignore
			entity.y - camera.y - _rect.originY,
			_rect.width,
			_rect.height,
		);
	},
};

export const circleSystem: IEntitySystem = {
	render(entity, ctx, camera) {
		const _circle = entity.component?.(Components.circle);
		if (!_circle) return;

		Draw.circle(
			ctx,
			_circle,
			// TODO(bret): Remove the ignore!
			// @ts-ignore
			entity.x - camera.x - _circle.originX,
			// TODO(bret): Remove the ignore!
			// @ts-ignore
			entity.y - camera.y - _circle.originY,
			_circle.radius || 5,
		);
	},
};

export const moveEightSystem: IEntitySystem = {
	update: (entity) => {
		const move8Comp = entity.component?.(Components.moveEightComponent);
		if (!move8Comp) return;

		const { originX, originY, dt } = move8Comp;

		entity.x = originX + Math.cos(dt / 16) * 16;
		entity.y = originY + Math.sin(dt / 8) * 8;
		++move8Comp.dt;
	},
};
