import { GetServerSidePropsContext } from 'next';
import { SSRConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const SESSION_COOKIE = 'ost-session';

export type ServerSideProps = SSRConfig & { activeSession: boolean };

export async function serverSideProps(
	{ defaultLocale = 'en', locale, req }: GetServerSidePropsContext,
	namespaces: string[]
): Promise<ServerSideProps> {
	namespaces.push('common');
	return {
		...(await serverSideTranslations(locale ?? defaultLocale, namespaces)),
		activeSession: !!req.cookies[SESSION_COOKIE]
	};
}
