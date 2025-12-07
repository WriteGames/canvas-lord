import {
	horizontalMovementComponent,
	verticalMovementComponent2,
	horizontalMovementSystem,
	verticalMovementSystem2,
	moveXSystem,
	moveYSystem,
} from './in/player.js';

export const platformerTutorial = {
	name: 'Platformer Tutorial',
	slug: 'platformer-tutorial',
	blocks: [
		{
			file: 'in/platformer-tut.js',
		},
		{
			file: 'in/player-scene.js',
		},
		{
			file: 'in/player.js',
		},
	],
	steps: [
		{
			name: 'Step One',
			slug: 'one',
			dynamic: [
				{
					file: 'in/player.js',
					name: 'GenPlayer',
					components: [
						horizontalMovementComponent,
						verticalMovementComponent2,
					],
					systems: [
						{
							outputType: 'inline',
							system: horizontalMovementSystem,
						},
						{
							outputType: 'inline',
							system: verticalMovementSystem2,
						},
						{
							outputType: 'function',
							alias: 'moveX',
							system: moveXSystem,
						},
						{
							outputType: 'function',
							// TODO: allow for aliases to work for render
							alias: 'moveY',
							system: moveYSystem,
						},
					],
				},
			],
		},
		{
			name: 'Step Tne',
			slug: 'two',
			dynamic: [
				{
					file: 'in/player.js',
					name: 'GenPlayer',
					components: [horizontalMovementComponent],
					systems: [
						{
							outputType: 'inline',
							system: horizontalMovementSystem,
						},
					],
				},
			],
		},
	],
} as const;
