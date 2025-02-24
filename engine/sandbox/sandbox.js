import { AssetManager, Game } from '../bin/canvas-lord.js';

const sandboxContainer = document.getElementById('sandbox') ?? document.body;

const defaultAttr = {
	width: 640,
	height: 320,
	tabindex: -1,
};

export const init = ({ games, assetSrc, assets }) => {
	let loaded = false;

	const ids = games.map(({ id }) => id);
	const scenes = games.map(({ Scene }) => Scene);

	const assetManager = new AssetManager(assetSrc);
	assets?.images?.forEach((asset) => assetManager.addImage(asset));
	assets?.audio?.forEach((asset) => assetManager.addAudio(asset));
	assetManager.onLoad(() => {
		if (loaded) return;
		loaded = true;

		ids.forEach((id, i) => {
			const game = new Game(id, {
				assetManager,
				gameLoopSettings: {
					updateMode: 'focus',
					renderMode: 'onUpdate',
				},
			});

			const scene = new scenes[i](game);
			game.pushScene(scene);

			game.render();
		});
	});
	assetManager.loadAssets();
	return { assetManager };
};

init.game = (id, Scene, attr) => {
	let canvasElem = document.getElementById(id);
	canvasElem ??= document.createElement('canvas');

	const attribs = {
		id: id,
		...Object.assign({}, defaultAttr, attr ?? {}),
	};

	Object.entries(attribs).forEach(([attr, value]) => {
		if (!canvasElem.hasAttribute(attr))
			canvasElem.setAttribute(attr, value);
	});

	canvasElem.remove();
	sandboxContainer.append(canvasElem);

	return {
		id,
		Scene,
		canvas: canvasElem,
	};
};
