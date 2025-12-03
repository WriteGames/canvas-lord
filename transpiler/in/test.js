import { Components, Draw, Keys } from 'canvas-lord';
export const moveXSystem = {
    update(entity, input) {
        const component = entity.component(testComponent);
        const left = +input.keyCheck(Keys.ArrowLeft);
        const right = +input.keyCheck(Keys.ArrowRight);
        const dir = right - left;
        entity.x += dir * component.speed;
    },
};
export const horizontalMovementComponent = Components.createComponent({});
export const horizontalMovementSystem = {
    // @ts-expect-error -- blah
    update(entity, input) {
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
export const moveLeftSystem = {
    update(entity, input) {
        const component = entity.component(testComponent);
        if (input.keyCheck(Keys.ArrowLeft)) {
            entity.x -= component.speed;
        }
    },
    // render(entity: Entity, ctx: Ctx, camera: Camera) {
    // 	entity.render(ctx, camera);
    // },
};
export const moveRightSystem = {
    update(entity, input) {
        const component = entity.component(testComponent);
        if (input.keyCheck(Keys.ArrowRight)) {
            entity.x += component.speed;
        }
    },
    // render() {
    // 	console.log('render me!!!');
    // },
};
export const deleteSelfSystem = {
    update(entity, input) {
        if (input.keyCheck(Keys.Space)) {
            entity.scene.removeEntity(entity);
        }
    },
};
export const gmPlayerComponent = Components.createComponent({
    color: 'red',
});
export const gmPlayerSystem = {
    update(entity) {
        entity.x += 1;
    },
    render(entity, ctx) {
        const component = entity.component(gmPlayerComponent);
        Draw.rect(ctx, {
            color: component.color,
            type: 'fill',
        }, entity.x, entity.y, 32, 32);
    },
};
