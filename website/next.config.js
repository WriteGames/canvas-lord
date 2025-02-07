import nextMDX from '@next/mdx';

const withMDX = nextMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
	experimental: {
		mdxRs: true,
	},
};

export default withMDX(nextConfig);
