import Canvas from '@/components/canvas';
import _dynamic from 'next/dynamic';
import fs from 'fs/promises';
import path from 'path';

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
	// const posts = await fetch('https://.../posts').then((res) => res.json())

	const outPath = 'out';
	return (await fs.readdir(outPath))
		.filter(async (dir) => {
			const filePath = path.join(outPath, dir);
			const stat = await fs.stat(filePath);
			return stat.isDirectory();
		})
		.map((slug) => ({ slug }));
}

interface PageProps {
	params: { slug: string };
}

export default async function Page({ params }: PageProps) {
	const { slug } = params;

	const Content: React.ComponentType<{
		components: {
			[key: string]: React.FC<any>;
		};
	}> = _dynamic(() => import(`@/out/${slug}/content.mdx`), {
		ssr: true,
	});
	if (!Content) return null;

	return (
		<div>
			<Content components={{ Canvas }} />
		</div>
	);
}
