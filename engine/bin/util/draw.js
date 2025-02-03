/* Canvas Lord v0.5.1 */
// TODO(bret): Rounded rectangle https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
export const drawable = {
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 0,
    originY: 0,
    offsetX: 0,
    offsetY: 0,
    alpha: 1,
    color: undefined,
};
let tempCanvas;
let tempCtx;
const initTempCanvas = (ctx) => {
    if (tempCanvas)
        return;
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = ctx.canvas.width;
    tempCanvas.height = ctx.canvas.height;
    const _ctx = tempCanvas.getContext('2d');
    if (!_ctx)
        throw new Error();
    tempCtx = _ctx;
};
// TODO(bret): un-export this!
export const moveCanvas = (callback) => {
    return (ctx, options, x, y, ...args) => {
        const { offsetX = 0, offsetY = 0, angle = 0, originX = 0, originY = 0, scaleX = 1, scaleY = 1, alpha = 1, } = Object.assign({}, drawable, options);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, scaleY);
        ctx.translate(offsetX, offsetY);
        if (angle !== 0) {
            ctx.translate(-originX, -originY);
            ctx.rotate((angle / 180) * Math.PI);
            ctx.translate(originX, originY);
        }
        if (alpha < 1)
            ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(-x, -y);
        const res = callback(ctx, options, x, y, ...args);
        ctx.restore();
        return res;
    };
};
export const Draw = {
    circle: moveCanvas((ctx, options, x, y, radius) => {
        initTempCanvas(ctx);
        const color = options.color ?? 'magenta';
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        // TODO: make this be able to be centered :O
        // It could be good to pass an option that dictates whether or not to center it :)
        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
        switch (options.type) {
            case 'fill':
                ctx.fillStyle = color;
                ctx.fill();
                break;
            case 'stroke':
                ctx.strokeStyle = color;
                ctx.stroke();
                break;
        }
    }),
    line: moveCanvas((ctx, options, x1, y1, x2, y2) => {
        initTempCanvas(ctx);
        if (options.color)
            ctx.strokeStyle = options.color;
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }),
    rect: moveCanvas((ctx, options, x, y, w, h) => {
        initTempCanvas(ctx);
        const color = options.color ?? 'magenta';
        ctx.translate(0.5, 0.5);
        const args = [x, y, w, h];
        switch (options.type) {
            case 'fill':
                ctx.fillStyle = color;
                ctx.fillRect(...args);
                break;
            case 'stroke':
                ctx.strokeStyle = color;
                ctx.strokeRect(...args);
                break;
        }
    }),
    polygon: moveCanvas((ctx, options, x, y, _points) => {
        initTempCanvas(ctx);
        const color = options.color ?? 'magenta';
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        const n = _points.length;
        const points = _points.map(([_x, _y]) => [x + _x, y + _y]);
        ctx.moveTo(...points[n - 1]);
        for (let i = 0; i < n; ++i) {
            ctx.lineTo(...points[i]);
        }
        switch (options.type) {
            case 'fill':
                ctx.fillStyle = color;
                ctx.fill();
                break;
            case 'stroke':
                ctx.strokeStyle = color;
                ctx.stroke();
                break;
        }
    }),
    image: moveCanvas((ctx, options, drawX = 0, drawY = 0, sourceX, sourceY, width, height) => {
        initTempCanvas(ctx);
        const color = options.color ?? 'magenta';
        const { imageSrc } = options;
        if (!imageSrc)
            return;
        // TODO(bret): Expose this at the image level (and default to a global setting in Game!)
        ctx.imageSmoothingEnabled = false;
        const x = sourceX ?? 0;
        const y = sourceY ?? 0;
        const _width = width ?? imageSrc.width;
        const _height = height ?? imageSrc.height;
        if (_width <= 0 || _height <= 0)
            return;
        tempCtx.canvas.width = _width;
        tempCtx.canvas.height = _height;
        tempCtx.save();
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(imageSrc, x, y, _width, _height, 0, 0, _width, _height);
        if (options.color) {
            const { blend } = options;
            tempCtx.globalCompositeOperation = blend
                ? 'multiply'
                : 'source-in';
            tempCtx.fillStyle = options.color;
            // TODO(bret): Add ability to resize the rect :O
            tempCtx.fillRect(0, 0, _width, _height);
            if (blend) {
                tempCtx.globalCompositeOperation = 'destination-in';
                tempCtx.drawImage(imageSrc, x, y, _width, _height, 0, 0, _width, _height);
            }
        }
        tempCtx.restore();
        ctx.drawImage(tempCanvas, drawX, drawY);
    }),
    // TODO(bret): This breaks if the width is too small :(
    // TODO(bret): Condense some of this down
    text: moveCanvas((ctx, text, drawX, drawY, str) => {
        initTempCanvas(ctx);
        const { color, type, font = 'sans-serif', size = 10, align = 'left', baseline = 'top', // TODO(bret): check if this is the default we want :/
        count, } = text;
        const _size = typeof size === 'number' ? `${size}px` : size;
        ctx.font = `${_size} ${font}`;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        let func;
        switch (type) {
            case 'fill':
                ctx.fillStyle = color;
                func = 'fillText';
                break;
            case 'stroke':
                ctx.strokeStyle = color;
                func = 'strokeText';
                break;
        }
        if (!text.maxWidth) {
            let _str = str;
            if (count !== undefined)
                _str = str.slice(0, count);
            ctx[func](_str, drawX, drawY);
            return;
        }
        if (text.maxWidth <= 0)
            return 0;
        const words = str.split(' ').map((str) => ({
            str,
            width: ctx.measureText(str).width,
            space: true,
            x: -1,
            y: -1,
        }));
        const metrics = ctx.measureText('');
        // TODO: add ability for padding between lines
        const lineHeightPx = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        let wordX = 0;
        let wordY = 0;
        let rows = 1;
        const { maxWidth } = text;
        const space = ctx.measureText(' ');
        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            if (wordX && wordX + word.width > maxWidth) {
                wordX = 0;
                wordY += lineHeightPx;
                ++rows;
            }
            if (word.width > maxWidth) {
                for (let j = 1; j < words.length; ++j) {
                    const str = word.str.substring(0, word.str.length - j);
                    const metrics = ctx.measureText(str);
                    if (str.length === 1 || metrics.width <= maxWidth) {
                        const truncated = word.str.substring(word.str.length - j);
                        word.str = str;
                        word.width = metrics.width;
                        word.space = false;
                        const newWord = {
                            str: truncated,
                            width: ctx.measureText(truncated).width,
                            space: true,
                            x: -1,
                            y: -1,
                        };
                        words.splice(i + 1, 0, newWord);
                        break;
                    }
                }
            }
            word.x = wordX;
            word.y = wordY;
            wordX += word.width + space.width;
        }
        let lettersLeft = count !== undefined
            ? Math.clamp(count, 0, str.length)
            : str.length;
        for (let i = 0; lettersLeft > 0 && i < words.length; ++i) {
            const { x, y, str, space } = words[i];
            const _str = str.length > lettersLeft
                ? str.substring(0, lettersLeft)
                : str;
            ctx[func](_str, drawX + x, drawY + y);
            if (count) {
                lettersLeft -= str.length;
                if (space)
                    --lettersLeft;
            }
        }
        const m = ctx.measureText('W');
        const diff = m.fontBoundingBoxDescent +
            m.fontBoundingBoxAscent -
            m.actualBoundingBoxDescent -
            m.actualBoundingBoxAscent;
        return rows * lineHeightPx - diff;
    }),
};
//# sourceMappingURL=draw.js.map