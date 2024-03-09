// IDEA(bret): What if we can define types of logs and toggle them on/off?
// IDEA(bret): There could also be a setting that you can enable to choose whether getting a value sent to that Log item causes it to display
// IDEA(bret): You could also have a timeout that causes that log value to disable after not receiving a change for X frames

// IDEA(bret): More UI/UX, but would be nice to have a differentiator between values that are representing a variable directly (`coyoteFrames`) vs values that represent a computation (`canJump = coyoteFrames < 60`)
// ie direct vs indirect

// IDEA(bret): Nesting Loggers (at this point, would we combine the idea of a Log & a Logger, at least in some intermediate representation? If we build a tree, each item gets to override the settings of its parent, and then only nodes actually get added to the render queue) - the only issue is that if something has a VALUE and CHILDREN, it cannot be a NODE which is what determines what renders... it gets complicated fast :(

export type LogValue = any;

export type LogParser = (value: LogValue) => string;

export const YesNoLogParser = (value: LogValue) => {
	return value ? 'yes' : 'no';
};

// "Renderer" refers to how the text is rendered!
export type LogRenderer = (
	ctx: CanvasRenderingContext2D,
	log: Log,
	drawX: number,
	drawY: number,
) => void;

export interface LogOptions {
	lifespan: number;
	parser: LogParser;
	visible: boolean;
	// REVISIT(bret): Besides assigning a WarningRenderer or ErrorRenderer, would there be any way to tag a log to use a different sub-ruleset? IE, does the LogRenderer have two passes, one where it figures out its styles, and then another where it uses those computed styles to render?
	renderer: LogRenderer;
}

// REVISIT(bret): Look into structuredClone and the `transfer` option for duplicating the options between instances :)
export interface LoggerOptions {
	logs: {
		defaults: LogOptions;
	};
	// what would the logger itself have as options that don't propagate to the logs themselves? A border maybe? Colors themselves would get consumed by logs...
}

const defaultLoggerOptions = Object.freeze<LoggerOptions>({
	logs: {
		defaults: {
			lifespan: 60,
			parser: (val: LogValue) =>
				JSON.parse(JSON.stringify(val)).toString(),
			visible: true,
			renderer: (ctx, log, drawX, drawY) => {
				ctx.fillStyle = 'white';
				ctx.fillText(log.str, drawX, drawY);
			},
		},
	},
});

export class Log {
	#_value: LogValue;
	#_str: string = 'undefined';
	logger: Logger;
	elapsed: number;
	// CLEANUP(bret): is there any way to add these from LogOptions? Or vice-versa?
	lifespan: number;
	parser: LogParser;
	visible: boolean;
	renderer: LogRenderer;
	// CLEANUP_END

	constructor(
		logger: Logger,
		value: LogValue,
		options: Partial<LogOptions> = {},
	) {
		this.logger = logger;

		this.elapsed = 0;

		const { defaults } = logger.options.logs;
		this.lifespan = options.lifespan ?? defaults.lifespan;
		this.parser = options.parser ?? defaults.parser;
		this.visible = options.visible ?? defaults.visible; // FIXME(bret)
		this.renderer = options.renderer ?? defaults.renderer;

		this.value = value;
	}

	set value(val) {
		this.#_value = val;
		this.#_str = this.parser(val);
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
	options: LoggerOptions;
	logs: Log[];
	watched: Map<string, Log>;
	watchedDelimiter: string;

	constructor(x: number, y: number, options: Partial<LoggerOptions> = {}) {
		this.x = x;
		this.y = y;

		// REVISIT(bret): Make this generic :)
		// NOTE(bret): structuredClone would be neat here, but it cannot copy functions (perhaps the``transfer` option would help there?)
		this.options = Object.assign({}, defaultLoggerOptions);
		Object.assign(this.options.logs, options.logs);

		// REVISIT(bret): Do we need these? Could they just be getter/setters?
		// this.defaultLifespan = this.options.defaultLifespan;
		// this.defaultLogRenderer = this.options.defaultLogRenderer;
		this.logs = [];
		this.watched = new Map();
		this.watchedDelimiter = ': ';
	}

	setLogDefault<K extends keyof LogOptions>(key: K, value: LogOptions[K]) {
		this.options.logs.defaults[key] = value;
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
		// FIXME: handle this better
		const watched = Array.from(this.watched).filter(([_, v]) => v.visible);
		const logs = this.logs.filter((l) => l.visible);
		// FIXME(bret): Implement a proper hide/visible system :P
		const lines = watched.length + logs.length;
		if (lines === 0) return;

		let drawX = this.x,
			drawY = this.y;

		ctx.font = '10px Monospace';

		const glyph = ctx.measureText('0');
		const ascenderHeight = glyph.actualBoundingBoxAscent;

		const longestPrefix =
			watched
				.map(([k]) => k.length + this.watchedDelimiter.length)
				.sort((a, b) => b - a)[0] ?? 0;

		const longestLength =
			[
				watched.map(([_, log]) => longestPrefix + log.str.length),
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

		watched.forEach(([key, log]) => {
			if (!log.visible) return;

			let prefix = `${key}${this.watchedDelimiter}`;
			prefix += ' '.repeat(longestPrefix - prefix.length);
			ctx.fillStyle = '#e6e6e6';
			ctx.fillText(
				prefix,
				drawX + paddingX,
				drawY + paddingY + ascenderHeight,
			);

			const prefixWidth = ctx.measureText(prefix).width;
			log.renderer(
				ctx,
				log,
				drawX + paddingX + prefixWidth,
				drawY + paddingY + ascenderHeight,
			);

			drawY += textHeight;
		});

		ctx.fillStyle = 'white';
		logs.forEach((log) => {
			if (!log.visible) return;

			log.renderer(
				ctx,
				log,
				drawX + paddingX,
				drawY + paddingY + ascenderHeight,
			);

			drawY += textHeight;
		});
	}
}
