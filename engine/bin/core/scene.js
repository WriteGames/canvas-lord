/* Canvas Lord v0.6.0 */
import { Entity } from './entity.js';
import { Vec2 } from '../math/index.js';
import { Camera } from '../util/camera.js';
import { Messages } from '../util/messages.js';
import { generateCanvasAndCtx } from '../util/canvas.js';
import { Delegate } from '../util/delegate.js';
export class Scene {
    #engine;
    get engine() {
        return this.#engine;
    }
    constructor(engine) {
        // TODO(bret): this is depreciated, engine now gets set in initInternal()
        if (engine)
            this.#engine = engine;
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
        this.onPreUpdate = new Delegate();
        this.onUpdate = new Delegate();
        this.onPostUpdate = new Delegate();
        this.onRender = new Delegate();
        this.onInit = new Delegate();
        this.onBegin = new Delegate();
        this.onEnd = new Delegate();
        this.onResume = new Delegate();
        this.onPause = new Delegate();
    }
    #mouse = new Vec2(-1, -1);
    get mouse() {
        const pos = this.engine.input.mouse.pos.add(this.camera);
        this.#mouse.set(pos);
        return this.#mouse;
    }
    // TODO(bret): Gonna nwat to make sure we don't recreate the canvas/ctx on each call
    setCanvasSize(width, height) {
        if (!this.canvas) {
            const { canvas, ctx } = generateCanvasAndCtx(width, height);
            if (!ctx)
                throw new Error();
            this.canvas = canvas;
            this.ctx = ctx;
        }
    }
    initInternal(engine) {
        this.#engine = engine;
        this.onInit.invoke();
        this.init();
    }
    init() {
        //
    }
    beginInternal() {
        this.engine.onSceneBegin.invoke(this);
        this.onBegin.invoke();
        this.begin();
    }
    begin() {
        //
    }
    endInternal() {
        this.engine.onSceneEnd.invoke(this);
        this.onEnd.invoke();
        this.end();
    }
    end() {
        //
    }
    pauseInternal() {
        this.onPause.invoke();
        this.pause();
    }
    pause() {
        //
    }
    resumeInternal() {
        this.onResume.invoke();
        this.resume();
    }
    resume() {
        //
    }
    addGraphic(graphic, x = 0, y = 0) {
        const entity = new Entity(x, y);
        entity.graphic = graphic;
        this.addEntity(entity);
        return entity;
    }
    addEntity(entity, renderable = true) {
        entity.z__setScene(this);
        this.entities.addQueue.push(entity);
        if (renderable)
            this.addRenderable(entity);
        return entity;
    }
    addEntities(...entities) {
        const _entities = entities.flat();
        _entities.forEach((e) => this.addEntity(e));
        return _entities;
    }
    #addEntitiesToScene() {
        const newEntities = this.entities.addQueue.splice(0);
        for (let i = 0; i < newEntities.length; ++i) {
            const e = newEntities[i];
            if (this.entities.inScene.includes(e))
                continue;
            this.entities.inScene.push(e);
            e.addedInternal();
            e.onAdded.invoke();
        }
    }
    addRenderable(renderable) {
        // renderable.scene = this;
        this.renderables.addQueue.push(renderable);
        return renderable;
    }
    addRenderables(...renderables) {
        const _renderables = renderables.flat();
        _renderables.forEach((r) => this.addRenderable(r));
        return _renderables;
    }
    #addRenderablesToScene() {
        const newRenderables = this.renderables.addQueue.splice(0);
        for (let i = 0; i < newRenderables.length; ++i) {
            const r = newRenderables[i];
            if (this.renderables.inScene.includes(r))
                continue;
            this.renderables.inScene.push(r);
        }
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
            e.onRemoved.invoke();
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
    preUpdateInternal(input) {
        this.onPreUpdate.invoke(input);
        this.preUpdate(input);
        this.entities.inScene.forEach((entity) => {
            entity.preUpdateInternal(input);
        });
    }
    preUpdate(_input) {
        //
    }
    updateInternal(input) {
        // TODO: move the following two to game probably
        if (this.allowRefresh && input.keyPressed('F5'))
            location.reload();
        if (this.escapeToBlur && input.keyPressed('Escape'))
            this.engine.canvas.blur();
        if (!this.shouldUpdate)
            return;
        this.onUpdate.invoke(input);
        this.update(input);
        this.entities.inScene.forEach((entity) => {
            entity.updateInternal(input);
        });
        // this.renderables = this.renderables.filter(e => e).sort();
        this.componentSystemMap.forEach((systems, component) => {
            systems.forEach((system) => {
                const { update } = system;
                if (!update)
                    return;
                const entities = this.entities.inScene.filter((e) => Boolean(e.component(component)));
                entities.forEach((entity) => update(entity, input));
            });
        });
    }
    update(_input) {
        //
    }
    postUpdateInternal(input) {
        this.onPostUpdate.invoke(input);
        this.postUpdate(input);
        this.entities.inScene.forEach((entity) => {
            entity.postUpdateInternal(input);
        });
    }
    postUpdate(_input) {
        //
    }
    renderInternal(gameCtx) {
        const ctx = (this.ctx ?? gameCtx);
        const { canvas } = ctx;
        this.onRender.invoke(ctx);
        // TODO: this should maybe be in pre-render?
        this.renderables.inScene.sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0));
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
        // TODO(bret): Fix how render/renderInternal works for renderables
        this.renderables.inScene.forEach((entity) => entity.renderInternal(ctx, camera));
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
                const entities = this.renderables.inScene.filter((e) => Boolean(e.component(component)));
                entities.forEach((entity) => {
                    render(entity, ctx, camera);
                });
            });
        });
        this.render(ctx, camera);
        if (ctx !== gameCtx) {
            const [x, y] = this.screenPos;
            gameCtx.drawImage(ctx.canvas, x, y);
        }
    }
    render(_ctx, _camera) {
        //
    }
}
//# sourceMappingURL=scene.js.map