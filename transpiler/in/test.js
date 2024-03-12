import * as Components from 'canvas-lord/util/components.js';
export const testComponent = Components.createComponent({
    speed: 5,
    not_used: null,
});
export const moveLeftSystem = {
    update(entity, input) {
        const component = entity.component?.(testComponent);
        if (input.keyCheck('ArrowLeft')) {
            entity.x -= component.speed;
        }
    },
};
export const moveRightSystem = {
    update(entity, input) {
        const component = entity.component?.(testComponent);
        if (input.keyCheck('ArrowRight')) {
            entity.x += component.speed;
        }
    },
};
//# sourceMappingURL=test.js.map