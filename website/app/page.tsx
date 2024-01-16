import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('../components/canvas'), {
	loading: () => <p>Loading...</p>,
	ssr: false,
});

export default function Page() {
	return (
		<div>
			<Canvas id="testing" />
		</div>
	);
}
