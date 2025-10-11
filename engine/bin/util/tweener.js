/* Canvas Lord v0.6.1 */
import { CL } from "../canvas-lord.js";
import { Vec2 } from "../math/index.js";
import { lerpAngle } from "../math/misc.js";
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
const _defaultAdd = (a, b) => a + b;
const _defaultLerp = Math.lerp;
const getOperations = (value) => {
    const math = {
        add: _defaultAdd,
        lerp: _defaultLerp,
    };
    switch (true) {
        case typeof value === 'number':
            // intentionally left blank
            break;
        case value instanceof Vec2:
            math.add = Vec2.add;
            math.lerp = Vec2.lerp;
            break;
        default:
            throw new Error('no matching lerp');
    }
    return math;
};
export class Tweener {
    #delay;
    #elapsed = 0;
    #duration;
    #ease;
    #trans;
    #parent;
    get elapsed() {
        return Math.clamp(this.#elapsed / (this.#duration - 1), 0, 1);
    }
    get started() {
        return this.#elapsed >= 0;
    }
    // TODO(bret): Do smth different for this
    get finished() {
        return this.#elapsed >= this.#duration;
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
            case TransType.Elastic:
                func = Ease.elastic;
                break;
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
export class PropertyTweener extends Tweener {
    obj;
    prop;
    #start;
    #target;
    #from;
    #relative = false;
    #operations;
    constructor(obj, prop, target, duration) {
        super(duration);
        this.obj = obj;
        this.prop = prop;
        this.#start = this.obj[this.prop];
        this.#target = target;
        this.#operations = getOperations(this.obj[this.prop]);
    }
    start() {
        super.start();
        this.#start = this.#from ?? this.obj[this.prop];
        if (this.#relative)
            this.#target = this.#operations.add(this.#start, this.#target);
    }
    update() {
        const t = this.getT();
        super.update();
        this.obj[this.prop] = this.#operations.lerp(this.#start, this.#target, t);
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
        this.#operations.lerp = lerpAngle;
        return this;
    }
    setLerp(lerp) {
        this.#operations.lerp = lerp;
        return this;
    }
}
export class SubtweenTweener extends Tweener {
    #tween;
    // TODO(bret): Do smth different for this
    get finished() {
        return this.#tween.finished;
    }
    constructor(tween) {
        super(0);
        this.#tween = tween;
    }
    update() {
        if (this.started)
            this.#tween.update();
        super.update();
    }
}
//# sourceMappingURL=tweener.js.map