import Canvas from '@/components/canvas';
import _dynamic from 'next/dynamic';
import fs from 'fs/promises';
import path from 'path';

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
	// const posts = await fetch('https://.../posts').then((res) => res.json())

	return [{ slug: 'test' }];
}

interface PageProps {
	params: { slug: string };
}

export default async function Page({ params }: PageProps) {
	const { slug } = params;
	const Content = _dynamic(() => import(`./${slug}.mdx`), {
		ssr: true,
	});
	if (!Content) return null;

	return <Content components={{ Canvas }} />;
}
