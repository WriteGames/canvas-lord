export type MessagesPayload = object;
export interface MessagesSubscriber {
	receive?: (message: string, payload: MessagesPayload) => void;
}

export class Messages {
	subscribers: Map<string, MessagesSubscriber[]>;

	constructor() {
		this.subscribers = new Map<string, MessagesSubscriber[]>();
	}

	subscribe(subscriber: MessagesSubscriber, ...messages: string[]): void {
		messages.forEach((message) => {
			if (!this.subscribers.has(message)) {
				this.subscribers.set(message, []);
			}
			const subs = this.subscribers.get(message);
			subs?.push(subscriber);
		});
	}

	sendMessage(message: string, payload: MessagesPayload): void {
		const subs = this.subscribers.get(message);
		if (!subs) {
			console.warn(`${message} isn't registered`);
			return;
		}

		subs.forEach((sub) => {
			const receive = sub.receive;
			if (!receive) {
				console.warn(`subscriber doesn't have receive() method`, sub);
				return;
			}
			receive(message, payload);
		});
	}
}
