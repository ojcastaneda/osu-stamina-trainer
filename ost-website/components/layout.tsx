import NavigationBar from '@components/navigation-bar';
import styles from '@styles/components/layout.module.scss';
import { ReactNode } from 'react';

interface LayoutProps {
	activeSession: boolean;
	children: ReactNode;
}

export default function Layout({ activeSession, children }: LayoutProps) {
	return (
		<>
			<NavigationBar activeSession={activeSession} />
			<main id={styles['page-content']}>
				<div>{children}</div>
			</main>
		</>
	);
}
