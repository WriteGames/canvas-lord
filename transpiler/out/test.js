import { Entity } from 'canvas-lord/util/entity.js';

export class Test extends Entity {
	speed = 5;
	
	update(input) {
		if (input.keyCheck('ArrowLeft')) {
			this.x -= this.speed;
		}
		
		if (input.keyCheck('ArrowRight')) {
			this.x += this.speed;
		}
	}
}