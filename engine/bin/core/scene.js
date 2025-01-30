import { Vec2 } from '../math/index.js';
import { Camera } from '../util/camera.js';
import { Messages } from '../util/messages.js';
export class Scene {
    constructor(engine) {
        this.engine = engine;
        this.componentSystemMap = new Map();
        this.entities = {
            addQueue: [],
            inScene: [],
            removeQueue: [],
        };
        this.renderables = {
            addQueue: [],
            inScene: [],
            removeQueue: [],
        };
        this.shouldUpdate = true;
        this.messages = new Messages();
        this.screenPos = new Vec2(0, 0);
        this.camera = new Camera(0, 0);
        // TODO(bret): Make these false by default
        this.escapeToBlur = true;
        this.allowRefresh = true;
        this.bounds = null;
    }
    // TODO(bret): Gonna nwat to make sure we don't recreate the canvas/ctx on each call
    setCanvasSize(width, height) {
        const canvas = (this.canvas = document.createElement('canvas'));
        const ctx = canvas.getContext('2d');
        if (ctx)
            this.ctx = ctx;
        canvas.width = width;
        canvas.height = height;
    }
    begin() { }
    end() { }
    pause() { }
    resume() { }
    addEntity(entity) {
        entity.scene = this;
        this.entities.addQueue.push(entity);
        return entity;
    }
    #addEntitiesToScene() {
        const newEntities = this.entities.addQueue.splice(0);
        this.entities.inScene.push(...newEntities);
    }
    addRenderable(renderable) {
        // renderable.scene = this;
        this.renderables.addQueue.push(renderable);
        return renderable;
    }
    #addRenderablesToScene() {
        const newRenderables = this.renderables.addQueue.splice(0);
        this.renderables.inScene.push(...newRenderables);
    }
    removeEntity(entity) {
        this.entities.removeQueue.push(entity);
        return entity;
    }
    #removeEntitiesFromScene() {
        const oldEntities = this.entities.removeQueue.splice(0);
        oldEntities.forEach((e) => {
            const index = this.entities.inScene.indexOf(e);
            this.entities.inScene.splice(index, 1);
        });
    }
    removeRenderable(renderable) {
        this.renderables.removeQueue.push(renderable);
        return renderable;
    }
    #removeRenderablesFromScene() {
        const oldRenderables = this.renderables.removeQueue.splice(0);
        oldRenderables.forEach((r) => {
            const index = this.renderables.inScene.indexOf(r);
            this.renderables.inScene.splice(index, 1);
        });
    }
    updateLists() {
        this.#addEntitiesToScene();
        this.#removeEntitiesFromScene();
        this.#addRenderablesToScene();
        this.#removeRenderablesFromScene();
    }
    preUpdate(input) { }
    update(input) {
        // TODO: move the following two to game probably
        if (this.allowRefresh && input.keyPressed('F5'))
            location.reload();
        if (this.escapeToBlur && input.keyPressed('Escape'))
            this.engine.canvas.blur();
        if (!this.shouldUpdate)
            return;
        this.entities.inScene.forEach((entity) => entity.update(input));
        this.entities.inScene.forEach((entity) => entity.graphic?.update?.(input));
        // this.renderables = this.renderables.filter(e => e).sort();
        this.componentSystemMap.forEach((systems, component) => {
            systems.forEach((system) => {
                const { update } = system;
                if (!update)
                    return;
                const entities = this.entities.inScene.filter((e) => Boolean(e.component?.(component)));
                entities.forEach((entity) => update(entity, input));
            });
        });
    }
    postUpdate(input) { }
    render(gameCtx) {
        // TODO: this should maybe be in pre-render?
        this.renderables.inScene.sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0));
        const ctx = this.ctx ?? gameCtx;
        const { canvas } = ctx;
        const { camera } = this;
        let { backgroundColor } = this;
        if (this.ctx) {
            // set to the engine's background color if this is a standalone canvas
            backgroundColor ??= this.engine.backgroundColor;
        }
        if (backgroundColor) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        this.renderables.inScene.forEach((entity) => entity.render(ctx, camera));
        // const width = 2;
        // const posOffset = 0.5;
        // const widthOffset = width;
        // ctx.strokeStyle = '#787878';
        // ctx.lineWidth = (width * 2 - 1);
        // ctx.strokeRect(posOffset, posOffset, canvas.width - 1, canvas.height - 1);
        this.componentSystemMap.forEach((systems, component) => {
            systems.forEach((system) => {
                const { render } = system;
                if (!render)
                    return;
                const entities = this.renderables.inScene.filter((e) => Boolean(e.component?.(component)));
                entities.forEach((entity) => {
                    render(entity, ctx, camera);
                });
            });
        });
        if (ctx !== gameCtx) {
            const [x, y] = this.screenPos;
            gameCtx.drawImage(ctx.canvas, x, y);
        }
    }
}
//# sourceMappingURL=scene.js.map