'use client';

// @ts-ignore
import '../../src/canvas-lord';

import styles from './canvas-lord.module.css';

interface CanvasProps {
	id: string;
}

function Canvas({ id }: CanvasProps): JSX.Element {
	return (
		<canvas
			id={id}
			className={styles['canvas-lord-canvas']}
			tabIndex={-1}
			width="320px"
			height="180px"
		/>
	);
}

export function CanvasLord(): JSX.Element {
	const onClick = (): void => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		(global as any).initGames?.();
	};

	return (
		<div className={styles.wrapper}>
			<button type="button" onClick={onClick}>
				Init Games
			</button>

			<Canvas id="basic" />
			{/* <Canvas id="second" width={320} height={180} style={canvasStyle} /> */}
			<Canvas id="line-segment" />
			<Canvas id="contour-tracing" />
		</div>
	);
}
