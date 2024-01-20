export const YesNoLogParser = (value) => {
    return value ? 'yes' : 'no';
};
const loggerDefaults = Object.freeze({
    // TODO: is there any way we could get the game FPS to determine this?
    defaultLifespan: 60,
    defaultLogRenderer: (ctx, log, drawX, drawY) => {
        ctx.fillStyle = 'white';
        ctx.fillText(log.str, drawX, drawY);
    },
});
const defaultLogParser = (val) => JSON.parse(JSON.stringify(val)).toString();
export class Log {
    #_value;
    #_str = 'undefined';
    logger;
    elapsed;
    lifespan;
    parser;
    renderer;
    constructor(logger, value, options = {}) {
        this.logger = logger;
        this.elapsed = 0;
        this.lifespan = options.lifespan ?? logger.defaultLifespan;
        this.parser = options.parser ?? defaultLogParser;
        this.renderer = options.renderer ?? logger.defaultLogRenderer;
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
    x;
    y;
    defaultLifespan;
    defaultLogRenderer;
    logs;
    watched;
    watchedDelimiter;
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        const resolvedOptions = Object.assign({}, loggerDefaults, options);
        this.defaultLifespan = resolvedOptions.defaultLifespan;
        this.defaultLogRenderer = resolvedOptions.defaultLogRenderer;
        this.logs = [];
        this.watched = new Map();
        this.watchedDelimiter = ': ';
    }
    log(str, options) {
        const log = new Log(this, str, options);
        this.logs.push(log);
    }
    watch(tag, initialValue, options) {
        const log = new Log(this, initialValue, options);
        this.watched.set(tag, log);
    }
    set(tag, value) {
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
    render(ctx) {
        const lines = this.watched.size + this.logs.length;
        if (lines === 0)
            return;
        let drawX = this.x, drawY = this.y;
        ctx.font = '10px Monospace';
        const glyph = ctx.measureText('0');
        const ascenderHeight = glyph.actualBoundingBoxAscent;
        const longestPrefix = Array.from(this.watched)
            .map(([k]) => k.length + this.watchedDelimiter.length)
            .sort((a, b) => b - a)[0] ?? 0;
        const longestLength = [
            Array.from(this.watched).map(([k, log]) => longestPrefix + log.str.length),
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
        ctx.fillRect(drawX, drawY, textWidth + paddingX * 2, textHeight * lines +
            paddingY * 2 -
            // for the first line, we only want the ascender height
            (textHeight - ascenderHeight));
        // text
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'white';
        this.watched.forEach((log, key) => {
            let prefix = `${key}${this.watchedDelimiter}`;
            prefix += ' '.repeat(longestPrefix - prefix.length);
            ctx.fillStyle = '#e6e6e6';
            ctx.fillText(prefix, drawX + paddingX, drawY + paddingY + ascenderHeight);
            const prefixWidth = ctx.measureText(prefix).width;
            log.renderer(ctx, log, drawX + paddingX + prefixWidth, drawY + paddingY + ascenderHeight);
            drawY += textHeight;
        });
        ctx.fillStyle = 'white';
        this.logs.forEach((log) => {
            log.renderer(ctx, log, drawX + paddingX, drawY + paddingY + ascenderHeight);
            drawY += textHeight;
        });
    }
}
//# sourceMappingURL=logger.js.map