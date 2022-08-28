import Pagination from '@components/pagination';
import Card from '@components/submissions/card';
import SearchBar from '@components/submissions/search-bar';
import { OrderOperator } from '@models/beatmap';
import { ApprovalStatus, Submission, SubmissionsByPage } from '@models/submission';
import styles from '@styles/pages/submissions.module.scss';
import { serverSideProps, SESSION_COOKIE } from 'lib/session';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { ParsedUrlQuery } from 'querystring';

interface SubmissionsProps {
	filter?: keyof typeof ApprovalStatus;
	limit: number;
	order: keyof typeof OrderOperator;
	submissions: Submission[];
	title: string;
}

function Submissions({ filter, limit, order, submissions, title }: SubmissionsProps) {
	return (
		<>
			<SearchBar queryOrder={order} queryTitle={title} filter={filter ?? ''} />
			<div id={styles['submissions']}>
				{submissions.map((submission) => (
					<Card submission={submission} key={`submission=${submission.id}`} />
				))}
			</div>
			<Pagination limit={limit} />
		</>
	);
}

export async function getServerSideProps(
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<SubmissionsProps>> {
	const { filter, order, page, title } = parseParameters(context.query);
	if (context.req.cookies[SESSION_COOKIE] === undefined)
		return {
			redirect: {
				permanent: false,
				destination: '/login'
			}
		};
	const request = await fetch(
		`${
			typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL
		}/api/submission/page/${page}`,
		{
			method: 'POST',
			headers: {
				Cookie: context.req.headers.cookie ?? '',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				filter,
				order,
				title
			})
		}
	);
	const { submissions, limit }: SubmissionsByPage = request.ok
		? await request.json()
		: { submissions: [], limit: 1 };
	return {
		props: JSON.parse(
			JSON.stringify({
				submissions,
				limit,
				order,
				title,
				...(await serverSideProps(context, ['components/common', 'components/submissions']))
			})
		)
	};
}

Submissions.head = 'submissions';

export default Submissions;

export interface Search {
	filter?: keyof typeof ApprovalStatus;
	order: keyof typeof OrderOperator;
	page: number;
	title?: string;
}

function parseParameters(parameters: ParsedUrlQuery): Search {
	const filter =
		typeof parameters['filter'] === 'string' ? parseInt(parameters['filter']) : undefined;
	const order = parseInt(typeof parameters['order'] === 'string' ? parameters['order'] : '1');
	const page = parseInt(typeof parameters['page'] === 'string' ? parameters['page'] : '1');
	return {
		filter:
			filter === undefined || isNaN(filter)
				? undefined
				: (ApprovalStatus[filter] as keyof typeof ApprovalStatus),
		order: isNaN(order) ? 'descending' : (OrderOperator[order] as keyof typeof OrderOperator),
		page: isNaN(page) ? 1 : page,
		title: typeof parameters['title'] === 'string' ? parameters['title'] : undefined
	};
}
