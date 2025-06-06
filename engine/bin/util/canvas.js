/* Canvas Lord v0.6.0 */
export const generateCanvasAndCtx = (width = 1, height = 1, options) => {
    if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(width, height);
        return { canvas, ctx: canvas.getContext('2d', options) };
    }
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return { canvas, ctx: canvas.getContext('2d', options) };
    }
    return { canvas: null, ctx: null };
};
//# sourceMappingURL=canvas.js.map