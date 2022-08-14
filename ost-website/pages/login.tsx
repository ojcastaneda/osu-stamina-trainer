import styles from '@styles/pages/login.module.scss';
import { ServerSideProps, serverSideProps } from 'lib/session';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';

enum Error {
	IncorrectCredentials,
	UnexpectedError
}

function Login() {
	const { t } = useTranslation('pages/login');
	const router = useRouter();
	const [error, setError] = useState<undefined | Error>();
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');

	async function login() {
		const request = await fetch(
			`${typeof window !== 'undefined' ? '' : process.env.API_URL}/api/authentication/login`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					password,
					username
				})
			}
		);
		if (request.ok) return router.push('/submissions');
		if (request.status === 401) return setError(Error.IncorrectCredentials);
		setError(Error.UnexpectedError);
	}

	return (
		<main id={styles['page-content']}>
			<form id={styles['log-in']} onSubmit={(event) => event.preventDefault()}>
				<h1>{t('administrator_only')}</h1>
				<div>
					<input
						className={error === Error.IncorrectCredentials ? 'error' : ''}
						onChange={({ target }) => setUsername(target.value)}
						placeholder={t('username')}
						size={20}
						value={username}
					/>
				</div>
				<div>
					<input
						className={error === Error.IncorrectCredentials ? 'error' : ''}
						onChange={({ target }) => setPassword(target.value)}
						placeholder={t('password')}
						size={20}
						type="password"
						value={password}
					/>
					{error !== undefined && <span className="error">{t(`error_${error}`)}.</span>}
				</div>
				<div>
					<button disabled={!password || !username} onClick={login}>
						{t('login')}
					</button>
				</div>
			</form>
		</main>
	);
}

Login.useCustomLayout = true;

Login.head = 'login';

export default Login;

export async function getServerSideProps(
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<ServerSideProps>> {
	return {
		props: await serverSideProps(context, ['pages/login'])
	};
}
