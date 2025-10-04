/* Canvas Lord v0.6.1 */
import { Delegate } from '../util/delegate.js';
const isLoaded = (asset) => asset.loaded;
export class AssetManager {
    constructor(prefix = '') {
        this.sprites = new Map();
        this.audio = new Map();
        this.spritesLoaded = 0;
        this.audioFilesLoaded = 0;
        this.onLoad = new Delegate();
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
        const fullPath = src.startsWith('http') ? src : `${this.prefix}${src}`;
        await fetch(fullPath)
            .then((res) => res.arrayBuffer())
            .then((arrayBuffer) => Sfx.audioCtx.decodeAudioData(arrayBuffer))
            .then((audioBuffer) => {
            const audio = this.audio.get(src);
            if (!audio) {
                throw new Error(`Loaded audio that doesn't exist in map ("${src}" / "${fullPath}")`);
            }
            audio.loaded = true;
            audio.buffer = audioBuffer;
            if (isLoaded(audio)) {
                audio.duration = audioBuffer.duration;
            }
            this.audioLoaded(src);
            return audio;
        })
            .then((audio) => {
            if (audio.buffer) {
                audio.duration = 10;
            }
        });
    }
    loadImage(src) {
        const image = new Image();
        const fullPath = src.startsWith('http') ? src : `${this.prefix}${src}`;
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
            sprite.image = image;
            if (isLoaded(sprite)) {
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
            this.onLoad.invoke(src);
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
    imageLoaded(_src) {
        ++this.spritesLoaded;
        this._checkAllAssetsLoaded();
    }
    audioLoaded(_src) {
        ++this.audioFilesLoaded;
        this._checkAllAssetsLoaded();
    }
}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- static class yo
export class Sfx {
    static #audioCtx;
    static get audioCtx() {
        Sfx.#audioCtx ??= new AudioContext();
        return Sfx.#audioCtx;
    }
    static music = new Map();
    static resetAudioCtx() {
        Sfx.#audioCtx = new AudioContext();
    }
    static #play(audio, volume, pitchVariance, loop = false) {
        const source = Sfx.audioCtx.createBufferSource();
        source.buffer = audio.buffer;
        source.loop = loop;
        if (pitchVariance) {
            source.playbackRate.value =
                1.0 - pitchVariance + Math.random() * 2 * pitchVariance;
        }
        const connections = [source];
        if (volume !== undefined) {
            const gainNode = Sfx.audioCtx.createGain();
            gainNode.gain.setValueAtTime(volume, Sfx.audioCtx.currentTime);
            connections.push(gainNode);
        }
        connections.push(Sfx.audioCtx.destination);
        for (let i = 0; i < connections.length - 1; ++i) {
            connections[i].connect(connections[i + 1]);
        }
        source.start();
        return source;
    }
    static play(audio, volume, pitchVariance) {
        this.#play(audio, volume, pitchVariance);
    }
    static loop(audio, volume, pitchVariance) {
        const source = this.#play(audio, volume, pitchVariance, true);
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