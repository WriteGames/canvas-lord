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
};
const moveCanvas = (callback) => {
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
    circle: moveCanvas((ctx, circle, x, y, radius) => {
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        // TODO: make this be able to be centered :O
        // It could be good to pass an option that dictates whether or not to center it :)
        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
        switch (circle.type) {
            case 'fill':
                ctx.fillStyle = circle.color;
                ctx.fill();
                break;
            case 'stroke':
                ctx.strokeStyle = circle.color;
                ctx.stroke();
                break;
        }
    }),
    line: moveCanvas((ctx, options, x1, y1, x2, y2) => {
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }),
    rect: moveCanvas((ctx, rect, x, y, w, h) => {
        ctx.translate(0.5, 0.5);
        const args = [x, y, w, h];
        switch (rect.type) {
            case 'fill':
                ctx.fillStyle = rect.color;
                ctx.fillRect(...args);
                break;
            case 'stroke':
                ctx.strokeStyle = rect.color;
                ctx.strokeRect(...args);
                break;
        }
    }),
    polygon: moveCanvas((ctx, 
    // TODO(bret): actually set up the correct type here
    options, x, y, _points) => {
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
                ctx.fillStyle = options.color;
                ctx.fill();
                break;
            case 'stroke':
                ctx.strokeStyle = options.color;
                ctx.stroke();
                break;
        }
    }),
    image: moveCanvas((ctx, image, drawX = 0, drawY = 0, sourceX, sourceY, width, height) => {
        const { imageSrc } = image;
        if (!imageSrc)
            return;
        ctx.imageSmoothingEnabled = false;
        const _width = width ?? imageSrc.width;
        const _height = height ?? imageSrc.height;
        ctx.drawImage(imageSrc, sourceX ?? 0, sourceY ?? 0, _width, _height, drawX, drawY, _width, _height);
    }),
    // TODO(bret): This breaks if the width is too small :(
    // TODO(bret): Condense some of this down
    text: moveCanvas((ctx, text, drawX, drawY, str) => {
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
        if (!text.width) {
            ctx[func](str, drawX, drawY);
            return;
        }
        if (text.width <= 0)
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
        const maxWidth = text.width;
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