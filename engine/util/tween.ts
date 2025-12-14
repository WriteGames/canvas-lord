import type { Entity } from '../core/entity.ts';
import { Delegate } from './delegate.ts';
import {
	EaseType,
	type ITweener,
	PropertyTweener,
	SubtweenTweener,
	TransType,
} from './tweener.ts';

export { EaseType, TransType } from './tweener.ts';

type TweenGroup = ITweener[];

interface ITween {
	readonly step: number;
	readonly current: TweenGroup | null;
	readonly finished: boolean;
	readonly ease: EaseType;
	readonly trans: TransType;
	readonly playing: boolean;
	readonly paused: boolean;
	setParallel(parallel: boolean): this;
	parallel(): this;
	tweenProperty<T>(
		obj: T,
		prop: keyof T,
		target: T[typeof prop],
		duration: number,
	): PropertyTweener<T>;
	tweenSubtween(tween: Tween): SubtweenTweener;
	setEase(ease: EaseType | keyof typeof EaseType): this;
	setTrans(trans: TransType | keyof typeof TransType): this;
	update(): void;
	pause(): void;
	play(): void;
}

export class Tween implements ITween {
	#lastStep = -1;
	#step = 0;
	#ease: EaseType = EaseType.EaseInOut;
	#trans: TransType = TransType.Linear;

	parent?: Entity;

	queue: TweenGroup[] = [];

	onFinish = new Delegate();

	#paused = false;

	#nextParallel = false;
	#allParallel = false;

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

	get playing(): boolean {
		return !this.#paused;
	}

	get paused(): boolean {
		return this.#paused;
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

	tweenProperty<T>(
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

	setEase(trans: EaseType): this;
	setEase(trans: keyof typeof EaseType): this;
	setEase(ease: EaseType | keyof typeof EaseType): this {
		this.#ease = typeof ease === 'string' ? EaseType[ease] : ease;
		return this;
	}

	setTrans(trans: TransType): this;
	setTrans(trans: keyof typeof TransType): this;
	setTrans(trans: TransType | keyof typeof TransType): this {
		this.#trans = typeof trans === 'string' ? TransType[trans] : trans;
		return this;
	}

	update(): void {
		if (this.#paused) return;

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

	#finish(): void {
		this.parent?.removeTween(this);
		this.onFinish.invoke();
	}

	pause(): void {
		this.#paused = true;
	}

	play(): void {
		this.#paused = false;
	}
}
