export class Inspector {
    engine;
    wrapper;
    items = [];
    constructor(engine) {
        this.engine = engine;
        const inspectorElem = document.createElement('div');
        inspectorElem.classList.add('inspector');
        engine.focusElement.append(inspectorElem);
        engine.listeners.update.add(this.onUpdate.bind(this));
        this.wrapper = inspectorElem;
    }
    watch(property) {
        const input = document.createElement('input');
        this.wrapper.append(property, input);
        const item = {
            input,
            latestInput: null,
            property,
            focused: false,
        };
        input.addEventListener('input', (e) => {
            const { value } = e.target;
            if (!value)
                return;
            item.latestInput = value;
        });
        this.items.push(item);
    }
    onUpdate() {
        const scene = this.engine.currentScenes?.[0];
        if (!scene)
            return;
        const player = scene.entities?.[0];
        if (!player)
            return;
        this.items.forEach((item) => {
            item.focused = document.activeElement === item.input;
        });
        const updatedInputs = this.items.filter((p) => p.latestInput !== null);
        const otherInputs = this.items.filter((p) => p.latestInput === null);
        updatedInputs.forEach((item) => {
            const newValue = Number(item.latestInput);
            if (!isNaN(newValue)) {
                player[item.property] = newValue;
            }
            if (!item.focused)
                item.latestInput = null;
        });
        otherInputs.forEach((item) => {
            item.input.value = player[item.property];
        });
    }
}
//# sourceMappingURL=inspector.js.map