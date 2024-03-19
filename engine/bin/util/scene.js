import { Camera } from './camera.js';
import { Messages } from './messages.js';
export class Scene {
    constructor(engine) {
        this.engine = engine;
        this.componentSystemMap = new Map();
        this.entities = [];
        this.renderables = [];
        this.shouldUpdate = true;
        this.messages = new Messages();
        this.screenPos = [0, 0];
        this.camera = new Camera(0, 0);
        // TODO(bret): Make these false by default
        this.escapeToBlur = true;
        this.allowRefresh = true;
        // this.width = this.height = null;
        this.boundsX = this.boundsY = null;
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
    addEntity(entity) {
        entity.scene = this;
        this.entities.push(entity);
        return entity;
    }
    update(input) {
        if (this.allowRefresh && input.keyPressed('F5'))
            location.reload();
        if (this.escapeToBlur && input.keyPressed('Escape'))
            this.engine.canvas.blur();
        if (!this.shouldUpdate)
            return;
        this.entities.forEach((entity) => entity.update(input));
        // this.renderables = this.renderables.filter(e => e).sort();
        // REVIEW(bret): make sure that this is a stable ordering!
        this.componentSystemMap.forEach((systems, component) => {
            systems.forEach((system) => {
                const { update } = system;
                if (!update)
                    return;
                const entities = this.entities.filter((e) => Boolean(e.component?.(component)));
                entities.forEach((entity) => update(entity, input));
            });
        });
    }
    render(gameCtx) {
        const ctx = this.ctx ?? gameCtx;
        const { canvas } = ctx;
        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        this.renderables.forEach((entity) => entity.render(ctx, this.camera));
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
                const entities = this.entities.filter((e) => Boolean(e.component?.(component)));
                entities.forEach((entity) => {
                    render(entity, ctx, this.camera);
                });
            });
        });
        if (ctx !== gameCtx) {
            gameCtx.drawImage(ctx.canvas, ...this.screenPos);
        }
    }
}
//# sourceMappingURL=scene.js.map