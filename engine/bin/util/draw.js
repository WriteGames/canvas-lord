// TODO(bret): Rounded rectangle https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
export const drawable = {
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 0,
    originY: 0,
    offsetX: 0,
    offsetY: 0,
};
const moveCanvas = (callback) => {
    return (ctx, options, x, y, ...args) => {
        const { offsetX = 0, offsetY = 0, angle = 0, originX = 0, originY = 0, scaleX = 1, scaleY = 1, } = Object.assign({}, drawable, options);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, scaleY);
        ctx.translate(offsetX, offsetY);
        if (angle !== 0) {
            ctx.translate(originX, originY);
            ctx.rotate((angle / 180) * Math.PI);
            ctx.translate(-originX, -originY);
        }
        ctx.translate(-x, -y);
        callback(ctx, options, x, y, ...args);
        ctx.restore();
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
                {
                    ctx.fillStyle = circle.color;
                    ctx.fill();
                }
                break;
            case 'stroke':
                {
                    ctx.strokeStyle = circle.color;
                    ctx.stroke();
                }
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
                {
                    ctx.fillStyle = rect.color;
                    ctx.fillRect(...args);
                }
                break;
            case 'stroke':
                {
                    ctx.strokeStyle = rect.color;
                    ctx.strokeRect(...args);
                }
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
    image: moveCanvas((ctx, image, drawX, drawY, sourceX, sourceY, width, height) => {
        const { imageSrc } = image;
        if (!imageSrc)
            return;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(imageSrc, sourceX, sourceY, width, height, drawX, drawY, width, height);
    }),
};
//# sourceMappingURL=draw.js.map