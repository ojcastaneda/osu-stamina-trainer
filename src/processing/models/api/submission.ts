/**
 * Class that represents the users beatmap's submissions
 */
class Submission {
	/**
	 * The Submission's beatmap's ID
	 * @type number
	 */
	public id!: number;

	/**
	 * The Submission's status in the collection
	 * @type string
	 */
	public approved_status!: string;

	/**
	 * The Submission's date when the last activity was registered
	 * @type Date
	 */
	public last_updated!: Date;
}

export default Submission;