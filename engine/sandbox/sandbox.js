import { AssetManager, Game } from '../bin/main.js';

const sandboxContainer = document.getElementById('sandbox') ?? document.body;

// DECIDE(bret): Might want to define this on the window so it can be overridden
const defaultAttr = {
	width: 640,
	height: 320,
	tabindex: -1,
};

const initGame = (
	id,
	Scene,
	{ sceneArgs = [], attr, onStart, gameSettings, remove = true } = {},
) => {
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

	if (remove) {
		canvasElem.remove();
		sandboxContainer.append(canvasElem);
	}

	return {
		id,
		Scene,
		sceneArgs,
		gameSettings,
		onStart,
		canvas: canvasElem,
	};
};

const startGame = (
	{ id, Scene, sceneArgs = [], onStart, gameSettings = {} },
	assetManager,
) => {
	const game = new Game(id, {
		assetManager,
		gameLoopSettings: {
			updateMode: 'focus',
			renderMode: 'onUpdate',
		},
		...gameSettings,
	});

	const scene = new Scene(game, ...sceneArgs);
	game.pushScene(scene);
	if (onStart) game.onInit.add(onStart);
	game.start();

	return game;
};

export const init = ({ games, assetSrc, assets, onLoad }) => {
	let loaded = false;
	if (!assetSrc) {
		const _games = games.map((game) => startGame(game));
		onLoad?.(_games);
		return {};
	}

	const assetManager = new AssetManager(assetSrc);
	assets?.images?.forEach((asset) => assetManager.addImage(asset));
	assets?.audio?.forEach((asset) => assetManager.addAudio(asset));
	assetManager.onLoad.add(() => {
		if (loaded) return;
		loaded = true;

		const _games = games.map((game) => startGame(game, assetManager));
		onLoad?.(_games);
	});
	assetManager.loadAssets();
	return { assetManager };
};

init.game = initGame;
