import '../styles/reset.css';
import '../styles/global.css';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
	title: 'Canvas Lord',
};

export const viewport: Viewport = {
	colorScheme: 'dark light',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html>
			<head />
			<body>
				<div className="container layout">
					<header>
						<h1>CanvasLord.com</h1>
					</header>
					<main>{children}</main>
					<footer>
						<div>
							Copyright &copy; {new Date().getFullYear()} CanvasLord.com
						</div>
					</footer>
				</div>
			</body>
		</html>
	);
}
