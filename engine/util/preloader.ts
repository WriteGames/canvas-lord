import type { AssetManager } from '../core/asset-manager.js';
import { Scene } from '../core/scene.js';
import type { Ctx } from '../main.js';
import { Draw } from './draw.js';

export class Preloader extends Scene {
	assetManager: AssetManager;

	constructor(assetManager?: AssetManager) {
		super();

		this.backgroundColor = 'purple';

		if (!assetManager) throw new Error('Needs asset manager');

		this.assetManager = assetManager;
	}

	render(ctx: Ctx): void {
		const canvasW = this.engine.width;
		const canvasH = this.engine.height;

		const centerX = canvasW / 2;
		const centerY = canvasH / 2;

		const width = Math.round(this.engine.width * 0.75);
		const halfW = width / 2;

		const height = 20;
		const halfH = height / 2;

		Draw.rect(
			ctx,
			{
				color: 'white',
				type: 'stroke',
			},
			centerX - halfW,
			centerY - halfH,
			width,
			height,
		);

		Draw.rect(
			ctx,
			{
				color: 'white',
				type: 'fill',
			},
			centerX - halfW,
			centerY - halfH,
			width * this.assetManager.progress,
			height,
		);

		const percent = Math.round(this.assetManager.percent);

		Draw.text(
			ctx,
			{
				color: 'white',
				type: 'fill',
				align: 'center',
			},
			centerX,
			centerY + Math.round(height * 0.75),
			`${percent}%`,
		);
	}
}
