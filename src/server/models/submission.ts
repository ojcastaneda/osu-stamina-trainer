import Filter, {generateSelectConditionQuery, generateUpdateQuery} from './filter';
import {deleteCloudStorageFile} from '../logic/fileManager';
import Database, {Entity, Tables} from './database';
import Sort, {generateOrderQuery} from './sort';
import {ITask, txMode} from 'pg-promise';

/**
 * Interface that represents the users submissions.
 */
interface Submission extends Entity {
	/**
	 * The submission's approval status.
	 */
	approved?: Approved;

	/**
	 * The beatmap's date when it was last submitted.
	 */
	last_updated?: Date;
}

enum Approved { pending = 'pending', waiting_processing = 'waiting_processing', approved = 'approved'}

/**
 * The only properties that are allowed as filters for retrieving submissions.
 */
const allowedFilters: (keyof Submission)[] = ['id', 'approved'];

/**
 * Creates a submission in the database based on a submission instance.
 *
 * @param submission - The submission instance with all the values expected by the database.
 */
const createSubmission = async (submission: Submission): Promise<null> => Database.none(`INSERT INTO ${Tables.submissions} (id) VALUES ($1)`,
	[submission.id]);

/**
 * Retrieves a submission from the database composed by the provided properties that matches the provided ID.
 *
 * @param id - The ID of the submission requested.
 * @param properties - The properties that are expected to be part of the returned submission.
 * @returns A promise of the requested submission or undefined if not found.
 */
const retrieveSubmission = async (id: number, properties: (keyof Submission)[] | '*' = '*'): Promise<Submission | undefined> => {
	const formattedProperties = properties === '*' ? properties : properties.join(', ');
	const submission = await Database.oneOrNone<Submission>(`SELECT ${formattedProperties} FROM ${Tables.submissions} WHERE id = $1`, [id]);
	return submission !== null ? submission : undefined;
};

/**
 * Retrieves an array of all the submissions from the database composed by the provided properties, filtered by dynamic and raw filters.
 *
 * @param properties - The properties that are expected to be part of the returned submission.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @returns A promise of an array of all the submissions that match the filters.
 */
const retrieveSubmissions = async (properties: (keyof Submission)[] | '*' = '*', filters: Filter<Submission>[] = []): Promise<Submission[]> => {
	const formattedProperties = properties === '*' ? properties : properties.join(', ');
	const [conditionQuery, values] = generateSelectConditionQuery(filters, allowedFilters);
	return Database.manyOrNone<Submission>(`SELECT ${formattedProperties} FROM ${Tables.submissions} ${conditionQuery}`, values);
};

/**
 * Retrieves an array of submissions from the database composed by the provided properties, filtered by dynamic and raw filters,
 * with a page that indicates the offset to apply and sorted by a specific order.
 *
 * @param page - The page which is then multiplied by 10, the result of this operation indicates the offset.
 * @param sort - The dynamic with a variable property and order.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @returns A promise of an array with the submissions that match the filters and the page offset in the provided order in the first position and
 * the total amount of submissions that match the filters in the second position.
 */
const retrieveSubmissionsByPage = async (page: number, sort: Sort<Submission>,
	filters: Filter<Submission>[] = []): Promise<[rows: Submission[], count: number]> => {
	const [conditionQuery, values] = generateSelectConditionQuery(filters, allowedFilters);
	values.push((page - 1) * 10);
	return Database.tx<[rows: Submission[], count: number]>(
		{mode: new txMode.TransactionMode({tiLevel: txMode.isolationLevel.readCommitted, readOnly: true})}, async (transaction: ITask<any>) => {
			const rows = await transaction.manyOrNone<Submission>(`SELECT id, approved FROM ${Tables.submissions} ${conditionQuery} 
				${generateOrderQuery(sort.property, sort.order, ['last_updated'])} LIMIT 10 OFFSET $${values.length}`, values);
			return [rows, (await transaction.one(`SELECT COUNT(id) FROM ${Tables.submissions} ${conditionQuery}`, values)).count];
		});
};

/**
 * Updates the properties present in the submission in the database.
 *
 * @param submission - The submission's properties that will be updated except for the ID, which is required but not updated.
 * @returns A promise of whether the submission was updated.
 */
const updateSubmission = async (submission: Submission): Promise<boolean> => {
	const [query, values] = generateUpdateQuery(Tables.submissions, submission);
	return query !== undefined && (await Database.result(query, values)).rowCount > 0;
};

/**
 * Deletes a submission from the database with a provided ID.
 *
 * @param id - The ID of the submission that will be deleted.
 * @returns A promise of whether the submission was deleted.
 */
const deleteSubmission = async (id: number): Promise<boolean> => (await Database.result(`DELETE FROM ${Tables.submissions} WHERE id = $1`,
	[id])).rowCount > 0;

/**
 * Deletes a submission, its corresponding beatmap if available and its corresponding cloud stored file if available from the database with a
 * provided ID.
 *
 * @param id - The ID of the submission that will be deleted.
 * @returns A promise of whether the submission was deleted.
 */
const deleteApprovedSubmission = async (id: number): Promise<boolean> => {
	return Database.tx({mode: new txMode.TransactionMode({tiLevel: txMode.isolationLevel.readCommitted, readOnly: false})},
		async (transaction: ITask<any>) => {
			if (!((await transaction.result(`DELETE FROM ${Tables.submissions} WHERE id = $1`, [id])).rowCount > 0)) return false;
			await transaction.result(`DELETE FROM ${Tables.beatmaps} WHERE id = $1`, [id]);
			await deleteCloudStorageFile(`beatmaps/${id}.osu`);
			return true;
		});
};

export default Submission;
export {
	Approved, createSubmission, retrieveSubmission, retrieveSubmissions, retrieveSubmissionsByPage, updateSubmission, deleteSubmission,
	deleteApprovedSubmission
};
