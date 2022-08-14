import Layout from '@components/layout';
import '@styles/globals.scss';
import type { AppProps } from 'next/app';
import { appWithTranslation, useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import NavigationBar from '@components/navigation-bar';
import Head from 'next/head';

type MyAppProps = AppProps & {
	Component: NextPage & {
		useCustomLayout?: boolean;
		head: string;
	};
};

function MyApp({ Component, pageProps }: MyAppProps) {
	const { t } = useTranslation('common');

	return !Component.useCustomLayout ? (
		<Layout activeSession={pageProps.activeSession}>
			<Head>
				<title>{`${t(Component.head)} - osu! Stamina Trainer`}</title>
			</Head>
			<Component {...pageProps} />
		</Layout>
	) : (
		<>
			<Head>
				<title>{`${t(Component.head)} - osu! Stamina Trainer`}</title>
			</Head>
			<NavigationBar activeSession={pageProps.activeSession} />
			<Component {...pageProps} />
		</>
	);
}

export default appWithTranslation(MyApp);
