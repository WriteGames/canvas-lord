import '../../styles/reset.css';
import '../../styles/global.css';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
	title: 'Canvas Lord',
};

export const viewport: Viewport = {
	colorScheme: 'dark light',
};

interface ChildProps {
	selected?: boolean;
	children?: React.ReactNode;
}

function Child({ selected, children }: ChildProps) {
	const className = ['item', selected && 'selected'].filter(Boolean).join(' ');
	return (
		<li>
			<a href="./test" className={className}>
				{children}
			</a>
		</li>
	);
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="container layout">
			<main className="two-column">
				<aside>
					<nav>
						<ul>
							<Child selected>Getting Started</Child>
							<Child>Graphics</Child>
							<Child>Input</Child>
							{/* <Child>Test 4</Child> */}
						</ul>
					</nav>
				</aside>
				<article>{children}</article>
			</main>
		</div>
	);
}
