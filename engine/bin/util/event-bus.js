/* Canvas Lord v0.6.1 */
export class EventBus {
    #subscriptions;
    constructor() {
        this.#subscriptions = new Map();
    }
    subscribe(sub, event) {
        let list = this.#subscriptions.get(event);
        if (!list) {
            list = [];
            this.#subscriptions.set(event, list);
        }
        list.push(sub);
    }
    unsubscribe(sub, event) {
        const list = this.#subscriptions.get(event);
        if (!list)
            return;
        const index = list.indexOf(sub);
        if (index < 0)
            return;
        list.splice(index, 1);
    }
    emit(event, payload) {
        const list = this.#subscriptions.get(event);
        if (!list)
            return;
        list.forEach((sub) => sub.receive(event, payload));
    }
}
//# sourceMappingURL=event-bus.js.map