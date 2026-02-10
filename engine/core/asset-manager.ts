import type { AtlasData } from '../graphic/atlas.js';
import { Delegate } from '../util/delegate.js';

interface Asset {
	fileName: string;
	bytesLoaded: number;
	fileSize: number;
	loaded: boolean;
}

interface Loaded {
	loaded: true;
}

export type ImageAsset = Asset &
	(
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

export type AtlasAsset = Asset &
	(
		| {
				data: null;
				loaded: false;
		  }
		| {
				data: AtlasData;
				width: number;
				height: number;
				loaded: true;
		  }
	);

export type AudioAsset = Asset &
	(
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
	imagesLoaded: number;
	atlasesLoaded: number;
	audioFilesLoaded: number;
	onLoad: Delegate<(src: string) => void>;
	prefix: string;
}

export class AssetManager {
	loaded = false;

	#assets: Map<string, Asset>;
	#images: Map<string, ImageAsset>;
	#atlases: Map<string, AtlasAsset>;
	#audio: Map<string, AudioAsset>;

	constructor(prefix = '') {
		this.#assets = new Map();
		this.#images = new Map();
		this.#atlases = new Map();
		this.#audio = new Map();
		this.imagesLoaded = 0;
		this.atlasesLoaded = 0;
		this.audioFilesLoaded = 0;
		this.onLoad = new Delegate();
		this.prefix = prefix;
	}

	addImage(...src: string[] | string[][]): void {
		src.flat().forEach((src) => {
			const asset: ImageAsset = {
				fileName: src,
				bytesLoaded: 0,
				fileSize: -1,
				image: null,
				loaded: false,
			};
			this.#images.set(src, asset);
			this.#assets.set(src, asset);
		});
	}

	addImages(...src: string[] | string[][]): void {
		this.addImage(...src);
	}

	addAtlas(...src: string[] | string[][]): void {
		src.flat().forEach((src) => {
			const asset: AtlasAsset = {
				fileName: src,
				bytesLoaded: 0,
				fileSize: -1,
				data: null,
				loaded: false,
			};
			this.#atlases.set(src, asset);
			this.#assets.set(src, asset);
		});
	}

	addAtlases(...src: string[] | string[][]): void {
		this.addAtlas(...src);
	}

	addAudio(...src: string[] | string[][]): void {
		src.flat().forEach((src) => {
			const asset: AudioAsset = {
				fileName: src,
				bytesLoaded: 0,
				fileSize: -1,
				buffer: null,
				loaded: false,
			};
			this.#audio.set(src, asset);
			this.#assets.set(src, asset);
		});
	}

	get progress(): number {
		const assets = [...this.#assets.values()];
		const totalBytes = assets.reduce(
			(acc, { fileSize }) => acc + fileSize,
			0,
		);
		const loadedBytes = assets.reduce(
			(acc, { bytesLoaded }) => acc + bytesLoaded,
			0,
		);
		return totalBytes > 0 ? loadedBytes / totalBytes : 0;
	}

	get percent(): number {
		return 100 * this.progress;
	}

	#getFullPath(src: string): string {
		return src.startsWith('http') ? src : `${this.prefix}${src}`;
	}

	getAsset(src: string): Loaded & Asset {
		const result = this.#assets.get(src);
		if (!result || !result.loaded)
			throw new Error(`[getAsset()] failed to get asset "${src}"`);
		return result as Loaded & Asset;
	}

	getImage(src: string): Loaded & ImageAsset {
		const result = this.#images.get(src);
		if (!result || !result.loaded)
			throw new Error(`[getImage()] failed to get asset "${src}"`);
		return result;
	}

	getAtlas(src: string): Loaded & AtlasAsset {
		const result = this.#atlases.get(src);
		if (!result || !result.loaded)
			throw new Error(`[getAtlas()] failed to get asset "${src}"`);
		return result;
	}

	getAudio(src: string): Loaded & AudioAsset {
		const result = this.#audio.get(src);
		if (!result || !result.loaded)
			throw new Error(`[getAudio()] failed to get asset "${src}"`);
		return result;
	}

	async preloadAsset(src: string): Promise<void> {
		const fullPath = this.#getFullPath(src);
		const asset = this.#assets.get(src);
		if (!asset) {
			throw new Error(
				`Attempting to preload image that doesn't exist in map ("${src}" / "${fullPath}")`,
			);
		}

		await fetch(fullPath, {
			method: 'HEAD',
		}).then((res) => {
			asset.fileSize = Number(res.headers.get('Content-Length'));
		});
	}

	async loadAsset(src: string, asset: Asset): Promise<Response> {
		return fetch(src)
			.then((res) => {
				const reader = res.body?.getReader();
				if (!reader) throw new Error('???');

				asset.bytesLoaded = 0;

				return new ReadableStream({
					start(controller) {
						const pump = (): Promise<void> | undefined => {
							return reader.read().then(({ done, value }) => {
								if (done) {
									controller.close();
									return;
								}

								asset.bytesLoaded += value.length;

								controller.enqueue(value);
								return pump();
							});
						};
						return pump();
					},
				});
			})
			.then((stream) => new Response(stream));
	}

	async loadAudio(src: string): Promise<void> {
		const fullPath = this.#getFullPath(src);

		const audio = this.#audio.get(src);
		if (!audio) {
			throw new Error(
				`Loaded audio that doesn't exist in map ("${src}" / "${fullPath}")`,
			);
		}

		await this.loadAsset(fullPath, audio)
			.then((res) => res.arrayBuffer())
			.then((arrayBuffer) => Sfx.audioCtx.decodeAudioData(arrayBuffer))
			.then((audioBuffer) => {
				audio.loaded = true;
				audio.buffer = audioBuffer;
				if (isLoaded(audio)) {
					audio.duration = audioBuffer.duration;
				}
				this.audioLoaded(src);
				return audio;
			})
			// VALIDATE(bret): why in the world..?
			.then((audio) => {
				if (audio.buffer) {
					audio.duration = 10;
				}
			});
	}

	async loadAtlas(src: string): Promise<void> {
		const fullPath = this.#getFullPath(src);
		const atlas = this.#atlases.get(src);
		if (!atlas) {
			throw new Error(
				`Attempting to load atlas that doesn't exist in map ("${src}" / "${fullPath}")`,
			);
		}

		atlas.data = await this.loadAsset(fullPath, atlas).then(
			(res) => res.json() as Promise<AtlasData>,
		);

		atlas.loaded = true;
		this.atlasLoaded(src);
	}

	async loadImage(src: string): Promise<void> {
		const image = new Image();
		const fullPath = this.#getFullPath(src);
		if (
			fullPath.startsWith('http') &&
			!fullPath.startsWith(location.origin)
		) {
			image.crossOrigin = 'Anonymous';
		}

		const sprite = this.#images.get(src);
		if (!sprite) {
			throw new Error(
				`Attempting to load image that doesn't exist in map ("${src}" / "${fullPath}")`,
			);
		}
		image.onload = (): void => {
			sprite.loaded = true;
			sprite.image = image;
			if (isLoaded(sprite)) {
				sprite.width = image.width;
				sprite.height = image.height;
			}
			this.imageLoaded(src);
		};
		image.src = await this.loadAsset(fullPath, sprite)
			.then((res) => res.blob())
			.then((blob) => URL.createObjectURL(blob));
	}

	async loadAssets(): Promise<void> {
		if (this.#assets.size === 0) this.emitOnLoad('');

		const assets = [...this.#assets.keys()];
		await Promise.all(assets.map(async (src) => this.preloadAsset(src)));

		await Promise.all(
			assets.map(async (src) => {
				switch (true) {
					case this.#images.has(src):
						return this.loadImage(src);
					case this.#atlases.has(src):
						console.log('loading', src);
						return this.loadAtlas(src);
					case this.#audio.has(src):
						return this.loadAudio(src);
					default:
						throw new Error('unsupported asset type');
				}
			}),
		);
	}

	emitOnLoad(src: string): void {
		window.requestAnimationFrame(() => {
			this.onLoad.invoke(src);
		});
	}

	async reloadAssets(): Promise<void> {
		this.imagesLoaded = 0;
		this.atlasesLoaded = 0;
		this.audioFilesLoaded = 0;
		const sprites = [...this.#images.keys()];
		if (sprites.length === 0) this.emitOnLoad('');
		await Promise.all(sprites.map(async (src) => this.loadImage(src)));
	}

	_checkAllAssetsLoaded(): void {
		if (
			this.imagesLoaded === this.#images.size &&
			this.atlasesLoaded === this.#atlases.size &&
			this.audioFilesLoaded === this.#audio.size
		) {
			this.emitOnLoad('');
		}
	}

	imageLoaded(_src: string): void {
		++this.imagesLoaded;
		this._checkAllAssetsLoaded();
	}

	atlasLoaded(_src: string): void {
		++this.atlasesLoaded;
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

	static #play(
		audio: AudioAsset,
		volume?: number,
		pitchVariance?: number,
		loop = false,
	): AudioBufferSourceNode {
		const source = Sfx.audioCtx.createBufferSource();
		source.buffer = audio.buffer;
		source.loop = loop;

		if (pitchVariance) {
			source.playbackRate.value =
				1.0 - pitchVariance + Math.random() * 2 * pitchVariance;
		}

		const connections: AudioNode[] = [source];

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

	static play(
		audio: AudioAsset,
		volume?: number,
		pitchVariance?: number,
	): void {
		this.#play(audio, volume, pitchVariance);
	}

	static loop(
		audio: AudioAsset,
		volume?: number,
		pitchVariance?: number,
	): void {
		const source = this.#play(audio, volume, pitchVariance, true);
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
