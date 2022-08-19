import { Html, Head, Main, NextScript } from 'next/document';

export default function MyDocument() {
	return (
		<Html>
			<Head>
				<link
					href="https://fonts.googleapis.com/css2?family=Noto+Sans&family=Noto+Serif&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
