/* Canvas Lord v0.6.1 */
import { Delegate } from "./delegate.js";
import { EaseType, PropertyTweener, SubtweenTweener, TransType, } from "./tweener.js";
export { EaseType, TransType } from "./tweener.js";
export class Tween {
    #lastStep = -1;
    #step = 0;
    #ease = EaseType.EaseInOut;
    #trans = TransType.Linear;
    parent;
    queue = [];
    onFinish = new Delegate();
    #paused = false;
    #nextParallel = false;
    #allParallel = false;
    get step() {
        return this.#step;
    }
    get current() {
        return this.step < this.queue.length ? this.queue[this.step] : null;
    }
    get finished() {
        return this.#step >= this.queue.length;
    }
    get ease() {
        return this.#ease;
    }
    get trans() {
        return this.#trans;
    }
    get playing() {
        return !this.#paused;
    }
    get paused() {
        return this.#paused;
    }
    setParallel(parallel) {
        this.#allParallel = parallel;
        return this.parallel();
    }
    parallel() {
        this.#nextParallel = true;
        return this;
    }
    #addTweener(tweener) {
        if (this.#nextParallel) {
            if (this.queue.length === 0)
                this.queue.push([]);
            this.queue.at(-1)?.push(tweener);
            this.#nextParallel = this.#allParallel;
            return tweener;
        }
        this.queue.push([tweener]);
        return tweener;
    }
    tweenProperty(obj, prop, target, duration) {
        return this.#addTweener(new PropertyTweener(obj, prop, target, duration).setParent(this));
    }
    tweenSubtween(tween) {
        return this.#addTweener(new SubtweenTweener(tween));
    }
    setEase(ease) {
        this.#ease = ease;
        return this;
    }
    setTrans(trans) {
        this.#trans = trans;
        return this;
    }
    update() {
        if (this.#paused)
            return;
        if (this.current?.every((t) => t.finished)) {
            ++this.#step;
        }
        if (this.current === null) {
            this.#finish();
            return;
        }
        if (this.#lastStep !== this.step) {
            this.current.forEach((t) => t.start());
            this.#lastStep = this.step;
        }
        this.current.forEach((t) => t.update());
        if (this.current.every((t) => t.finished)) {
            if (this.#step + 1 === this.queue.length) {
                this.#finish();
            }
        }
    }
    #finish() {
        this.parent?.removeTween(this);
        this.onFinish.invoke();
    }
    pause() {
        this.#paused = true;
    }
    play() {
        this.#paused = false;
    }
}
//# sourceMappingURL=tween.js.map