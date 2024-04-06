'use client';

import hljs from 'highlight.js';
import { useEffect, useRef } from 'react';

import styles from './code-snippet.module.css';

const code = `
		const leftKeys = ['ArrowLeft', 'a', 'A'];
		const rightKeys = ['ArrowRight', 'd', 'D'];
		const jumpKeys = [' ', 'ArrowUp', 'w', 'W', 'z', 'Z'];
`.slice(1, -1);

export const CodeSnippet = () => {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		if (ref.current) {
			hljs.highlightElement(ref.current);
		}
	});

	return (
		<pre className={styles.wrapper}>
			<code
				className="language-javascript hljs"
				ref={ref}
				dangerouslySetInnerHTML={{ __html: code }}
			/>
		</pre>
	);
};
