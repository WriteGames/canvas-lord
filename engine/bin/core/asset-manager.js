export class AssetManager {
    constructor(prefix = '') {
        this.sprites = new Map();
        this.audio = new Map();
        this.spritesLoaded = 0;
        this.audioFilesLoaded = 0;
        this.onLoadCallbacks = [];
        this.prefix = prefix;
    }
    get progress() {
        const assets = [...this.sprites.keys(), ...this.audio.keys()];
        return (this.spritesLoaded + this.audioFilesLoaded) / assets.length;
    }
    addImage(src) {
        this.sprites.set(src, { fileName: src, image: null, loaded: false });
    }
    addAudio(src) {
        this.audio.set(src, {
            fileName: src,
            buffer: null,
            loaded: false,
        });
    }
    async loadAudio(src) {
        const fullPath = `${this.prefix}${src}`;
        await fetch(fullPath)
            .then((res) => res.arrayBuffer())
            .then((arrayBuffer) => Sfx.audioCtx.decodeAudioData(arrayBuffer))
            .then((audioBuffer) => {
            const audio = this.audio.get(src);
            if (!audio) {
                throw new Error(`Loaded audio that doesn't exist in map ("${src}" / "${fullPath}")`);
            }
            audio.loaded = true;
            if ((audio.buffer = audioBuffer)) {
                audio.duration = audioBuffer.duration;
            }
            this.audioLoaded(src);
        });
    }
    loadImage(src) {
        const image = new Image();
        const fullPath = `${this.prefix}${src}`;
        if (fullPath.startsWith('http') &&
            !fullPath.startsWith(location.origin)) {
            image.crossOrigin = 'Anonymous';
        }
        image.onload = () => {
            const sprite = this.sprites.get(src);
            if (!sprite) {
                throw new Error(`Loaded image that doesn't exist in map ("${src}" / "${fullPath}")`);
            }
            sprite.loaded = true;
            if ((sprite.image = image)) {
                sprite.width = image.width;
                sprite.height = image.height;
            }
            this.imageLoaded(src);
        };
        image.src = fullPath;
    }
    async loadAssets() {
        const sprites = [...this.sprites.keys()];
        const audio = [...this.audio.keys()];
        const assets = [...sprites, ...audio];
        if (assets.length === 0)
            this.emitOnLoad('');
        sprites.forEach((src) => {
            this.loadImage(src);
        });
        // audio.forEach((src) => this.loadAudio(src));
        await Promise.all(audio.map(async (src) => this.loadAudio(src)));
    }
    emitOnLoad(src) {
        window.requestAnimationFrame(() => {
            this.onLoadCallbacks.forEach((callback) => callback(src));
        });
    }
    reloadAssets() {
        this.spritesLoaded = 0;
        this.audioFilesLoaded = 0;
        const sprites = [...this.sprites.keys()];
        if (sprites.length === 0)
            this.emitOnLoad('');
        sprites.forEach((src) => {
            this.loadImage(src);
        });
    }
    _checkAllAssetsLoaded() {
        if (this.spritesLoaded === this.sprites.size &&
            this.audioFilesLoaded === this.audio.size) {
            this.emitOnLoad('');
        }
    }
    imageLoaded(src) {
        ++this.spritesLoaded;
        this._checkAllAssetsLoaded();
    }
    audioLoaded(src) {
        ++this.audioFilesLoaded;
        this._checkAllAssetsLoaded();
    }
    onLoad(callback) {
        this.onLoadCallbacks.push(callback);
    }
}
export class Sfx {
    static audioCtx = new AudioContext();
    static music = new Map();
    static play(audio) {
        const source = Sfx.audioCtx.createBufferSource();
        source.buffer = audio.buffer;
        source.connect(Sfx.audioCtx.destination);
        source.start();
    }
    static loop(audio) {
        // TODO(bret): Make sure we're not looping twice!
        const source = Sfx.audioCtx.createBufferSource();
        source.buffer = audio.buffer;
        source.connect(Sfx.audioCtx.destination);
        source.loop = true;
        source.start();
        this.music.set(audio, source);
    }
    // TODO(bret): Gonna need this to work for all audio, not just for music
    static stop(audio) {
        const source = this.music.get(audio);
        if (source) {
            source.stop();
            this.music.delete(audio);
        }
    }
}
//# sourceMappingURL=asset-manager.js.map