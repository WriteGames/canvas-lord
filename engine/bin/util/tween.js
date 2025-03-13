import { CL } from "../canvas-lord.js";
export class PropertyTweener {
    obj;
    prop;
    #start;
    #target;
    #from;
    #elapsed = 0;
    #duration;
    #relative = false;
    constructor(obj, prop, target, duration) {
        this.obj = obj;
        this.prop = prop;
        this.#start = this.obj[this.prop];
        this.#target = target;
        this.#duration = duration * CL.engine.fps;
    }
    get elapsed() {
        return Math.clamp(this.#elapsed / (this.#duration - 1), 0, 1);
    }
    // TODO(bret): Do smth different for this
    get finished() {
        return this.#elapsed >= this.#duration - 1;
    }
    start() {
        // TODO(bret): move this to when it starts
        this.#start = this.#from ?? this.obj[this.prop];
        if (this.#relative)
            // @ts-expect-error -- TODO(bret): Gonna need to update this
            this.#target += this.#start;
    }
    update() {
        const t = this.elapsed;
        this.#elapsed++;
        if (typeof this.#start !== 'number' ||
            typeof this.#target !== 'number') {
            console.log({
                prop: this.prop,
                start: typeof this.#start,
                target: typeof this.#target,
            });
            throw new Error('uh oh');
        }
        let newValue = this.obj[this.prop];
        switch (t) {
            case 0:
                newValue = this.#start;
                break;
            case 1:
                newValue = this.#target;
                break;
            default:
                newValue = Math.lerp(this.#start, this.#target, t);
                break;
        }
        this.obj[this.prop] = newValue;
    }
    from(value) {
        this.#from = value;
        return this;
    }
    asRelative() {
        if (!this.#target)
            throw new Error('ruh roh');
        this.#relative = true;
        return this;
    }
}
export class Tween {
    #lastStep = -1;
    #step = 0;
    queue = [];
    #nextParallel = false;
    #allParallel = false;
    // constructor() {
    // 	//
    // }
    get step() {
        return this.#step;
    }
    get current() {
        return this.step < this.queue.length ? this.queue[this.step] : null;
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
        return this.#addTweener(new PropertyTweener(obj, prop, target, duration));
    }
    update() {
        if (this.current?.every((t) => t.finished)) {
            ++this.#step;
        }
        if (this.current === null)
            return;
        if (this.#lastStep !== this.step) {
            this.current.forEach((t) => t.start());
            this.#lastStep = this.step;
        }
        this.current.forEach((t) => t.update());
    }
}
// const player = new Entity();
// const tween = new Tween();
// tween.tweenProperty(player, 'x', 30, 1);
//# sourceMappingURL=tween.js.map