/* Canvas Lord v0.5.3 */

import { Delegate } from '../util/delegate.js';

export type ImageAsset = {
	fileName: string;
} & (
	| {
			image: null;
			loaded: false;
	  }
	| {
			image: HTMLImageElement;
			width: number;
			height: number;
			loaded: true;
	  }
);

export type AudioAsset = {
	fileName: string;
} & (
	| {
			buffer: null;
			loaded: false;
	  }
	| {
			buffer: AudioBuffer;
			duration: number;
			loaded: true;
	  }
);

const isLoaded = <T extends { loaded: boolean }>(
	asset: T,
): asset is T & {
	loaded: true;
} => asset.loaded;

export interface AssetManager {
	sprites: Map<string, ImageAsset>;
	audio: Map<string, AudioAsset>;
	spritesLoaded: number;
	audioFilesLoaded: number;
	onLoad: Delegate<(src: string) => void>;
	prefix: string;
}

export class AssetManager {
	constructor(prefix = '') {
		this.sprites = new Map();
		this.audio = new Map();
		this.spritesLoaded = 0;
		this.audioFilesLoaded = 0;
		this.onLoad = new Delegate();
		this.prefix = prefix;
	}

	get progress(): number {
		const assets = [...this.sprites.keys(), ...this.audio.keys()];
		return (this.spritesLoaded + this.audioFilesLoaded) / assets.length;
	}

	addImage(src: string): void {
		this.sprites.set(src, { fileName: src, image: null, loaded: false });
	}

	addAudio(src: string): void {
		this.audio.set(src, {
			fileName: src,
			buffer: null,
			loaded: false,
		});
	}

	async loadAudio(src: string): Promise<void> {
		const fullPath = src.startsWith('http') ? src : `${this.prefix}${src}`;

		await fetch(fullPath)
			.then((res) => res.arrayBuffer())
			.then((arrayBuffer) => Sfx.audioCtx.decodeAudioData(arrayBuffer))
			.then((audioBuffer) => {
				const audio = this.audio.get(src);
				if (!audio) {
					throw new Error(
						`Loaded audio that doesn't exist in map ("${src}" / "${fullPath}")`,
					);
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

	loadImage(src: string): void {
		const image = new Image();
		const fullPath = src.startsWith('http') ? src : `${this.prefix}${src}`;
		if (
			fullPath.startsWith('http') &&
			!fullPath.startsWith(location.origin)
		) {
			image.crossOrigin = 'Anonymous';
		}
		image.onload = (): void => {
			const sprite = this.sprites.get(src);
			if (!sprite) {
				throw new Error(
					`Loaded image that doesn't exist in map ("${src}" / "${fullPath}")`,
				);
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

	async loadAssets(): Promise<void> {
		const sprites = [...this.sprites.keys()];
		const audio = [...this.audio.keys()];
		const assets = [...sprites, ...audio];
		if (assets.length === 0) this.emitOnLoad('');
		sprites.forEach((src) => {
			this.loadImage(src);
		});
		// audio.forEach((src) => this.loadAudio(src));
		await Promise.all(audio.map(async (src) => this.loadAudio(src)));
	}

	emitOnLoad(src: string): void {
		window.requestAnimationFrame(() => {
			this.onLoad.invoke(src);
		});
	}

	reloadAssets(): void {
		this.spritesLoaded = 0;
		this.audioFilesLoaded = 0;
		const sprites = [...this.sprites.keys()];
		if (sprites.length === 0) this.emitOnLoad('');
		sprites.forEach((src) => {
			this.loadImage(src);
		});
	}

	_checkAllAssetsLoaded(): void {
		if (
			this.spritesLoaded === this.sprites.size &&
			this.audioFilesLoaded === this.audio.size
		) {
			this.emitOnLoad('');
		}
	}

	imageLoaded(_src: string): void {
		++this.spritesLoaded;
		this._checkAllAssetsLoaded();
	}

	audioLoaded(_src: string): void {
		++this.audioFilesLoaded;
		this._checkAllAssetsLoaded();
	}
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- static class yo
export class Sfx {
	static #audioCtx?: AudioContext;
	static get audioCtx(): AudioContext {
		Sfx.#audioCtx ??= new AudioContext();
		return Sfx.#audioCtx;
	}

	static music = new Map<AudioAsset, AudioBufferSourceNode>();

	static resetAudioCtx(): void {
		Sfx.#audioCtx = new AudioContext();
	}

	static play(audio: AudioAsset): void {
		const source = Sfx.audioCtx.createBufferSource();
		source.buffer = audio.buffer;
		source.connect(Sfx.audioCtx.destination);
		source.start();
	}

	static loop(audio: AudioAsset): void {
		// TODO(bret): Make sure we're not looping twice!
		const source = Sfx.audioCtx.createBufferSource();
		source.buffer = audio.buffer;
		source.connect(Sfx.audioCtx.destination);
		source.loop = true;
		source.start();
		this.music.set(audio, source);
	}

	// TODO(bret): Gonna need this to work for all audio, not just for music
	static stop(audio: AudioAsset): void {
		const source = this.music.get(audio);
		if (source) {
			source.stop();
			this.music.delete(audio);
		}
	}
}
