class GenPlayer extends Entity {
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