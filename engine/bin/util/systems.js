/* Canvas Lord v0.6.1 */
import { Draw } from './draw.js';
import { image } from './components.js';
import * as Components from './components.js';
export const imageSystem = {
    render(entity, ctx, camera) {
        const _image = entity.component(image);
        if (!_image)
            return;
        const drawX = entity.x - camera.x - _image.originX;
        const drawY = entity.y - camera.y - _image.originY;
        const sourceX = _image.frame * _image.frameW;
        Draw.image(ctx, _image, drawX, drawY, sourceX, 0, _image.frameW, _image.frameH);
    },
};
export const rectSystem = {
    update(entity) {
        const _rect = entity.component(Components.rect);
        if (!_rect)
            return;
        _rect.angle += 2;
    },
    render(entity, ctx, camera) {
        const _rect = entity.component(Components.rect);
        if (!_rect)
            return;
        Draw.rect(ctx, _rect, entity.x - camera.x - _rect.originX, entity.y - camera.y - _rect.originY, _rect.width, _rect.height);
    },
};
export const circleSystem = {
    render(entity, ctx, camera) {
        const _circle = entity.component(Components.circle);
        if (!_circle)
            return;
        Draw.circle(ctx, _circle, entity.x - camera.x - _circle.originX, entity.y - camera.y - _circle.originY, _circle.radius || 5);
    },
};
export const moveEightSystem = {
    update: (entity) => {
        const move8Comp = entity.component(Components.moveEightComponent);
        if (!move8Comp)
            return;
        const { originX, originY, dt } = move8Comp;
        entity.x = originX + Math.cos(dt / 16) * 16;
        entity.y = originY + Math.sin(dt / 8) * 8;
        ++move8Comp.dt;
    },
};
//# sourceMappingURL=systems.js.map