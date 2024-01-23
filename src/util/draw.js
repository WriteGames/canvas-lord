const drawable = {
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
        const { originX, originY, angle, scaleX, scaleY } = Object.assign({}, options, drawable);
        ctx.save();
        ctx.translate(originX, originY);
        ctx.translate(x, y);
        ctx.rotate((angle / 180) * Math.PI);
        ctx.translate(-x, -y);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-originX, -originY);
        callback(ctx, options, x / scaleX, y / scaleY, ...args);
        ctx.restore();
    };
};
export const Draw = {
    circle: moveCanvas((ctx, circle, x, y, radius) => {
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
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
    image: moveCanvas((ctx, image, drawX, drawY, sourceX, sourceY, width, height) => {
        const { imageSrc } = image;
        if (!imageSrc)
            return;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(imageSrc, sourceX, sourceY, width, height, drawX, drawY, width, height);
        ctx.restore();
    }),
};
//# sourceMappingURL=draw.js.map