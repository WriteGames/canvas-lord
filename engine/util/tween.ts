import type { Entity } from '../canvas-lord.ts';
import { CL } from '../canvas-lord.ts';
import { Vec2 } from '../math/index.ts';
import { Ease, easeInOut, easeOut, easeOutIn, type EaseFunc } from './ease.ts';

interface ITweener {
	readonly delay: number;
	readonly elapsed: number;
	readonly finished: boolean;
	getT(): number;
	start(): void;
	update(): void;
	setParent(tween: Tween): this;
	setDelay(delay: number): this;
	setEase(ease: EaseType): this;
	setTrans(trans: TransType): this;
}

type TweenGroup = ITweener[];

export enum EaseType {
	EaseIn = 0,
	EaseInOut = 1,
	EaseOut = 2,
	EaseOutIn = 3,
}

export enum TransType {
	Linear = 0,
	Sine = 1,
	Quint = 2,
	Quart = 3,
	Quad = 4,
	Expo = 5,
	Elastic = 6,
	Cubic = 7,
	Circ = 8,
	Bounce = 9,
	Back = 10,
	Spring = 11,
}

abstract class Tweener implements ITweener {
	#delay: number;
	#elapsed = 0;
	#duration: number;
	#ease?: EaseType;
	#trans?: TransType;
	#parent!: Tween;

	get elapsed(): number {
		return Math.clamp(this.#elapsed / (this.#duration - 1), 0, 1);
	}

	get started(): boolean {
		return this.#elapsed >= 0;
	}

	// TODO(bret): Do smth different for this
	get finished(): boolean {
		return this.#elapsed >= this.#duration;
	}
	get delay(): number {
		return this.#delay;
	}

	constructor(duration: number) {
		this.#delay = 0;
		this.#duration = duration * CL.engine.fps;
	}

	getT(): number {
		let func: EaseFunc;
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

	start(): void {
		this.#elapsed = -this.#delay;
	}

	update(): void {
		this.#elapsed++;
	}

	setParent(parent: Tween): this {
		this.#parent = parent;
		return this;
	}

	setDelay(delay: number): this {
		this.#delay = delay * CL.engine.fps;
		return this;
	}

	setEase(ease: EaseType): this {
		this.#ease = ease;
		return this;
	}

	setTrans(trans: TransType): this {
		this.#trans = trans;
		return this;
	}
}

interface HasProp<T> {
	obj: T;
	prop: keyof T;
}

type PropType<T, U extends HasProp<T>> = T[U['prop']];
type AddFunc<T, U extends HasProp<T>> = (
	a: PropType<T, U>,
	b: PropType<T, U>,
) => PropType<T, U>;
type LerpFunc<T, U extends HasProp<T>> = (
	a: PropType<T, U>,
	b: PropType<T, U>,
	t: number,
) => PropType<T, U>;

// TODO(bret): Find a better place for this to live
const lerpAngle = (a: number, b: number, t: number): number => {
	const d = (b - a) % 360;
	const range = ((2 * d) % 360) - d;
	return range * t + a;
};

interface Operations<T, U extends HasProp<T>> {
	add: AddFunc<T, U>;
	lerp: LerpFunc<T, U>;
}

const _defaultAdd = (a: number, b: number): number => a + b;
const _defaultLerp = Math.lerp;
const getOperations = <T, U extends HasProp<T>>(
	value: PropType<T, U>,
): Operations<T, U> => {
	const math: Operations<T, U> = {
		add: _defaultAdd as unknown as AddFunc<T, U>,
		lerp: _defaultLerp as unknown as AddFunc<T, U>,
	};
	switch (true) {
		case typeof value === 'number':
			// intentionally left blank
			break;
		case value instanceof Vec2:
			math.add = Vec2.add as unknown as AddFunc<T, U>;
			math.lerp = Vec2.lerp as unknown as LerpFunc<T, U>;
			break;
		default:
			throw new Error('no matching lerp');
	}

	return math;
};

export class PropertyTweener<T> extends Tweener {
	obj: T;
	prop: keyof T;
	#start: PropType<T, this>;
	#target: PropType<T, this>;
	#from?: PropType<T, this>;
	#relative = false;
	#operations: Operations<T, this>;

	constructor(
		obj: T,
		prop: keyof T,
		target: T[typeof prop],
		duration: number,
	) {
		super(duration);
		this.obj = obj;
		this.prop = prop;
		this.#start = this.obj[this.prop];
		this.#target = target;

		this.#operations = getOperations(this.obj[this.prop]);
	}

	start(): void {
		super.start();
		this.#start = this.#from ?? this.obj[this.prop];
		if (this.#relative)
			this.#target = this.#operations.add(this.#start, this.#target);
	}

	update(): void {
		const t = this.getT();
		super.update();

		this.obj[this.prop] = this.#operations.lerp(
			this.#start,
			this.#target,
			t,
		);
	}

	from(value: PropType<T, this>): this {
		this.#from = value;
		return this;
	}

	fromCurrent(): this {
		this.#from = this.obj[this.prop];
		return this;
	}

	asRelative(): this {
		if (!this.#target) throw new Error('ruh roh');
		this.#relative = true;
		return this;
	}

	asAngle(): this {
		this.#operations.lerp = lerpAngle as unknown as LerpFunc<T, this>;
		return this;
	}

	setLerp(lerp: LerpFunc<T, this>): this {
		this.#operations.lerp = lerp;
		return this;
	}
}

export class SubtweenTweener extends Tweener {
	#tween: Tween;

	// TODO(bret): Do smth different for this
	get finished(): boolean {
		return this.#tween.finished;
	}

	constructor(tween: Tween) {
		super(0);
		this.#tween = tween;
	}

	update(): void {
		if (this.started) this.#tween.update();
		super.update();
	}
}

interface ITween {
	readonly step: number;
	readonly current: TweenGroup | null;
	readonly finished: boolean;
	readonly ease: EaseType;
	readonly trans: TransType;
	setParallel(parallel: boolean): this;
	parallel(): this;
	tweenProperty<T extends Entity>(
		obj: T,
		prop: keyof T,
		target: T[typeof prop],
		duration: number,
	): PropertyTweener<T>;
	setEase(ease: EaseType): this;
	setTrans(trans: TransType): this;
	update(): void;
}

export class Tween implements ITween {
	#lastStep = -1;
	#step = 0;
	#ease: EaseType = EaseType.EaseInOut;
	#trans: TransType = TransType.Linear;

	queue: TweenGroup[] = [];

	#nextParallel = false;
	#allParallel = false;

	// constructor() {
	// 	//
	// }

	get step(): number {
		return this.#step;
	}

	get current(): TweenGroup | null {
		return this.step < this.queue.length ? this.queue[this.step] : null;
	}

	get finished(): boolean {
		return this.#step >= this.queue.length;
	}

	get ease(): EaseType {
		return this.#ease;
	}

	get trans(): TransType {
		return this.#trans;
	}

	setParallel(parallel: boolean): this {
		this.#allParallel = parallel;
		return this.parallel();
	}

	parallel(): this {
		this.#nextParallel = true;
		return this;
	}

	#addTweener<T extends ITweener>(tweener: T): T {
		if (this.#nextParallel) {
			if (this.queue.length === 0) this.queue.push([]);
			this.queue.at(-1)?.push(tweener);
			this.#nextParallel = this.#allParallel;
			return tweener;
		}
		this.queue.push([tweener]);
		return tweener;
	}

	tweenProperty<T extends Entity>(
		obj: T,
		prop: keyof T,
		target: T[typeof prop],
		duration: number,
	): PropertyTweener<T> {
		return this.#addTweener(
			new PropertyTweener<T>(obj, prop, target, duration).setParent(this),
		);
	}

	tweenSubtween(tween: Tween): SubtweenTweener {
		return this.#addTweener(new SubtweenTweener(tween));
	}

	setEase(ease: EaseType): this {
		this.#ease = ease;
		return this;
	}

	setTrans(trans: TransType): this {
		this.#trans = trans;
		return this;
	}

	update(): void {
		if (this.current?.every((t) => t.finished)) {
			++this.#step;
		}

		if (this.current === null) return;

		if (this.#lastStep !== this.step) {
			this.current.forEach((t) => t.start());
			this.#lastStep = this.step;
		}

		this.current.forEach((t) => t.update());
	}
}
