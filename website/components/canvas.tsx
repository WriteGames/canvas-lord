'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

type Dimension = number | `${number}px`;

export const Canvas = ({
	id,
	src,
	width,
	height,
}: {
	id: string;
	src?: string;
	width: Dimension;
	height: Dimension;
}) => {
	const ref = useRef(false);

	useEffect(() => {
		if (ref.current) return;
		ref.current = true;

		const importGame = async () => {
			const module = await import(`@/examples/${src}`);
			const { initGames } = module;
			initGames(id, 'https://sandbox.canvaslord.com/');
		};

		if (src) {
			void importGame();
		}
	}, []);

	const widthInPx = typeof width === 'number' ? `${width}px` : width;
	const heightInPx = typeof height === 'number' ? `${height}px` : height;

	return (
		<canvas
			id={id}
			width={widthInPx}
			height={heightInPx}
			tabIndex={-1}
		></canvas>
	);
};

export default Canvas;
