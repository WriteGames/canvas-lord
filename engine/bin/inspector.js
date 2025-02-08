/* Canvas Lord v0.5.3 */
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
    watch(property, options) {
        const input = document.createElement('input');
        input.type = options?.type ?? 'number';
        this.wrapper.append(property, input);
        if (options) {
            if (options.min !== undefined)
                input.min = String(options.min);
            if (options.max !== undefined)
                input.max = String(options.max);
        }
        const item = {
            input,
            latestInput: null,
            property,
            focused: false,
            options,
        };
        if (options?.type === 'checkbox') {
            input.addEventListener('change', (e) => {
                const { checked } = e.target;
                item.latestInput = checked.toString();
            });
        }
        else {
            input.addEventListener('input', (e) => {
                const { value } = e.target;
                if (!value)
                    return;
                item.latestInput = value;
            });
        }
        this.items.push(item);
    }
    onUpdate() {
        const scene = this.engine.currentScenes?.[0];
        if (!scene)
            return;
        const player = scene.entities.inScene?.[0];
        if (!player)
            return;
        this.items.forEach((item) => {
            item.focused = document.activeElement === item.input;
        });
        const updatedInputs = this.items.filter((p) => p.latestInput !== null);
        const otherInputs = this.items.filter((p) => p.latestInput === null);
        updatedInputs.forEach((item) => {
            let newValue;
            switch (item.options?.type) {
                case 'checkbox': {
                    if (item.latestInput !== null)
                        newValue = JSON.parse(item.latestInput);
                    item.latestInput = null;
                    break;
                }
                case 'number':
                default: {
                    newValue = Number(item.latestInput);
                    if (isNaN(newValue)) {
                        newValue = undefined;
                    }
                    if (!item.focused)
                        item.latestInput = null;
                    break;
                }
            }
            if (newValue !== undefined) {
                // @ts-expect-error
                player[item.property] = newValue;
            }
        });
        otherInputs.forEach((item) => {
            // @ts-expect-error
            item.input.value = player[item.property];
        });
    }
}
//# sourceMappingURL=inspector.js.map