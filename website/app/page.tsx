import Canvas from '@/components/canvas';

export default function Page() {
	return (
		<div>
			<h3>Basic Input</h3>
			<Canvas id="game-1" src="game1" width={320} height={180} pixel />
			<h3>Coyote Time</h3>
			<Canvas id="game-2" src="game2" width={320} height={180} pixel />
			<h3>Input Buffering</h3>
			<Canvas id="game-3" src="game3" width={320} height={180} pixel />
		</div>
	);
}
