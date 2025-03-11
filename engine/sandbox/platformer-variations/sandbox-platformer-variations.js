import { initGames, LOG_TYPE } from '../../examples.js';
import {
	PlayerWithComponents,
	horizontalMovementComponent,
	verticalMovementComponent,
	verticalMovementComponent2,
} from '../../player.js';
initGames('../../', [
	{
		id: 'basic',
		inspector: true,
	},
	{
		id: 'bare-bones',
		player: PlayerWithComponents,
		components: [horizontalMovementComponent, verticalMovementComponent],
		logTypes: [],
	},
	{
		id: 'yvelocity',
		player: PlayerWithComponents,
		components: [horizontalMovementComponent, verticalMovementComponent2],
		logTypes: [
			LOG_TYPE.JUMP_ACTIVE,
			LOG_TYPE.JUMP_ELAPSED,
			LOG_TYPE.CAN_JUMP,
		],
	},
]);
