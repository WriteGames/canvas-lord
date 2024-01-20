export type LogValue = any;

export interface LogOptions {
	lifespan?: number;
}

export interface LoggerOptions {
	defaultLifespan?: number;
}

const loggerDefaults = Object.freeze({
	// TODO: is there any way we could get the game FPS to determine this?
	defaultLifespan: 60 * 2,
} as Required<LoggerOptions>);

export class Log {
	logger: Logger;
	elapsed: number;
	lifespan: number;
	#_value: LogValue;
	#_str: string = 'undefined';

	constructor(logger: Logger, value: LogValue, options: LogOptions = {}) {
		this.logger = logger;
		this.value = value;

		this.elapsed = 0;
		this.lifespan = options.lifespan ?? logger.defaultLifespan;
	}

	set value(val) {
		this.#_value = val;
		this.#_str = JSON.parse(JSON.stringify(val)).toString();
	}

	get value() {
		return this.#_value;
	}

	get str() {
		return this.#_str;
	}
}

export class Logger {
	x: number;
	y: number;
	defaultLifespan: number;
	logs: Log[];
	watched: Map<string, Log>;
	watchedDelimiter: string;

	constructor(x: number, y: number, options: LoggerOptions = {}) {
		this.x = x;
		this.y = y;

		const resolvedOptions = Object.assign({}, loggerDefaults, options);

		this.defaultLifespan = resolvedOptions.defaultLifespan;
		this.logs = [];
		this.watched = new Map();
		this.watchedDelimiter = ': ';
	}

	log(str: string, options?: LogOptions) {
		const log = new Log(this, str, options);
		this.logs.push(log);
	}

	watch(tag: string, initialValue: LogValue, options?: LogOptions) {
		const log = new Log(this, initialValue, options);
		this.watched.set(tag, log);
	}

	set(tag: string, value: LogValue) {
		const log = this.watched.get(tag);
		if (!log) {
			console.warn(`Logger is not watching "${tag}"`);
			return;
		}
		log.value = value;
	}

	update() {
		// remove old logs
		this.logs = this.logs.filter((log) => log.elapsed !== log.lifespan);

		// update logs
		this.logs.forEach((log) => log.elapsed++);
	}

	render(ctx: CanvasRenderingContext2D) {
		const lines = this.watched.size + this.logs.length;
		if (lines === 0) return;

		let drawX = this.x,
			drawY = this.y;

		ctx.font = '10px Monospace';

		const glyph = ctx.measureText('0');
		const ascenderHeight = glyph.actualBoundingBoxAscent;

		const longestPrefix =
			Array.from(this.watched)
				.map(([k]) => k.length + this.watchedDelimiter.length)
				.sort((a, b) => b - a)[0] ?? 0;

		const longestLength =
			[
				Array.from(this.watched).map(
					([k, log]) =>
						longestPrefix +
						this.watchedDelimiter.length +
						log.str.length,
				),
				this.logs.map((log) => log.str.length),
			]
				.flat()
				.sort((a, b) => b - a)[0] ?? 0;

		const textWidth = glyph.width * longestLength;
		const textHeight = 10;

		const paddingX = 3;
		const paddingY = 3;

		// background
		ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		ctx.fillRect(
			drawX,
			drawY,
			textWidth + paddingX * 2,
			textHeight * lines +
				paddingY * 2 -
				// for the first line, we only want the ascender height
				(textHeight - ascenderHeight),
		);

		// text
		ctx.textBaseline = 'alphabetic';
		ctx.fillStyle = 'white';

		this.watched.forEach((log, key) => {
			const prefix = `${key}${this.watchedDelimiter}`;
			const spaces = ' '.repeat(longestPrefix - prefix.length);
			ctx.fillText(
				`${prefix}${spaces}${log.str}`,
				drawX + paddingX,
				drawY + paddingY + ascenderHeight,
			);

			drawY += textHeight;
		});

		this.logs.forEach((log) => {
			ctx.fillText(
				log.str,
				drawX + paddingX,
				drawY + paddingY + ascenderHeight,
			);

			drawY += textHeight;
		});
	}
}
