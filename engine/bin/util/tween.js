import { CL } from "../canvas-lord.js";
import { Vec2 } from "../math/index.js";
import { Ease, easeInOut, easeOut, easeOutIn } from "./ease.js";
export var EaseType;
(function (EaseType) {
    EaseType[EaseType["EaseIn"] = 0] = "EaseIn";
    EaseType[EaseType["EaseInOut"] = 1] = "EaseInOut";
    EaseType[EaseType["EaseOut"] = 2] = "EaseOut";
    EaseType[EaseType["EaseOutIn"] = 3] = "EaseOutIn";
})(EaseType || (EaseType = {}));
export var TransType;
(function (TransType) {
    TransType[TransType["Linear"] = 0] = "Linear";
    TransType[TransType["Sine"] = 1] = "Sine";
    TransType[TransType["Quint"] = 2] = "Quint";
    TransType[TransType["Quart"] = 3] = "Quart";
    TransType[TransType["Quad"] = 4] = "Quad";
    TransType[TransType["Expo"] = 5] = "Expo";
    TransType[TransType["Elastic"] = 6] = "Elastic";
    TransType[TransType["Cubic"] = 7] = "Cubic";
    TransType[TransType["Circ"] = 8] = "Circ";
    TransType[TransType["Bounce"] = 9] = "Bounce";
    TransType[TransType["Back"] = 10] = "Back";
    TransType[TransType["Spring"] = 11] = "Spring";
})(TransType || (TransType = {}));
class Tweener {
    #delay;
    #elapsed = 0;
    #duration;
    #ease;
    #trans;
    #parent;
    get elapsed() {
        return Math.clamp(this.#elapsed / (this.#duration - 1), 0, 1);
    }
    // TODO(bret): Do smth different for this
    get finished() {
        return this.#elapsed >= this.#duration - 1;
    }
    get delay() {
        return this.#delay;
    }
    constructor(duration) {
        this.#delay = 0;
        this.#duration = duration * CL.engine.fps;
    }
    getT() {
        let func;
        switch (this.#trans ?? this.#parent.trans) {
            case TransType.Linear:
                return this.elapsed;
            case TransType.Sine:
                func = Ease.sine;
                break;
            case TransType.Quint:
                func = Ease.quint;
                break;
            case TransType.Quart:
                func = Ease.quart;
                break;
            case TransType.Quad:
                func = Ease.quad;
                break;
            case TransType.Expo:
                func = Ease.expo;
                break;
            // case TransType.Elastic:
            // 	func = Ease.elastic;
            // 	break;
            case TransType.Cubic:
                func = Ease.cube;
                break;
            case TransType.Circ:
                func = Ease.circ;
                break;
            case TransType.Bounce:
                func = Ease.bounce;
                break;
            case TransType.Back:
                func = Ease.back;
                break;
            // case TransType.Spring:
            // 	func = Ease.spring;
            // 	break;
            default:
                throw new Error('Uh oh');
        }
        switch (this.#ease ?? this.#parent.ease) {
            case EaseType.EaseIn:
                break;
            case EaseType.EaseInOut:
                func = easeInOut(func);
                break;
            case EaseType.EaseOut:
                func = easeOut(func);
                break;
            case EaseType.EaseOutIn:
                func = easeOutIn(func);
                break;
        }
        return func(this.elapsed);
    }
    start() {
        this.#elapsed = -this.#delay;
    }
    update() {
        this.#elapsed++;
    }
    setParent(parent) {
        this.#parent = parent;
        return this;
    }
    setDelay(delay) {
        this.#delay = delay * CL.engine.fps;
        return this;
    }
    setEase(ease) {
        this.#ease = ease;
        return this;
    }
    setTrans(trans) {
        this.#trans = trans;
        return this;
    }
}
// TODO(bret): Find a better place for this to live
const lerpAngle = (a, b, t) => {
    const d = (b - a) % 360;
    const range = ((2 * d) % 360) - d;
    return range * t + a;
};
export class PropertyTweener extends Tweener {
    obj;
    prop;
    #start;
    #target;
    #from;
    #relative = false;
    #add;
    #lerp;
    constructor(obj, prop, target, duration) {
        super(duration);
        this.obj = obj;
        this.prop = prop;
        this.#start = this.obj[this.prop];
        this.#target = target;
        switch (true) {
            case typeof this.#start === 'number' &&
                typeof this.#target === 'number':
                this.#add = ((a, b) => a + b);
                this.#lerp = Math.lerp;
                break;
            case this.#start instanceof Vec2 && this.#target instanceof Vec2:
                this.#add = Vec2.add;
                this.#lerp = Vec2.lerp;
                break;
            default:
                throw new Error('no matching lerp');
        }
    }
    start() {
        super.start();
        // TODO(bret): move this to when it starts
        this.#start = this.#from ?? this.obj[this.prop];
        if (this.#relative)
            this.#target = this.#add(this.#start, this.#target);
    }
    update() {
        const t = this.getT();
        super.update();
        let newValue = this.obj[this.prop];
        switch (t) {
            case 0:
                newValue = this.#start;
                break;
            case 1:
                newValue = this.#target;
                break;
            default:
                newValue = this.#lerp(this.#start, this.#target, t);
                break;
        }
        this.obj[this.prop] = newValue;
    }
    from(value) {
        this.#from = value;
        return this;
    }
    fromCurrent() {
        this.#from = this.obj[this.prop];
        return this;
    }
    asRelative() {
        if (!this.#target)
            throw new Error('ruh roh');
        this.#relative = true;
        return this;
    }
    asAngle() {
        this.#lerp = lerpAngle;
        return this;
    }
    setLerp(lerp) {
        this.#lerp = lerp;
        return this;
    }
}
export class Tween {
    #lastStep = -1;
    #step = 0;
    #ease = EaseType.EaseInOut;
    #trans = TransType.Linear;
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
    get finished() {
        return this.#step >= this.queue.length;
    }
    get ease() {
        return this.#ease;
    }
    get trans() {
        return this.#trans;
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
    setEase(ease) {
        this.#ease = ease;
        return this;
    }
    setTrans(trans) {
        this.#trans = trans;
        return this;
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
//# sourceMappingURL=tween.js.map