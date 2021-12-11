import { ITask, txMode } from 'pg-promise';
import Database from './database';
import Filter from './filter';
import Sort from './sort';

/**
 * Class that represents the users beatmap's submissions
 */
class Submission {
	/**
	 * The only string or boolean properties that are allowed as filters for retrieving submissions
	 * @private
	 */
	private static stringFilters: string[] = ['approved_status'];

	/**
	 * The only numeric properties that are allowed as filters for retrieving submissions
	 * @private
	 */
	private static numericFilters: string[] = ['id'];

	/**
	 * The submission's ID
	 */
	public id?: number;

	/**
	 * The submission's approval status in the collection ('pending', 'pending_approved', 'pending_honored', 'approved', 'honored')
	 */
	public approved_status?: string;

	/**
	 * The submission's date when the last modification was registered
	 */
	public last_updated?: Date;

	/**
	 * Creates a submission in the database based on a submission instance
	 *
	 * @param submission - The submission instance with all the values expected by the database
	 * @returns An empty promise
	 */
	public static createSubmission = async (submission: Submission): Promise<void> => {
		const { id } = submission;
		await Database.client.none(`INSERT INTO table_submissions (id) VALUES ($1)`, [id]);
	};

	/**
	 * Retrieves a submission from the database composed by the specified properties that matches the provided ID
	 *
	 * @param id - The ID of the submission requested
	 * @param properties - The properties that are expected to be part of the returned submission
	 * @returns A promise of the requested submission or undefined if not found
	 */
	public static retrieveSubmission = async (id: number, properties: string[] = ['id']): Promise<Submission | undefined> => {
		const submission = await Database.client.oneOrNone<Submission>(`SELECT ${properties} FROM table_submissions WHERE id = $1`, [id]);
		return submission !== null ? submission : undefined;
	};

	/**
	 * Retrieves an array of all the submissions from the database composed by the specified properties, filtered by dynamic and raw filters
	 *
	 * @param properties - The properties that are expected to be part of the returned submission
	 * @param filters - The dynamic filters with a variable property, value and conditional operator
	 * @param rawFilters - The raw filters that are directly provided in the query
	 * @returns A promise of an array of all the submissions that match the filters
	 */
	public static retrieveSubmissions = async (
		properties: string[] = ['id'],
		filters: Filter[] = [],
		rawFilters: string[] = []
	): Promise<Submission[]> => {
		const [conditionQuery, values] = Filter.generateSelectConditionQuery(
			filters,
			Submission.numericFilters,
			Submission.stringFilters,
			rawFilters
		);
		return await Database.client.manyOrNone<Submission>(`SELECT ${properties} FROM table_submissions ${conditionQuery}`, values);
	};

	/**
	 * Updates the properties present in the submission in the database
	 *
	 * @param submission - The submission's properties that will be updated except for the ID, which is required but not updated
	 * @returns A promise of the number of updated submissions
	 */
	public static updateSubmission = async (submission: Submission): Promise<number> => {
		const [query, values] = Filter.generateUpdateQuery('table_submissions', submission);
		if (!query) return 0;
		return await Database.client.result(query, values, result => result.rowCount);
	};

	/**
	 * Deletes a submission from the database with a specified ID
	 *
	 * @param id - The ID of the submission that will be removed
	 * @returns A promise of the number of deleted submissions
	 */
	public static deleteSubmission = async (id: number): Promise<number> =>
		Database.client.result(`DELETE FROM table_submissions WHERE id = $1`, [id], result => result.rowCount);

	/**
	 * Retrieves an array of submissions from the database composed by the specified properties, filtered by dynamic and raw filters,
	 * with a page that indicates the offset to apply and sorted by a specific order
	 *
	 * @param page - The page which is then multiplied by 10, the result of this operation indicates the offset
	 * @param sort - The dynamic with a variable property and order
	 * @param filters - The dynamic filters with a variable property, value and conditional operator
	 * @param rawFilters - The raw filters that are directly provided in the query
	 * @returns A promise of an array with the submissions that match the filters and the page offset in the specified order in the first position and
	 * the total amount of submissions that match the filters in the second position
	 */
	public static retrieveSubmissionsPagination = async (
		page: number,
		sort: Sort,
		filters: Filter[] = [],
		rawFilters: string[] = []
	): Promise<[rows: Submission[], count: number]> => {
		const [conditionQuery, values] = Filter.generateSelectConditionQuery(
			filters,
			Submission.numericFilters,
			Submission.stringFilters,
			rawFilters
		);
		const { sortProperty, order } = sort;
		const sortQuery = Sort.generateOrderQuery(sortProperty, order, ['last_updated']);
		values.push((page - 1) * 10);
		return await Database.client.tx<[rows: Submission[], count: number]>(
			{
				mode: new txMode.TransactionMode({
					tiLevel: txMode.isolationLevel.readCommitted,
					readOnly: true
				})
			},
			async (transaction: ITask<any>) => {
				const rows = await transaction.manyOrNone<Submission>(
					`SELECT id, approved_status FROM table_submissions ${conditionQuery} ${sortQuery} LIMIT 10 OFFSET $${values.length}`,
					values
				);
				const count = await transaction.one<number>(
					`SELECT COUNT(id) FROM table_submissions ${conditionQuery}`,
					values,
					(data: { count: number }) => data.count
				);
				return [rows, count];
			}
		);
	};
}

export default Submission;
