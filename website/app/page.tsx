import Canvas from '@/components/canvas';

export default function Page() {
	return (
		<div>
			<h3>Basic Input</h3>
			<Canvas id="game-1" src="game1" />
			<h3>Coyote Time</h3>
			<Canvas id="game-2" src="game2" />
			<h3>Input Buffering</h3>
			<Canvas id="game-3" src="game3" />
		</div>
	);
}
