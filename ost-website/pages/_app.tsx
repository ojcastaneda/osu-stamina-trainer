import Layout from '@components/layout';
import '@styles/globals.scss';
import type { AppProps } from 'next/app';
import { appWithTranslation, useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import NavigationBar from '@components/navigation-bar';
import Head from 'next/head';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MyAppProps = AppProps<any> & {
	Component: NextPage & {
		useCustomLayout?: boolean;
		head: string;
	};
};

function MyApp({ Component, pageProps }: MyAppProps) {
	const { t } = useTranslation('common');

	const head = (
		<Head>
			<title>{`${t(Component.head)} - osu! Stamina Trainer`}</title>
			<meta content={t(`${Component.head}_description`)} name="description" />
		</Head>
	);

	return !Component.useCustomLayout ? (
		<Layout activeSession={pageProps.activeSession}>
			{head}
			<Component {...pageProps} />
		</Layout>
	) : (
		<>
			{head}
			<NavigationBar activeSession={pageProps.activeSession} />
			<Component {...pageProps} />
		</>
	);
}

export default appWithTranslation(MyApp);
