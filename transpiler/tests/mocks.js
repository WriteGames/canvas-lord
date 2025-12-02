export const horizontalMovementComponentMock = {
    name: 'horizontalMovementComponent',
    content: 'export const horizontalMovementComponent = Components.createComponent({});',
    type: 'IEntityComponentType<{}>',
    properties: [],
};
export const testComponentMock = {
    content: `export const testComponent = Components.createComponent({
	speed: 5,
	not_used: null,
});`,
    name: 'testComponent',
    properties: [
        {
            initialValue: '5',
            name: 'speed',
            type: 'number',
        },
        {
            initialValue: 'null',
            name: 'not_used',
            type: 'null',
        },
    ],
    type: 'IEntityComponentType<{ speed: number; not_used: any; }>',
};
export const moveLeftSystemMock = {
    content: `export const moveLeftSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component?.(testComponent)!;
		if (input.keyCheck(Keys.ArrowLeft)) {
			entity.x -= component.speed;
		}
	},
};`,
    name: 'moveLeftSystem',
    type: 'IEntitySystem',
};
export const moveRightSystemMock = {
    content: `export const moveRightSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		const component = entity.component?.(testComponent)!;
		if (input.keyCheck(Keys.ArrowRight)) {
			entity.x += component.speed;
		}
	},
};`,
    name: 'moveRightSystem',
    type: 'IEntitySystem',
};
export const deleteSelfSystemMock = {
    content: `export const deleteSelfSystem: IEntitySystem = {
	update(entity: Entity, input: Input) {
		if (input.keyCheck(Keys.Space)) {
			entity.scene.removeEntity(entity);
		}
	},
};`,
    name: 'deleteSelfSystem',
    type: 'IEntitySystem',
};
