export class Messages {
    subscribers;
    constructor() {
        this.subscribers = new Map();
    }
    subscribe(subscriber, ...messages) {
        messages.forEach((message) => {
            if (!this.subscribers.has(message)) {
                this.subscribers.set(message, []);
            }
            const subs = this.subscribers.get(message);
            subs?.push(subscriber);
        });
    }
    sendMessage(message, payload) {
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
//# sourceMappingURL=messages.js.map