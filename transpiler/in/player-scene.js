import { cardinalNorms, Entity, filterWithinBounds, globalSetTile, Grid, GridOutline, mapByOffset, mapFindOffset, normToBitFlagMap, reduceBitFlags, Scene, Tileset, } from 'canvas-lord';
export class PlayerClass extends Entity {
}
export class PlayerScene extends Scene {
    player;
    grid;
    tileset;
    gridOutline;
    bounds;
    constructor(Player, engine, assetManager) {
        super(engine);
        this.player = this.addEntity(new Player(40, 144));
        this.grid = Grid.fromBitmap(assetManager, 'grid.bmp', 16, 16);
        const padding = this.grid.height;
        this.bounds = [
            0,
            -padding,
            this.grid.width,
            this.grid.height + padding,
        ];
        this.tileset = this.initTileset(this.grid, assetManager);
        this.gridOutline = new GridOutline();
        this.gridOutline.computeOutline(this.grid);
        this.addRenderable(this.tileset);
        this.addRenderable(this.gridOutline);
        this.addRenderable(this.player);
    }
    initTileset(grid, assetManager) {
        const img = assetManager.images.get('tileset.png');
        if (!img)
            throw new Error();
        const tileset = new Tileset(img, grid.width, grid.height, 16, 16);
        const setCloud1 = (x, y) => tileset.setTile(x, y, 4, 3);
        const setCloud2 = (x, y) => [0, 1].forEach((v) => tileset.setTile(x + v, y, 5 + v, 3));
        const setCloud3 = (x, y) => [0, 1, 2].forEach((v) => tileset.setTile(x + v, y, 4 + v, 4));
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
                if (grid.getTile(...pos) === 0)
                    continue;
                const val = cardinalNorms
                    .map(mapByOffset(pos))
                    .filter(filterWithinGridBounds)
                    .filter((pos) => grid.getTile(...pos))
                    .map(mapFindOffset(pos))
                    .map((norm) => normToBitFlagMap.get(norm))
                    .reduce(reduceBitFlags, 0);
                globalSetTile(tileset, x, y, val);
            }
        }
        return tileset;
    }
    updateCamera() {
        const newX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
        this.camera.x = Math.clamp(newX, 0, this.bounds[2] - this.canvas.width);
    }
    setCanvasSize(width, height) {
        super.setCanvasSize(width, height);
        this.updateCamera();
    }
    update(input) {
        super.update(input);
        this.updateCamera();
    }
}
//# sourceMappingURL=player-scene.js.map