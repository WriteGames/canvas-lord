/* Canvas Lord v0.4.4 */
export type MessagesPayload = object;
export type MessagesSubscriber = {
	receive?: (message: string, payload: MessagesPayload) => void;
};

export class Messages {
	subscribers: Map<string, MessagesSubscriber[]>;

	constructor() {
		this.subscribers = new Map<string, MessagesSubscriber[]>();
	}

	subscribe(subscriber: MessagesSubscriber, ...messages: string[]) {
		messages.forEach((message) => {
			if (!this.subscribers.has(message)) {
				this.subscribers.set(message, []);
			}
			const subs = this.subscribers.get(message);
			subs?.push(subscriber);
		});
	}

	sendMessage(message: string, payload: MessagesPayload) {
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
