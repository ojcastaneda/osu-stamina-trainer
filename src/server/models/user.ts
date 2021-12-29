import Database, {Entity, Tables} from './database';
import {generateUpdateQuery} from './filter';

/**
 * Interface that represents the users that administrate the collection.
 */
interface User extends Entity {
	/**
	 * The user's username.
	 */
	username?: string;

	/**
	 * The user's password.
	 */
	password?: string;

	/**
	 * The user's role.
	 */
	role?: Role;
}

enum Role { super_admin = 'super_admin', admin = 'admin'}

/**
 * Creates a user in the database based on a user instance.
 *
 * @param user - The user instance with all the values expected by the database.
 */
const createUser = async (user: User): Promise<null> => Database.none(`INSERT INTO ${Tables.users} (username, password, role) VALUES ($1, $2, $3)`,
	[user.username, user.password, user.role]);

/**
 * Checks the existence a user from the database that matches the provided ID.
 *
 * @param id - The ID of the user requested.
 * @returns A promise of a boolean of whether the user exists.
 */
const checkUser = async (id: number): Promise<boolean> =>
	(await Database.oneOrNone(`SELECT id FROM ${Tables.users} WHERE id = $1 LIMIT 1`, [id])) !== null;

/**
 * Retrieves a user from the database that matches the provided username.
 *
 * @param username - The username of the user requested.
 * @param properties - The properties that are expected to be part of the returned user.
 * @returns A promise of the requested user or undefined if not found.
 */
const retrieveUserByUsername = async (username: string, properties: (keyof User)[] | '*' = '*'): Promise<User | undefined> => {
	const formattedProperties = properties === '*' ? properties : properties.join(', ');
	const user = await Database.oneOrNone<User>(`SELECT ${formattedProperties} FROM ${Tables.users} WHERE username ILIKE $1 LIMIT 1`, [username]);
	return user !== null ? user : undefined;
};

/**
 * Updates the properties present in the user in the database.
 *
 * @param user - The user's properties that will be updated except for the ID, which is required but not updated.
 * @returns A promise of whether the user was updated.
 */
const updateUser = async (user: User): Promise<boolean> => {
	const [query, values] = generateUpdateQuery(Tables.users, user);
	return query !== undefined && (await Database.result(query, values)).rowCount > 0;
};

/**
 * Deletes a user from the database with a provided ID.
 *
 * @param id - The ID of the user that will be deleted.
 * @returns A promise of whether the user was deleted.
 */
const deleteUser = async (id: number): Promise<boolean> => (await Database.result(`DELETE FROM ${Tables.users} WHERE id = $1`, [id])).rowCount > 0;

export default User;
export {Role, createUser, checkUser, retrieveUserByUsername, updateUser, deleteUser};
