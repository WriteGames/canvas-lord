/* Canvas Lord v0.6.0 */
const xorShift32 = (random) => {
    let x = random.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (random.seed = x >>> 0);
};
export class Random {
    constructor(seed = Date.now()) {
        this.seed = seed;
    }
    #next() {
        return Number(xorShift32(this) / 0xffffffff);
    }
    float(n) {
        return this.#next() * n;
    }
    int(n) {
        return Math.floor(this.#next() * n);
    }
    range(a, b) {
        return this.float(b - a) + a;
    }
    bool() {
        return this.int(2) > 0;
    }
    sign() {
        return this.bool() ? 1 : -1;
    }
    angle() {
        return this.float(360);
    }
    choose(items) {
        return items[this.int(items.length)];
    }
}
const defaultRandom = new Random();
// Array prototype fun :~)
if (typeof Array.prototype.shuffle === 'undefined') {
    Array.prototype.shuffle = function shuffle(random = defaultRandom) {
        let m = this.length;
        let t;
        let i;
        while (m) {
            i = random.int(m--);
            t = this[m];
            this[m] = this[i];
            this[i] = t;
        }
        return this;
    };
}
if (typeof Array.prototype.toShuffled === 'undefined') {
    Array.prototype.toShuffled = function toShuffle(random = defaultRandom) {
        const newArr = [...this];
        return newArr.shuffle(random);
    };
}
//# sourceMappingURL=random.js.map