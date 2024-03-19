export class Camera extends Array {
    constructor(x, y) {
        super();
        this.push(x, y);
    }
    get x() {
        return this[0];
    }
    set x(val) {
        this[0] = val;
    }
    get y() {
        return this[1];
    }
    set y(val) {
        this[1] = val;
    }
}
//# sourceMappingURL=camera.js.map