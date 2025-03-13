import type { Entity } from '../canvas-lord.ts';
import { CL } from '../canvas-lord.ts';
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

	// TODO(bret): Do smth different for this
	get finished(): boolean {
		return this.#elapsed >= this.#duration - 1;
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

type PropType<T, U extends PropertyTweener<T>> = T[U['prop']];

export class PropertyTweener<T> extends Tweener {
	obj: T;
	prop: keyof T;
	#start: PropType<T, this>;
	#target: PropType<T, this>;
	#from?: PropType<T, this>;
	#relative = false;

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
	}

	start(): void {
		super.start();
		// TODO(bret): move this to when it starts
		this.#start = this.#from ?? this.obj[this.prop];
		if (this.#relative)
			// @ts-expect-error -- TODO(bret): Gonna need to update this
			this.#target += this.#start;
	}

	update(): void {
		const t = this.getT();
		super.update();

		if (
			typeof this.#start !== 'number' ||
			typeof this.#target !== 'number'
		) {
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
				newValue = Math.lerp(
					this.#start,
					this.#target,
					t,
				) as typeof newValue;
				break;
		}
		this.obj[this.prop] = newValue;
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

// const player = new Entity();

// const tween = new Tween();
// tween.tweenProperty(player, 'x', 30, 1);
