let grid;

class Game {
	constructor(id) {
		this.focus = false;
		
		this.canvas = document.q(`#${id}`);
		this.ctx = this.canvas.getContext('2d', {
			alpha: false
		});
		
		this.ctx.imageSmoothingEnabled = false;
		
		this.offscreenCanvas = $new('canvas').element();
		this.offscreenCanvas.width = this.canvas.width;
		this.offscreenCanvas.height = this.canvas.height;
		
		const ctx = this.offscreenCanvas.getContext('2d');
		ctx.fillStyle = 'yellow';
		ctx.fillRect(50, 50, 50, 50);
				
		this.input = new Input(this);
		
		this.player = new Player(160, 120);
		this.tileset = new Tileset();
		grid = this.grid = new Grid(320, 180, 16, 16);
		
		for (let x = 0; x < 320 / 16; ++x) {
			this.grid.setTile(x, 10, 1);
		}
		
		this.grid.setTile(4, 7, 1);
		this.grid.setTile(4, 8, 1);
		//this.grid.setTile(4, 9, 1);
		
		this.grid.setTile(15, 8, 1);
		this.grid.setTile(15, 9, 1);
		
		const timestep = 1000 / 60;
		
		this._lastFrame = 0;
		let deltaTime = 0;
		this.mainLoop = time => {
			this.frameRequestId = requestAnimationFrame(this.mainLoop);
			
			deltaTime += time - this._lastFrame;
			this._lastFrame = time;
			
			while (deltaTime >= timestep) {
				this.update();
				this.input.update();
				deltaTime -= timestep;
			}
			
			this.render();
		};
		
		// TODO(bret): We need a way to make sure that the assets have loaded before we start loading
		// Probably implement some sort of preloader?
		// It'd be nice to be able to have an asset manager that you pass into the Game constructor, that way we could
		// re-use it between different Game instances :)
		this.render();
		
		window.on('keydown', e => this.input.onKeyDown(e), false);
		window.on('keyup', e => this.input.onKeyUp(e), false);
		
		this.canvas.on('focus', e => { this.onFocus(true); });
		this.canvas.on('blur', e => { this.onFocus(false); });
	}
	
	onFocus(focus) {
		this.focus = focus;
		if (focus === true) {
			this._lastFrame = performance.now();
			this.frameRequestId = requestAnimationFrame(this.mainLoop);
		} else {
			this.render();
			cancelAnimationFrame(this.frameRequestId);
		}
	}
	
	update() {
		this.player.update(this.input);
	}
	
	render() {
		this.ctx.fillStyle = '#87E1A3';
		this.ctx.fillRect(0, 0, 640, 360);
		
		this.tileset.render(this.ctx);
		this.player.render(this.ctx);
		this.grid.render(this.ctx);
		
		//const url = this.offscreenCanvas.toDataURL();
		//const image = new Image();
		//image.src = url;
		
		//this.ctx.drawImage(this.offscreenCanvas, 100, 0);
		//this.ctx.drawImage(image, 0, 0);
		
		if (this.focus === false) {
			this.ctx.fillStyle = 'rgba(32, 32, 32, 0.5)';
			this.ctx.fillRect(0, 0, 640, 360);
		}
	}
}

class Input {
	constructor(engine) {
		this.engine = engine;
		
		this.keys = Array.from({ length: 128 }).map(v => 0);
	}
	
	update() {
		for (let k = 0, n = this.keys.length; k < n; ++k) {
			this.keys[k] &= ~1;
		}
	}
	
	onKeyDown(e) {
		if (this.engine.focus === false) return true;
		
		e.preventDefault();
		if (this.keyCodeCheck(e.keyCode) === false) {
			this.keys[e.keyCode] = 3;
		}
		
		return false;
	}
	
	onKeyUp(e) {
		if (this.engine.focus === false) return true;
		
		e.preventDefault();
		this.keys[e.keyCode] = 1;
		
		return false;
	}
	
	keyCodePressed(key) {
		if (Array.isArray(key))
			return key.some(k => this.keyCodePressed(k) === true);
		return (this.keys[key] === 3);
	}
	
	keyCodeCheck(key) {
		if (Array.isArray(key))
			return key.some(k => this.keyCodeCheck(k) === true);
		return ((this.keys[key] & 2) > 0);
	}
	
	keyCodeReleased(key) {
		if (Array.isArray(key))
			return key.some(k => this.keyCodeReleased(k) === true);
		return (this.keys[key] === 1);
	}
}

class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		
		this.xspeed = 0;
		this.xRemainder = 0;
		this.yspeed = 0;
		this.yRemainder = 0;
		
		this.width = 12;
		this.height = 16;
		
		this.aspeed = 0.05;	// acceleration
		this.fspeed = 0.05;	// friction
		
		this.mspeed = 2.5;	// max speed
		this.gspeed = 0.12;	// gravity
		this.jspeed = -3.8;	// initial jump velocity
		
		this.imageLoaded = false;
		this.image = new Image();
		this.image.onload = e => {
			// TODO(bret): this
			this.imageLoaded = true;
		};
		this.image.src = '/examples/img/radiohead_spritesheet.png';
		
		this.coyote = 0;
		this.coyoteLimit = 6;
		
		this.jumpInput = 0;
		this.jumpInputLimit = 8;
		
		this.timer = 0;
		this.timeout = 5;
		this.frame = 0;
	}
	
	update(input) {
		const leftKeys = [37, 65];
		const rightKeys = [39, 68];
		const jumpKeys = [32, 38, 87, 90];
		
		const keyLeftCheck = input.keyCodeCheck(leftKeys);
		const keyRightCheck = input.keyCodeCheck(rightKeys);
		const keyJumpCheck = input.keyCodeCheck(jumpKeys);
		
		const keyJumpPressed = input.keyCodePressed(jumpKeys);
		
		// See if the player is trying to move left or right
		const xdir = keyRightCheck - keyLeftCheck;
		
		if (this.coyote > 0) --this.coyote;
		if (this.jumpInput > 0) --this.jumpInput;
		
		// Either increase xspeed or apply friction
		if (xdir !== 0) {
			if (Math.sign(this.xspeed) === Math.sign(xdir))
				this.xspeed += this.aspeed * xdir;
			else
				this.xspeed += this.aspeed * xdir * 2;
		} else {
			if (Math.abs(this.xspeed) < this.fspeed)
				this.xspeed = 0;
			else
				this.xspeed -= this.fspeed * Math.sign(this.xspeed);
		}
		
		// Make sure xspeed does not exceed mspeed;
		this.xspeed = Math.clamp(this.xspeed, -this.mspeed, this.mspeed);
		
		// See if we're on the ground
		if (collide(this.x, this.y + 1, this.width, this.height, grid)) {
			// Set coyote to the limit!
			this.coyote = this.coyoteLimit;
		}
		
		if (keyJumpPressed) {
			// Set jumpInput to the limit!
			this.jumpInput = this.jumpInputLimit;
		}
		
		// Try jumping
		if ((this.coyote > 0) && (this.jumpInput > 0)) {
			this.yspeed = this.jspeed;
			this.coyote = 0;
			this.jumpInput = 0;
		}
		
		// Apply gravity
		this.yspeed += this.gspeed;
		
		// Variable jump height
		if ((this.yspeed < 0) && (!keyJumpCheck))
			this.yspeed += this.gspeed;
		
		// Actually move
		this.xRemainder += this.xspeed;
		let moveX = Math.round(this.xRemainder);
		
		if (moveX !== 0) {
			this.xRemainder -= moveX;
			const sign = Math.sign(moveX);
			for (let xx = 0, n = Math.abs(moveX); xx < n; ++xx) {
				if ((this.x + sign < 0) || (this.x + this.width + sign > 320) || (collide(this.x + sign, this.y, this.width, this.height, grid))) {
					moveX = 0;
					this.xspeed = Math.clamp(this.xspeed, -1.0, 1.0);
					this.xRemainder = 0;
				} else {
					this.x += sign;
				}
			}
		}
		
		this.yRemainder += this.yspeed;
		let moveY = Math.round(this.yRemainder);
		
		if (moveY !== 0) {
			this.yRemainder -= moveY;
			const sign = Math.sign(moveY);
			for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
				if ((this.y + sign < 0) || (this.y + this.height + sign > 180) || (collide(this.x, this.y + sign, this.width, this.height, grid))) {
					moveY = 0;
					this.yspeed = 0;
				} else {
					this.y += sign;
				}
			}
		}
		
		// Handle animation
		if ((xdir !== 0) || (this.xspeed !== 0)) {
			this.timer += Math.abs(this.xspeed * 0.5);
			if (this.timer >= this.timeout) {
				this.timer = 0;
				this.frame = (this.frame + 1) % 4;
			}
		} else {
			this.frame = 0;
			this.timer = this.timeout - 1;
		}
	}
	
	render(ctx) {
		const drawX = this.x;
		const drawY = this.y;
		
		const drawW = this.image.width / 4;
		const drawH = this.image.height;
		
		if (this.imageLoaded === true) {
			ctx.drawImage(this.image, this.frame * 32, 0, 32, 32, drawX - 10, drawY - 11, drawW, drawH);
		}
		
		ctx.strokeStyle = 'red';
		ctx.strokeRect(drawX + 0.5, drawY + 0.5, this.width - 1, this.height - 1);
	}
}

let collide = (x, y, w, h, grid) => {
	x = Math.round(x);
	y = Math.round(y);
	
	const minX = Math.clamp(Math.floor(x / grid.tileW), 0, grid.columns - 1);
	const minY = Math.clamp(Math.floor(y / grid.tileH), 0, grid.rows - 1);
	
	const maxX = Math.clamp(Math.floor((x + w - 1) / grid.tileW), 0, grid.columns - 1);
	const maxY = Math.clamp(Math.floor((y + h - 1) / grid.tileH), 0, grid.rows - 1);
	
	for (let yy = minY; yy <= maxY; ++yy) {
		for (let xx = minX; xx <= maxX; ++xx) {
			if (grid.data[yy * grid.columns + xx] === 1) {
				return true;
			}
		}
	}
	
	return false;
};

class Grid {
	constructor(width, height, tileW, tileH) {
		this.tileW = tileW;
		this.tileH = tileH;
		this.width = width;
		this.height = height;
		this.columns = width / tileW;
		this.rows = height / tileH;
		
		this.data = Array.from({ length: this.columns * this.rows }).map(v => 0);
	}
	
	setTile(x, y, value) {
		this.data[y * this.columns + x] = value;
	}
	
	getTile(x, y) {
		return this.data[y * this.columns + x];
	}
	
	render(ctx) {
		const stride = this.columns;
		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					ctx.strokeStyle = 'red';
					ctx.lineWidth = 1;
					ctx.strokeRect(x * this.tileW + 0.5, y * this.tileH + 0.5, this.tileW - 1, this.tileH - 1);
				}
			}
		}
	}
}

class Tileset {
	constructor() {
		this.imageLoaded = false;
		this.image = new Image();
		this.image.onload = e => {
			this.imageLoaded = true;
		};
		this.image.src = '/examples/img/tileset.png';
		
		this.tileW = 16;
		this.tileH = 16;
		
		this.startX = 1;
		this.startY = 1;
		this.separation = 1;
	}
	
	render(ctx) {
		const scale = 1;
		
		if (this.imageLoaded === true) {
			const srcX = this.startX + (this.separation + this.tileW) * 2;
			const srcY = this.startY + (this.separation + this.tileH) * 2;
			const srcY2 = this.startY + (this.separation + this.tileH) * 6;
			for (let xx = 0; xx < 320; xx += 16) {
				ctx.drawImage(this.image, srcX, srcY, this.tileW, this.tileH, xx, 10 * this.tileH, this.tileW * scale, this.tileH * scale);
				ctx.drawImage(this.image, srcX, srcY2, this.tileW, this.tileH, xx, 11 * this.tileH, this.tileW * scale, this.tileH * scale);
			}
		}
	}
}