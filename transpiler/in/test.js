import { Keys } from 'canvas-lord';
import * as Components from 'canvas-lord/util/components';
export const horizontalMovementComponent = Components.createComponent({});
export const horizontalMovementSystem = {
    update(entity) {
        entity.moveX();
    },
};
export const testComponent = Components.createComponent({
    speed: 5,
    not_used: null,
});
export const moveLeftSystem = {
    update(entity, input) {
        const component = entity.component?.(testComponent);
        if (input.keyCheck(Keys.ArrowLeft)) {
            entity.x -= component.speed;
        }
    },
};
export const moveRightSystem = {
    update(entity, input) {
        const component = entity.component?.(testComponent);
        if (input.keyCheck(Keys.ArrowRight)) {
            entity.x += component.speed;
        }
    },
};
export const deleteSelfSystem = {
    update(entity, input) {
        if (input.keyCheck(Keys.Space)) {
            entity.scene.removeEntity(entity);
        }
    },
};
//# sourceMappingURL=test.js.map