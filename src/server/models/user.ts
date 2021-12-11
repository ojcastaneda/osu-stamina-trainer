import Database from './database';
import Filter from './filter';

/**
 * Class that represents the users of the app
 */
class User {
	/**
	 * The user's ID
	 */
	public id?: number;

	/**
	 * The user's username
	 */
	public username?: string;

	/**
	 * The user's password
	 */
	public password?: string;

	/**
	 * The user's role ('super_admin', 'bot', 'admin' and 'guest')
	 */
	public role?: string;

	/**
	 * Creates an user in the database based on an user instance
	 *
	 * @param user - The user instance with all the values expected by the database
	 * @returns An empty promise
	 */
	public static createUser = async (user: User): Promise<void> => {
		const { username, password, role } = user;
		await Database.client.none('INSERT INTO table_users (username, password, role) VALUES ($1, $2, $3)', [username, password, role]);
	};

	/**
	 * Retrieves an user from the database composed by the specified properties that matches the provided ID
	 *
	 * @param id - The ID of the user requested
	 * @param properties - The properties that are expected to be part of the returned user
	 * @returns A promise of the requested user or undefined if not found
	 */
	public static retrieveUser = async (id: number, properties: string[] = ['id']): Promise<User | undefined> => {
		const user = await Database.client.oneOrNone<User>(`SELECT ${properties} FROM table_users WHERE id = $1 LIMIT 1`, [id]);
		return user !== null ? user : undefined;
	};

	/**
	 * Retrieves an user from the database composed by the specified properties that matches the provided username
	 *
	 * @param username - The username of the user requested
	 * @param properties - The properties that are expected to be part of the returned user
	 * @returns A promise of the requested user or undefined if not found
	 */
	public static retrieveUserByUsername = async (username: string, properties: string[] = ['id']): Promise<User | undefined> => {
		const user = await Database.client.oneOrNone<User>(`SELECT ${properties} FROM table_users WHERE username ILIKE $1 LIMIT 1`, [username]);
		return user !== null ? user : undefined;
	};

	/**
	 * Updates the properties present in the user in the database
	 *
	 * @param user - The user's properties that will be updated except for the ID, which is required but not updated
	 * @returns A promise of the number of updated users
	 */
	public static updateUser = async (user: User): Promise<number> => {
		const [query, values] = Filter.generateUpdateQuery('table_users', user);
		if (!query) return 0;
		const result = await Database.client.result(query, values);
		return result.rowCount;
	};

	/**
	 * Deletes an user from the database with a specified ID
	 *
	 * @param id - The ID of the user that will be removed
	 * @returns A promise of the number of deleted users
	 */
	public static deleteUser = async (id: number): Promise<number> =>
		Database.client.result('DELETE FROM table_users WHERE id = $1', [id], result => result.rowCount);
}

export default User;
