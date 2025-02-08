/* Canvas Lord v0.5.3 */
export const YesNoLogParser = (value) => {
    return value ? 'yes' : 'no';
};
const defaultLoggerOptions = Object.freeze({
    logs: {
        defaults: {
            lifespan: 60,
            parser: (val) => JSON.parse(JSON.stringify(val)).toString(),
            visible: true,
            renderer: (ctx, log, drawX, drawY) => {
                ctx.fillStyle = 'white';
                ctx.fillText(log.str, drawX, drawY);
            },
        },
    },
});
export class Log {
    #_value;
    #_str = 'undefined';
    logger;
    elapsed;
    // CLEANUP(bret): is there any way to add these from LogOptions? Or vice-versa?
    lifespan;
    parser;
    visible;
    renderer;
    // CLEANUP_END
    constructor(logger, value, options = {}) {
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
    x;
    y;
    options;
    logs;
    watched;
    watchedDelimiter;
    constructor(x, y, options = {}) {
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
    setLogDefault(key, value) {
        this.options.logs.defaults[key] = value;
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
        // FIXME: handle this better
        const watched = Array.from(this.watched).filter(([_, v]) => v.visible);
        const logs = this.logs.filter((l) => l.visible);
        // FIXME(bret): Implement a proper hide/visible system :P
        const lines = watched.length + logs.length;
        if (lines === 0)
            return;
        let drawX = this.x, drawY = this.y;
        ctx.font = '10px Monospace';
        const glyph = ctx.measureText('0');
        const ascenderHeight = glyph.actualBoundingBoxAscent;
        const longestPrefix = watched
            .map(([k]) => k.length + this.watchedDelimiter.length)
            .sort((a, b) => b - a)[0] ?? 0;
        const longestLength = [
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
        ctx.fillRect(drawX, drawY, textWidth + paddingX * 2, textHeight * lines +
            paddingY * 2 -
            // for the first line, we only want the ascender height
            (textHeight - ascenderHeight));
        // text
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'white';
        watched.forEach(([key, log]) => {
            if (!log.visible)
                return;
            let prefix = `${key}${this.watchedDelimiter}`;
            prefix += ' '.repeat(longestPrefix - prefix.length);
            ctx.fillStyle = '#e6e6e6';
            ctx.fillText(prefix, drawX + paddingX, drawY + paddingY + ascenderHeight);
            const prefixWidth = ctx.measureText(prefix).width;
            log.renderer(ctx, log, drawX + paddingX + prefixWidth, drawY + paddingY + ascenderHeight);
            drawY += textHeight;
        });
        ctx.fillStyle = 'white';
        logs.forEach((log) => {
            if (!log.visible)
                return;
            log.renderer(ctx, log, drawX + paddingX, drawY + paddingY + ascenderHeight);
            drawY += textHeight;
        });
    }
}
//# sourceMappingURL=logger.js.map