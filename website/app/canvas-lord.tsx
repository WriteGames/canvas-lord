'use client';

// @ts-ignore
import '../../canvas-lord';

// eslint-disable-next-line import/no-default-export
export default function CanvasLord(): JSX.Element {
	const what = 'what';

	const onClick = (): void => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		(global as unknown as any).initGames?.();
	};

	const width = 320;
	const height = 180;
	const scale = 2;

	const canvasProps = {
		width,
		height,
		style: {
			border: '1px solid black',
			backgroundColor: '#202020',
			display: 'block',
			marginBlock: '0.5rem',
			width: `${width * scale}px`,
			height: `${height * scale}px`,
			imageRendering: 'pixelated',
		},
	};

	return (
		<>
			<button type="button" onClick={onClick}>
				Init Games
			</button>
			<div>
				{/* @ts-ignore */}
				<canvas tabIndex={0} id="basic" {...canvasProps} />
				{/* <canvas id="second" width={320} height={180} style={canvasStyle} /> */}
				{/* @ts-ignore */}
				<canvas tabIndex={0} id="line-segment" {...canvasProps} />
				{/* @ts-ignore */}
				<canvas tabIndex={0} id="contour-tracing" {...canvasProps} />
			</div>
		</>
	);
}
