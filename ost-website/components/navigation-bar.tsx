import styles from '@styles/components/navigation-bar.module.scss';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChangeEvent, useEffect, useState } from 'react';
import { FaBars, FaDiscord, FaGithub, FaMoon, FaPatreon, FaSun } from 'react-icons/fa';
import { MdTranslate } from 'react-icons/md';

type Themes = 'dark' | 'light';

interface NavigationBarProps {
	activeSession: boolean;
}

export default function NavigationBar({ activeSession }: NavigationBarProps) {
	const [darkTheme, setDarkTheme] = useState<Themes>('dark');
	const { t } = useTranslation('common');
	const [expanded, setExpanded] = useState<boolean>(false);
	const router = useRouter();

	useEffect(() => {
		setExpanded(false);
		if (typeof window === 'undefined') return;
		const newTheme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
		changeTheme(newTheme);
		setDarkTheme(newTheme);
	}, [router.asPath]);

	function changeTheme(newTheme: Themes) {
		const [body] = document.getElementsByTagName('body');
		if (newTheme === 'light') {
			body.classList.add('light-theme');
			localStorage.setItem('theme', 'light');
			return;
		}
		localStorage.setItem('theme', 'dark');
		body.classList.remove('light-theme');
		return;
	}

	function changeLanguage({ target }: ChangeEvent<HTMLSelectElement>) {
		if (!target.value) return;
		router.push(router.asPath, router.asPath, { locale: target.value });
	}

	function switchTheme() {
		setDarkTheme((previousState) => {
			const newTheme = previousState === 'dark' ? 'light' : 'dark';
			changeTheme(newTheme);
			return newTheme;
		});
	}

	return (
		<>
			<div
				className={styles[expanded ? '' : 'hidden']}
				id={styles['mobile-menu-blackout']}
				onClick={() => setExpanded(false)}
			/>
			<nav id={styles['navigation-bar']}>
				<div>
					<div id={styles['navigation-bar-main']}>
						<Link href="/">
							<a id={styles['logo']}>osu! Stamina Trainer</a>
						</Link>
						<div id={styles['mobile-menu']}>
							<button onClick={() => setExpanded(!expanded)}>
								<FaBars size={25} />
							</button>
						</div>
					</div>
					<div id={styles['navigation-bar-left']} className={expanded ? '' : styles['hidden']}>
						<Link href="/">{t('collection')}</Link>
						<Link href="/commands">{t('bot_commands')}</Link>
						<Link href="/submit">{t('submit_beatmaps')}</Link>
						{activeSession && <Link href="/submissions">{t('submissions')}</Link>}
					</div>
					<div id={styles['navigation-bar-right']} className={expanded ? '' : styles['hidden']}>
						<Link href={process.env.DISCORD_URL ?? '/'}>
							<a target="_blank">
								<FaDiscord size={25} />
							</a>
						</Link>
						<Link href={process.env.GITHUB_URL ?? '/'}>
							<a target="_blank">
								<FaGithub size={25} />
							</a>
						</Link>
						<Link href={process.env.PATREON_URL ?? '/'}>
							<a target="_blank">
								<FaPatreon size={25} />
							</a>
						</Link>
						<div id={styles['languages']}>
							<span>
								<MdTranslate size={20} />
							</span>
							<select onChange={changeLanguage}>
								<option value="">{t('language')}</option>
								<option value="en">English</option>
								<option value="es">Español</option>
							</select>
						</div>
						<button id={styles['theme-button']} onClick={switchTheme}>
							<div>{darkTheme === 'dark' ? <FaMoon size={20} /> : <FaSun size={20} />}</div>
							<div>Theme</div>
						</button>
					</div>
				</div>
			</nav>
		</>
	);
}
