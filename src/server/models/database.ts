import pgPromise, {IDatabase, QueryFile} from 'pg-promise';
import path from 'path';

const database = pgPromise({query: (query) => console.log(query.query.replace(/\s\s+/g, ' '))});

/**
 * Class that represents the pg-promise connection with the database
 */
class Database {
	/**
	 * The pg-promise connection with the database
	 */
	public static client: IDatabase<any> = database({
		connectionString: process.env.DATABASE_URL!,
		ssl: process.env.NODE_ENV === 'production' && {
			rejectUnauthorized: false
		}
	});

	/**
	 * Creates all the SQL entities needed for the persistence of all the instances of classes used by the system
	 *
	 * @param reset - The specification for dropping and crating all the SQL entities needed
	 */
	public static setupConnection = async (reset: boolean = false) => {
		if (reset) await Database.client.none(new QueryFile(path.join(path.resolve('./resources/database'), 'reset.sql'), {minify: true}));
		await Database.client.none(new QueryFile(path.join(path.resolve('./resources/database'), 'setup.sql'), {minify: true}));
	};
}

export default Database;