'use client';

import { useEffect, useRef } from 'react';

export const Canvas = ({ id, src }: { id: string; src: string }) => {
	const ref = useRef(false);

	useEffect(() => {
		if (ref.current) return;
		ref.current = true;

		const importGame = async () => {
			const module = await import(`@/examples/${src}`);
			const { initGames } = module;
			initGames(id, 'http://canvas-lord.localhost/');
		};

		void importGame();
	}, []);

	return <canvas id={id} width="320px" height="180px" tabIndex={-1}></canvas>;
};

export default Canvas;
