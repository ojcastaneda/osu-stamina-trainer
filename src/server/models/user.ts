import { generateUpdateQuery } from './filter';
import Database from './database';

/**
 * Interface that represents the users of the app
 */
interface User {
	/**
	 * The user's ID.
	 */
	id?: number;

	/**
	 * The user's username.
	 */
	username?: string;

	/**
	 * The user's password.
	 */
	password?: string;

	/**
	 * The user's role ('super_admin' or 'admin').
	 */
	role?: string;
}

/**
 * Creates an user in the database based on an user instance.
 *
 * @param user - The user instance with all the values expected by the database.
 */
const createUser = async (user: User): Promise<null> =>
	Database.none(`INSERT INTO table_users (username, password, role) VALUES ($1, $2, $3)`, [user.username, user.password, user.role]);

/**
 * Retrieves an user from the database composed by the provided properties that matches the provided ID.
 *
 * @param id - The ID of the user requested.
 * @param properties - The properties that are expected to be part of the returned user.
 * @returns A promise of the requested user or undefined if not found.
 */
const retrieveUser = async (id: number, properties: string[] = ['id']): Promise<User | undefined> => {
	const user = await Database.oneOrNone<User>(`SELECT ${properties} FROM table_users WHERE id = $1 LIMIT 1`, [id]);
	return user !== null ? user : undefined;
};

/**
 * Retrieves an user from the database composed by the provided properties that matches the provided username.
 *
 * @param username - The username of the user requested.
 * @param properties - The properties that are expected to be part of the returned user.
 * @returns A promise of the requested user or undefined if not found.
 */
const retrieveUserByUsername = async (username: string, properties: string[] = ['id']): Promise<User | undefined> => {
	const user = await Database.oneOrNone<User>(`SELECT ${properties} FROM table_users WHERE username ILIKE $1 LIMIT 1`, [username]);
	return user !== null ? user : undefined;
};

/**
 * Updates the properties present in the user in the database.
 *
 * @param user - The user's properties that will be updated except for the ID, which is required but not updated.
 * @returns A promise of whether or not the user was updated.
 */
const updateUser = async (user: User): Promise<boolean> => {
	const [query, values] = generateUpdateQuery('table_users', user);
	if (!query) return false;
	return (await Database.result(query, values)).rowCount > 0;
};

/**
 * Deletes an user from the database with a provided ID.
 *
 * @param id - The ID of the user that will be removed.
 * @returns A promise of whether or not the user was deleted.
 */
const deleteUser = async (id: number): Promise<boolean> => (await Database.result(`DELETE FROM table_users WHERE id = $1`, [id])).rowCount > 0;

export default User;
export { createUser, retrieveUser, retrieveUserByUsername, updateUser, deleteUser };
