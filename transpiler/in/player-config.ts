export default {
	name: 'Player',
	components: ['horizontalMovementComponent', 'verticalMovementComponent'],
	systems: [
		{
			name: 'horizontalMovementSystem',
			outputType: 'inline',
		},
		{
			name: 'verticalMovementSystem2',
			outputType: 'inline',
		},
		{
			name: 'moveXSystem',
			outputType: 'function',
			alias: 'moveX',
		},
		{
			name: 'moveYSystem',
			outputType: 'function',
			// TODO: allow for aliases to work for render
			alias: 'moveY',
		},
	],
} as const;
