/* Canvas Lord v0.6.1 */

export type Canvas = HTMLCanvasElement | OffscreenCanvas;
export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

type Response =
	| {
			canvas: null;
			ctx: null;
	  }
	| {
			canvas: HTMLCanvasElement;
			ctx: CanvasRenderingContext2D | null;
	  }
	| {
			canvas: OffscreenCanvas;
			ctx: OffscreenCanvasRenderingContext2D | null;
	  };

export const generateCanvasAndCtx = (
	width = 1,
	height = 1,
	options?: CanvasRenderingContext2DSettings,
): Response => {
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
