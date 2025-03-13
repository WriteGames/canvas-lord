import type { Entity } from '../canvas-lord.ts';
import { CL } from '../canvas-lord.ts';

interface ITweener {
	readonly finished: boolean;
	readonly elapsed: number;
	start(): void;
	update(): void;
	asRelative(): this;
}

type PropType<T, U extends PropertyTweener<T>> = T[U['prop']];

export class PropertyTweener<T> implements ITweener {
	obj: T;
	prop: keyof T;
	#start: PropType<T, this>;
	#target: PropType<T, this>;
	#from?: PropType<T, this>;
	#elapsed = 0;
	#duration: number;
	#relative = false;

	constructor(
		obj: T,
		prop: keyof T,
		target: T[typeof prop],
		duration: number,
	) {
		this.obj = obj;
		this.prop = prop;
		this.#start = this.obj[this.prop];
		this.#target = target;
		this.#duration = duration * CL.engine.fps;
	}

	get elapsed(): number {
		return Math.clamp(this.#elapsed / (this.#duration - 1), 0, 1);
	}

	// TODO(bret): Do smth different for this
	get finished(): boolean {
		return this.#elapsed >= this.#duration - 1;
	}

	start(): void {
		// TODO(bret): move this to when it starts
		this.#start = this.#from ?? this.obj[this.prop];
		if (this.#relative)
			// @ts-expect-error -- TODO(bret): Gonna need to update this
			this.#target += this.#start;
	}

	update(): void {
		const t = this.elapsed;
		this.#elapsed++;

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

	asRelative(): this {
		if (!this.#target) throw new Error('ruh roh');
		this.#relative = true;
		return this;
	}
}

interface ITween {
	queue: TweenGroup[];
	current: TweenGroup | null;
	readonly step: number;
	tweenProperty<T extends Entity>(
		obj: T,
		prop: keyof T,
		target: T[typeof prop],
		duration: number,
	): PropertyTweener<T>;
}

type TweenGroup = ITweener[];

export class Tween implements ITween {
	#lastStep = -1;
	#step = 0;

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
			new PropertyTweener<T>(obj, prop, target, duration),
		);
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
