Math.clamp = (val, min, max) => {
	if (val < min) return min;
	if (val > max) return max;
	return val;
};

const hashTuple = pos => pos.join(',');
const compareTuple = (a, b) => hashTuple(a) === hashTuple(b);

const addPos = (a, b) => a.map((v, i) => v + b[i]);
const subPos = (a, b) => a.map((v, i) => v - b[i]);
const scalePos = (p, s) => p.map(v => v * s);
const mapByOffset = offset => pos => addPos(offset, pos);
const mapFindOffset = origin => pos => subPos(pos, origin);
const flatMapByOffsets = offsets => pos => offsets.map(offset => addPos(offset, pos));

const filterWithinBounds = (a, b) => pos => a.every((p, i) => pos[i] >= p) && b.every((p, i) => pos[i] < p);

const mapToArray = val => [val].flat();

const v2zero = [0, 0];
const v2one = [1, 1];

const createBitEnum = (prefix, ...names) => {
	names = names.flat();
	const bitEnumObj = globalThis[prefix.toUpperCase()] = [];
	names.forEach((name, i) => {
		const val = 1 << i;
		bitEnumObj.push(val);
		bitEnumObj[name.toUpperCase()] = val;
	});
};

const reduceBitFlags = (acc, val) => acc | val;

const [
	dirLU, dirNU, dirRU,
	dirLN, dirNN, dirRN,
	dirLD, dirND, dirRD
] = [
	[-1, -1], [ 0, -1], [ 1, -1],
	[-1,  0], [ 0,  0], [ 1,  0],
	[-1,  1], [ 0,  1], [ 1,  1]
];

const orthogalNorms = [dirNU, dirLN, dirRN, dirND];
const diagonalNorms = [dirLU, dirRU, dirLD, dirRD];
const cardinalNorms = [...orthogalNorms, ...diagonalNorms];

// Starts right, goes counter-clockwise
const cardinalDirStrs = ['RN', 'RU', 'NU', 'LU', 'LN', 'LD', 'ND', 'RD'];
createBitEnum('CARDINAL_DIR', cardinalDirStrs);
const mapStrToCardinalDirBitFlag = str => CARDINAL_DIR[str];

const normToBitFlagMap = new Map();
[
	[dirRN, CARDINAL_DIR.RN], // 1
	[dirRU, CARDINAL_DIR.RU], // 2
	[dirNU, CARDINAL_DIR.NU], // 4
	[dirLU, CARDINAL_DIR.LU], // 8
	[dirLN, CARDINAL_DIR.LN], // 16
	[dirLD, CARDINAL_DIR.LD], // 32
	[dirND, CARDINAL_DIR.ND], // 64
	[dirRD, CARDINAL_DIR.RD], // 128
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(hashTuple(dir), bitFlag));

const orTogetherCardinalDirs = (...dirs) => dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);

const setTile = (tileset, x, y, bitFlag) => {
	switch (bitFlag & ~orTogetherCardinalDirs('LD', 'RD', 'LU', 'RU')) {
		case orTogetherCardinalDirs('NU'): {
			tileset.setTile(x, y, 0, 7);
		} break;
		
		case orTogetherCardinalDirs('ND'): {
			tileset.setTile(x, y, 0, 6);
		} break;
		
		case orTogetherCardinalDirs('LN'): {
			tileset.setTile(x, y, 3, 4);
		} break;
		
		case orTogetherCardinalDirs('RN'): {
			tileset.setTile(x, y, 1, 4);
		} break;
		
		case orTogetherCardinalDirs('LN', 'RN'): {
			tileset.setTile(x, y, 0, 2);
		} break;
		
		case orTogetherCardinalDirs('ND', 'NU'): {
			tileset.setTile(x, y, 0, 3);
		} break;
		
		case orTogetherCardinalDirs('RN', 'NU', 'ND'): {
			tileset.setTile(x, y, 1, 6);
		} break;
		
		case orTogetherCardinalDirs('NU', 'LN', 'ND'): {
			tileset.setTile(x, y, 3, 6);
		} break;
		
		case orTogetherCardinalDirs('RN', 'NU', 'LN', 'ND'): {
			tileset.setTile(x, y, 2, 6);
		} break;
		
		case orTogetherCardinalDirs('LN', 'ND'): {
			tileset.setTile(x, y, 2, 5);
		} break;
		
		case orTogetherCardinalDirs('LN', 'NU'): {
			tileset.setTile(x, y, 3, 7);
		} break;
		
		case orTogetherCardinalDirs('RN', 'ND'): {
			tileset.setTile(x, y, 2, 3);
		} break;
		
		case orTogetherCardinalDirs('LN', 'RN', 'ND'): {
			tileset.setTile(x, y, 2, 2);
		} break;
		
		case orTogetherCardinalDirs('LN', 'ND'): {
			tileset.setTile(x, y, 2, 5);
		} break;
		
		case orTogetherCardinalDirs('RN', 'NU'): {
			tileset.setTile(x, y, 1, 7);
		} break;
		
		case orTogetherCardinalDirs('RN', 'NU', 'LN'): {
			tileset.setTile(x, y, 2, 7);
		} break;
		
		case orTogetherCardinalDirs('NU', 'LN'): {
			tileset.setTile(x, y, 3, 7);
		} break;
	}
};

class AssetManager {
	constructor() {
		this.images = new Map();
		this.imagesLoaded = 0;
		this.onLoadCallbacks = [];
	}
	
	addImage(src) {
		this.images.set(src, null);
	}
	
	loadImage(src) {
		const image = new Image();
		image.onload = e => {
			this.imageLoaded(src);
			this.images.set(src, image);
		};
		image.src = src;
	}
	
	loadAssets() {
		[...this.images.keys()].forEach(src => {
			this.loadImage(src);
		});
	}
	
	imageLoaded(src) {
		if (++this.imagesLoaded === this.images.size) {
			this.onLoadCallbacks.forEach(callback => callback());
		}
	}
	
	onLoad(callback) {
		this.onLoadCallbacks.push(callback);
	}
}

const initGrid = () => {
	const grid = new Grid(320, 180, 16, 16);
		
	for (let y = 1; y < grid.rows; ++y) {
		grid.setTile(0, y, 1);
		grid.setTile(grid.columns - 1, y, 1);
	}
	
	grid.setTile(1, 4, 1);
	grid.setTile(1, 5, 1);
	
	for (let x = 0; x < grid.columns; ++x) {
		grid.setTile(x, 10, 1);
		grid.setTile(x, 11, 1);
	}
	
	for (let x = 8; x <= 11; ++x) {
		grid.setTile(x, 9, 1);
	}
	
	for (let x = 4; x <= 5; ++x) {
		grid.setTile(x, 7, 1);
		grid.setTile(x, 8, 1);
		//grid.setTile(x, 9, 1);
	}
	
	for (let y = 6; y <= 9; ++y) {
		for (let x = 17; x <= 18; ++x) {
			grid.setTile(x, y, 1);
		}
	}
	
	grid.setTile(15, 8, 1);
	grid.setTile(15, 9, 1);
	
	for (let y = 3, yn = y + 2; y < yn; ++y) {
		for (let x = 9, n = x + 4; x < n; ++x) {
			grid.setTile(x, y, 1);
		}
	}
	grid.setTile(9, 5, 1);
	grid.setTile(12, 5, 1);
	
	return grid;
};

const initGrid2 = () => {
	const grid = initGrid();
	
	Array.from({ length: 4 }, (_, i) => grid.setTile(9 + i, 6, 1));
	
	grid.setTile(8, 5, 1);
	grid.setTile(8 + 5, 5, 1);
	
	return grid;
};

const initTileset = grid => {
	const tileset = new Tileset(grid.width, grid.height, 16, 16);
	
	const setCloud1 = (x, y) => tileset.setTile(x, y, 4, 3);
	const setCloud2 = (x, y) => [0, 1].forEach(v => tileset.setTile(x + v, y, 5 + v, 3));
	const setCloud3 = (x, y) => [0, 1, 2].forEach(v => tileset.setTile(x + v, y, 4 + v, 4));
	
	setCloud1(7, 1);
	setCloud1(14, 2);
	
	setCloud2(4, 3);
	setCloud2(9, 7);
	setCloud2(0, 8);
	
	setCloud3(5, 5);
	setCloud3(15, 6);
	setCloud3(-1, 2);
	
	const filterWithinGridBounds = filterWithinBounds([0, 0], [grid.columns, grid.rows]);
	for (let y = 0; y < grid.rows; ++y) {
		for (let x = 0; x < grid.columns; ++x) {
			const pos = [x, y];
			
			if (grid.getTile(...pos) === 0) continue;
			
			const val =
				cardinalNorms
					.map(mapByOffset(pos))
					.filter(filterWithinGridBounds)
					.filter(pos => grid.getTile(...pos))
					.map(mapFindOffset(pos))
					.map(offset => normToBitFlagMap.get(hashTuple(offset)))
					.reduce(reduceBitFlags, 0);
			
			setTile(tileset, x, y, val);
		}
	}
	
	return tileset;
};

class Game {
	constructor(id) {
		this.focus = false;
		
		this.canvas = document.getElementById(id);
		this.ctx = this.canvas.getContext('2d', {
			alpha: false
		});
		
		this.ctx.imageSmoothingEnabled = false;
		
		this.sceneStack = [];
		
		// TODO(bret): We should probably change this to some sort of loading state (maybe in CSS?)
		this.render();
		
		this.input = new Input(this);
		
		const sceneWidth = this.canvas.width / 2;
		
		const sceneLeft = new PlayerScene(Player);
		sceneLeft.setCanvasSize(sceneWidth, this.canvas.height);
		
		const sceneRight = new PlayerScene(Player);
		sceneRight.screenPos[0] = sceneWidth;
		sceneRight.setCanvasSize(sceneWidth, this.canvas.height);
		
		this.sceneStack.push([sceneLeft, sceneRight]);
		
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
		
		window.addEventListener('keydown', e => this.input.onKeyDown(e), false);
		window.addEventListener('keyup', e => this.input.onKeyUp(e), false);
		// TODO(bret): We should have an event sent out to the game to let it know that the window just regained focus :)
		// Maybe add something like that for when the canvas regains focus, too?
		window.addEventListener('blur', e => this.onFocus(false));
		
		this.canvas.addEventListener('focus', e => this.onFocus(true));
		this.canvas.addEventListener('blur', e => this.onFocus(false));
	}
	
	// TODO(bret): Also perhaps do this on page/browser focus lost?
	onFocus(focus) {
		this.focus = focus;
		if (focus === true) {
			this._lastFrame = performance.now();
			this.frameRequestId = requestAnimationFrame(this.mainLoop);
		} else {
			this.render();
			cancelAnimationFrame(this.frameRequestId);
			this.input.clear();
		}
	}
	
	update() {
		// this.sceneStack[0]?.[0].update(this.input);
		this.sceneStack[0]?.forEach(scene => scene.update(this.input));
	}
	
	render() {
		this.ctx.fillStyle = '#87E1A3';
		this.ctx.fillRect(0, 0, 640, 360);
		
		this.sceneStack[0]?.forEach(scene => scene.render(this.ctx));
		
		if (this.focus === false) {
			this.ctx.fillStyle = 'rgba(32, 32, 32, 0.5)';
			this.ctx.fillRect(0, 0, 640, 360);
		}
	}
}

class Input {
	constructor(engine) {
		this.engine = engine;
		
		this.keys = Array.from({ length: 128 }, v => 0);
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
	
	clear() {
		this.keys = this.keys.map(v => 0);
	}
}

class Camera extends Array {
	constructor(x, y) {
		super();
		this.push(x, y);
	}
	
	get x() { return this[0]; }
	get y() { return this[1]; }
	
	set x(val) { this[0] = val; }
	set y(val) { this[1] = val; }
}

const updateCamera = (scene, player) => {
	const newX = player.x + (player.width / 2) - scene.canvas.width / 2;
	scene.camera.x = Math.clamp(newX, 0, scene.canvas.width);
};

class Scene {
	constructor() {
		this.entities = [];
		this.renderables = [];
		
		this.screenPos = [0, 0];
		this.camera = new Camera(0, 0);
	}
	
	setCanvasSize(width, height) {
		const canvas = this.canvas = document.createElement('canvas');
		const ctx = this.ctx = canvas.getContext('2d');
		canvas.width = width;
		canvas.height = height;
	}
	
	addEntity(entity) {
		entity.scene = this;
		this.entities.push(entity);
		return entity;
	}
	
	update(input) {
		this.entities.forEach(entity => entity.update(input));
		this.renderables = this.renderables;//.filter(e => e).sort();
	}
	
	render(ctx) {
		this.ctx.fillStyle = '#87E1A3';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		
		this.renderables.forEach(entity => entity.render(this.ctx, this.camera));
		
		const width = 1;
		const posOffset = (width / 2);
		const widthOffset = width;
		this.ctx.strokeStyle = '#787878';
		this.ctx.lineWidth = width;
		this.ctx.strokeRect(posOffset, posOffset, this.canvas.width - widthOffset, this.canvas.height - widthOffset);
		
		ctx.drawImage(this.canvas, ...this.screenPos);
	}
}

class PlayerScene extends Scene {
	constructor(Player) {
		super();
		
		// this.player = this.addEntity(new Player(160, 120));
		this.player = this.addEntity(new Player(160 + 100, 120));
		
		this.grid = initGrid2();
		this.tileset = initTileset(this.grid);
		this.gridOutline = new GridOutline();
		this.gridOutline.computeOutline(this.grid);
		
		this.renderables.push(this.tileset);
		// this.renderables.push(this.grid);
		this.renderables.push(this.gridOutline);
		this.renderables.push(this.player);
	}
	
	setCanvasSize(width, height) {
		super.setCanvasSize(width, height);
		
		updateCamera(this, this.player);
	}
	
	update(input) {
		super.update(input);
		
		updateCamera(this, this.player);
	}
}

class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		
		this.facing = 1;
		
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
		this.jspeed = -3.95;	// initial jump velocity
		
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
		
		this.scene = null;
	}
	
	update(input) {
		const leftKeys = [37, 65];
		const rightKeys = [39, 68];
		const jumpKeys = [32, 38, 87, 90];
		
		const keyLeftCheck = input.keyCodeCheck(leftKeys);
		const keyRightCheck = input.keyCodeCheck(rightKeys);
		const keyJumpCheck = input.keyCodeCheck(jumpKeys);
		
		const keyJumpPressed = input.keyCodePressed(jumpKeys);
		
		const grounded = this.collide(this.x, this.y + 1);
		
		// See if the player is trying to move left or right
		const xdir = keyRightCheck - keyLeftCheck;
		this.facing = xdir || this.facing;
		
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
		if (grounded === true) {
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
		this.moveX();
		this.moveY();
		
		// Handle animation
		this.updateSprite(xdir);
	}
	
	moveX() {
		const grounded = this.collide(this.x, this.y + 1);
		const ledgeBoostHeights = Array.from({ length: 2 }, (_, i) => i + 1);
		
		this.xRemainder += this.xspeed;
		
		let moveX = Math.round(this.xRemainder);
		
		if (moveX !== 0) {
			this.xRemainder -= moveX;
			
			const sign = Math.sign(moveX);
			for (let xx = 0, n = Math.abs(moveX); xx < n; ++xx) {
				if (this.collide(this.x + sign, this.y)) {
					const yy = (grounded === false) && (this.yspeed >= 0) && ledgeBoostHeights.find(y => !this.collide(this.x + sign, this.y - y)) || 0;
					
					if (yy === 0) {
						moveX = 0;
						this.xspeed = Math.min(Math.abs(this.xspeed), 1.0) * sign;
						this.xRemainder = 0;
						break;
					}
					
					this.y -= yy;
				}
				
				this.x += sign;
			}
		}
	}
	
	moveY() {
		this.yRemainder += this.yspeed;
		let moveY = Math.round(this.yRemainder);
		
		if (moveY !== 0) {
			this.yRemainder -= moveY;
			
			const sign = Math.sign(moveY);
			for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
				if (this.collide(this.x, this.y + sign)) {
					moveY = 0;
					this.yspeed = 0;
				} else {
					this.y += sign;
				}
			}
		}
	}
	
	collide(x, y) {
		const {
			width: w,
			height: h
		} = this;
		
		const { grid } = this.scene;
		
		x = Math.round(x);
		y = Math.round(y);
		
		const minX = Math.clamp(Math.floor(x / grid.tileW), 0, grid.columns - 1);
		const minY = Math.clamp(Math.floor(y / grid.tileH), 0, grid.rows - 1);
		
		const maxX = Math.clamp(Math.floor((x + w - 1) / grid.tileW), 0, grid.columns - 1);
		const maxY = Math.clamp(Math.floor((y + h - 1) / grid.tileH), 0, grid.rows - 1);
		
		// TODO(bret): Should this exist as part of the Scene, or part of the grid?
		if ((true) && ((x < 0) || (x + w > 320)))
			return true;
		
		// if ((true) && ((y < 0) || (y + h > 180)))
		// 	return true;
		
		for (let yy = minY; yy <= maxY; ++yy) {
			for (let xx = minX; xx <= maxX; ++xx) {
				if (grid.data[yy * grid.columns + xx] === 1) {
					return true;
				}
			}
		}
		
		return false;
	}

	updateSprite(xdir) {
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
	
	render(ctx, camera = v2zero) {
		const flipped = this.facing === -1;
		const scaleX = flipped ? -1 : 1;
		
		const [cameraX, cameraY] = camera;
		
		const drawX = this.x - cameraX;
		const drawY = this.y - cameraY;
		
		const drawW = this.image.width / 4;
		const drawH = this.image.height;
		
		const offsetX = -10;
		
		if (this.imageLoaded === true) {
			if (flipped) {
				ctx.save();
				ctx.scale(-1, 1);
			}
			ctx.drawImage(this.image, this.frame * 32, 0, 32, 32, scaleX * (drawX + offsetX), drawY - 11, scaleX * drawW, drawH);
			if (flipped)
				ctx.restore();
		}
		
		const drawHitbox = false;
		if (drawHitbox === true) {
			ctx.strokeStyle = 'red';
			ctx.strokeRect(drawX + 0.5, drawY + 0.5, this.width - 1, this.height - 1);
		}
	}
}

// TODO(bret): Rounded rectangle https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas

const drawLine = (ctx, x1, y1, x2, y2) => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
};

// TODO(bret): Read into this: https://en.wikipedia.org/wiki/Boolean_operations_on_polygons
class Grid {
	constructor(width, height, tileW, tileH) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);
		
		this.color = 'rgba(255, 0, 0, 0.6)';
		this.renderMode = 2;
		this.data = Array.from({ length: this.columns * this.rows }, v => 0);
	}
	
	inBounds(x, y) {
		return ((x >= 0) && (y >= 0) && (x < this.columns) && (y < this.rows));
	}
	
	setTile(x, y, value) {
		if (this.inBounds(x, y) === false) return;
		this.data[y * this.columns + x] = value;
	}
	
	getTile(x, y) {
		if (this.inBounds(x, y) === false) return 0;
		return this.data[y * this.columns + x];
	}
	
	renderOutline(ctx, camera) {
		const stride = this.columns;
		const width = this.tileW;
		const height = this.tileH;
		
		const [cameraX, cameraY] = camera;
		
		ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;
		
		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					const x1 = x * this.tileW + 0.5 - cameraX;
					const y1 = y * this.tileH + 0.5 - cameraY;
					const x2 = x1 + width - cameraX;
					const y2 = y1 + height - cameraY;
					if (!this.getTile(x - 1, y)) {
						drawLine(ctx, x1, y1, x1, y2);
					}
					if (!this.getTile(x + 1, y)) {
						drawLine(ctx, x2, y1, x2, y2);
					}
					if (!this.getTile(x, y - 1)) {
						drawLine(ctx, x1, y1, x2, y1);
					}
					if (!this.getTile(x, y + 1)) {
						drawLine(ctx, x1, y2, x2, y2);
					}
				}
			}
		}
	}
	
	renderEachCell(ctx, camera, fill = false) {
		const stride = this.columns;
		const width = this.tileW - +(!fill);
		const height = this.tileH - +(!fill);
		
		const [cameraX, cameraY] = camera;
		
		if (fill === true)
			ctx.fillStyle = this.color;
		else
			ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;
		
		const drawRect = (...args) => (fill === true) ? ctx.fillRect(...args) : ctx.strokeRect(...args);
		
		const offset = (fill === true) ? 0 : 0.5;
		
		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.data[y * stride + x] === 1) {
					drawRect(x * this.tileW + offset - cameraX, y * this.tileH + offset - cameraY, width, height);
				}
			}
		}
	}
	
	render(ctx, camera = v2zero) {
		switch (this.renderMode) {
			case 0: {
				this.renderOutline(ctx, camera);
			} break;
			
			case 1: {
				this.renderEachCell(ctx, camera);
			} break;
			
			case 2: {
				const temp = this.color;
				this.color = 'rgba(255, 0, 0, 0.3)';
				this.renderEachCell(ctx, camera, true);
				this.color = temp;
				this.renderEachCell(ctx, camera, false);
			} break;
		}
	}
}

class GridOutline {
	constructor() {
		this.data = [];
		this.grid = null;
	}
	
	computeOutline(grid) {
		const {
			columns,
			rows
		} = grid;
		
		this.grid = grid;
		
		this.data = Array.from({ length: columns * rows }, v => 0);
		
		const boundaryCells = [];
		
		// Find first solid
		let first = null;
		const [startX, startY] = [9, 3];
		// const [startX, startY] = [0, 0];
		for (let y = startY; y < rows; ++y) {
			for (let x = startX; x < columns; ++x) {
				const tile = grid.getTile(x, y);
				if (tile === 1) {
					first = [x, y];
					break;
				}
			}
			if (first !== null)
				break;
		}
		
		if (first === null) return;
		
		let curDir = dirND;
		let lastDir = curDir;
		const rotate = dir => {
			if (dir === -1) {
				switch (curDir) {
					case dirND: curDir = dirRN; break;
					case dirRN: curDir = dirNU; break;
					case dirNU: curDir = dirLN; break;
					case dirLN: curDir = dirND; break;
				}
			} else if (dir === 1) {
				switch (curDir) {
					case dirND: curDir = dirLN; break;
					case dirRN: curDir = dirND; break;
					case dirNU: curDir = dirRN; break;
					case dirLN: curDir = dirNU; break;
				}
			}
		};
		
		const offsets = {
			[dirNU]: [dirRU, dirNU, dirLU],
			[dirND]: [dirLD, dirND, dirRD],
			[dirRN]: [dirRD, dirRN, dirRU],
			[dirLN]: [dirLU, dirLN, dirLD]
		};
		
		const points = this.points = [];
		
		const addPoint = (pos) => {
			const size = 16;
			const m1 = size - 1;
			const basePos = scalePos(pos, size);
			
			const [lastX, lastY] = points.length ? subPos(points[points.length - 1], basePos) : [0, 0];
			
			const offset = [0, 0];
			switch (curDir) {
				case dirND: {
					offset[0] = 0;
					offset[1] = lastY;
				} break;
				
				case dirNU: {
					offset[0] = m1;
					offset[1] = lastY;
				} break;
				
				case dirRN: {
					offset[0] = lastX;
					offset[1] = m1;
				} break;
				
				case dirLN: {
					offset[0] = lastX;
					offset[1] = 0;
				} break;
			}
			
			points.push(addPos(basePos, offset));
		};
		
		addPoint(first);
		
		let hitFirst = 0;
		let rotates = 0;
		let next = first;
		boundaryCells.push(first);
		let iterations = 0;
		let nextPoint = [...first];
		do {
			if (++iterations > 100) break;
			
			const [x, y] = next;
			const tile = grid.getTile(x, y);
			
			const [p1, p2, p3] = offsets[curDir].map(o => addPos(next, o)).map(p => grid.getTile(...p));
			
			if (p2 === 1) {
				rotates = 0;
				if (p1 === 1) {
					next = addPos(next, curDir);
					
					rotate(1);
					next = addPos(next, curDir);
				} else /*if (p3 === 1) {
					rotate(1);
					next = addPos(next, curDir);
					rotate(-1);
					next = addPos(next, curDir);
				} else*/ {
					next = addPos(next, curDir);
				}
				if (lastDir !== curDir)
					addPoint(next);
				boundaryCells.push(next);
			} else {
				rotate(-1);
				addPoint(next);
				if (++rotates === 4) {
					console.log('how did we escape here?');
					break;
				}
			}
			
			lastDir = curDir;
			
			if (next.join(',') === first.join(','))
				++hitFirst;
		} while (hitFirst < 2);
		
		this.first = this.points.shift();
		
		boundaryCells.forEach(([x, y]) => this.data[y * columns + x] = 1);
	}
	
	render(ctx, camera = v2zero) {
		const fill = true;
		const grid = this.grid;
		
		const stride = grid.columns;
		const width = grid.tileW - +(!fill);
		const height = grid.tileH - +(!fill);
		
		const [cameraX, cameraY] = camera;
		
		const color = 'rgba(0, 255, 0, 0.9)';
		if (fill === true)
			ctx.fillStyle = color;
		else
			ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		
		const drawRect = (...args) => (fill === true) ? ctx.fillRect(...args) : ctx.strokeRect(...args);
		
		const offset = (fill === true) ? 0 : 0.5;
		
		if (false) {
			for (let y = 0; y < grid.rows; ++y) {
				for (let x = 0; x < grid.columns; ++x) {
					if (this.data[y * stride + x] === 1) {
						drawRect(x * grid.tileW + offset - cameraX, y * grid.tileH + offset - cameraY, width, height);
					}
				}
			}
		}
		
		const pColor = 'red';
		
		if (false) {
			this.points.map(p => subPos(p, camera)).forEach(([x, y]) => {
				ctx.fillStyle = pColor;
				ctx.beginPath();
				ctx.arc(x + 0.5, y + 0.5, 2, 0, 2 * Math.PI);
				ctx.fill();
			});
		}
		
		if (true) {
			ctx.beginPath();
			ctx.strokeStyle = pColor;
			ctx.moveTo(...subPos(addPos(this.first, [0.5, 0.5]), camera));
			this.points.map(p => subPos(p, camera)).forEach(([x, y]) => {
				ctx.lineTo(x + 0.5, y + 0.5);
			});
			ctx.closePath();
			ctx.stroke();
		}
	}
}

class Tileset {
	constructor(width, height, tileW, tileH) {
		this.width = width;
		this.height = height;
		this.tileW = tileW;
		this.tileH = tileH;
		this.columns = Math.ceil(width / tileW);
		this.rows = Math.ceil(height / tileH);
		
		this.data = Array.from({ length: this.columns * this.rows }, v => null);
		
		this.imageLoaded = false;
		this.image = new Image();
		this.image.onload = e => {
			this.imageLoaded = true;
		};
		this.image.src = '/examples/img/tileset.png';

		this.startX = 1;
		this.startY = 1;
		this.separation = 1;
	}
	
	setTile(x, y, tileX, tileY) {
		// TODO(bret): Make sure it's within the bounds
		this.data[y * this.columns + x] = [tileX, tileY];
	}
	
	render(ctx, camera = v2zero) {
		const scale = 1;
		
		const {
			image,
			separation,
			startX, startY,
			tileW, tileH
		} = this;
		
		const srcCols = Math.floor(this.image.width / tileW);
		const srcRows = Math.floor(this.image.height / tileH);
		
		const [cameraX, cameraY] = camera;
		
		if (this.imageLoaded === true) {
			for (let y = 0; y < this.rows; ++y) {
				for (let x = 0; x < this.columns; ++x) {
					const val = this.data[y * this.columns + x];
					if (val !== null) {
						const [tileX, tileY] = val;
						const srcX = startX + (separation + tileW) * tileX;
						const srcY = startY + (separation + tileH) * tileY;
						const dstX = x * tileW - cameraX;
						const dstY = y * tileH - cameraY;
						ctx.drawImage(image, srcX, srcY, tileW, tileH, dstX, dstY, tileW * scale, tileH * scale);
					}
				}
			}
		}
	}
}

const initGames = () => {
	const game1 = new Game('basic');
	// const game2 = new Game('second');
	
	const assetManager = new AssetManager();
	assetManager.addImage('/examples/img/radiohead_spritesheet.png');
	assetManager.addImage('/examples/img/tileset.png');
	assetManager.onLoad(() => {
		console.log('we loaded all images!!');
		requestAnimationFrame(() => {
			game1?.render();
			// game2?.render();
		});
	});
	assetManager.loadAssets();
};
