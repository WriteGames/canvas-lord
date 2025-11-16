type EventEnum = Record<string, string>;
type EventPayload<T extends EventEnum> = Partial<Record<T[keyof T], unknown>>;

export type EventPayloadMap<
	T extends EventEnum,
	U extends EventPayload<T> = EventPayload<T>,
> = {
	[K in T[keyof T]]: U[K];
};

export interface IBroadcaster<
	T extends EventEnum,
	P extends EventPayloadMap<T> = EventPayloadMap<T>,
> {
	subscribe(sub: ISubscriber<T, P>, event: T[keyof T]): void;
	unsubscribe(sub: ISubscriber<T, P>, event: T[keyof T]): void;
	emit<E extends T[keyof T]>(event: E, payload: P[typeof event]): void;
}

export interface ISubscriber<
	T extends EventEnum,
	P extends EventPayloadMap<T> = EventPayloadMap<T>,
> {
	receive<E extends T[keyof T]>(event: E, payload: P[typeof event]): void;
}

export class EventBus<
	T extends EventEnum,
	P extends EventPayloadMap<T> = EventPayloadMap<T>,
> {
	#subscriptions: Map<keyof T, Array<ISubscriber<T, P>>>;

	constructor() {
		this.#subscriptions = new Map();
	}

	subscribe(sub: ISubscriber<T, P>, event: T[keyof T]): void {
		let list = this.#subscriptions.get(event);
		if (!list) {
			list = [];
			this.#subscriptions.set(event, list);
		}
		list.push(sub);
	}

	unsubscribe(sub: ISubscriber<T, P>, event: T[keyof T]): void {
		const list = this.#subscriptions.get(event);
		if (!list) return;
		const index = list.indexOf(sub);
		if (index < 0) return;
		list.splice(index, 1);
	}

	emit<E extends T[keyof T]>(event: E, payload: P[typeof event]): void {
		const list = this.#subscriptions.get(event);
		if (!list) return;

		list.forEach((sub) => sub.receive(event, payload));
	}
}
