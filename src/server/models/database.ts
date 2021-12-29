import pgPromise, {IDatabase, QueryFile} from 'pg-promise';
import {Promise} from 'bluebird';
import {resolve} from 'path';

/**
 * The pg-promise specification for query logs.
 */
const client = pgPromise({
	capSQL: true, promiseLib: Promise, query: query => {
		const plainQuery = query.query.replace(/\s\s+/g, ' ');
		switch (plainQuery) {
			case 'BEGIN ISOLATION LEVEL READ COMMITTED READ WRITE':
			case 'BEGIN ISOLATION LEVEL READ COMMITTED READ ONLY':
			case 'COMMIT':
				break;
			default:
				console.info(plainQuery);
				break;
		}
	}
});

/**
 * The pg-promise connection with the database.
 */
const database: IDatabase<any> = client({
	connectionString: process.env.DATABASE_URL!, ssl: process.env.NODE_ENV === 'production' && {rejectUnauthorized: false}
});

/**
 * Creates all the SQL entities needed for the persistence of all the instances of classes used by the system.
 *
 * @param reset - The specification for dropping and crating all the SQL entities needed.
 */
const setupDatabaseConnection = async (reset: boolean = false) => {
	if (reset) await database.none(new QueryFile(resolve('resources/database/reset.sql'), {minify: true}));
	await database.none(new QueryFile(resolve('resources/database/setup.sql'), {minify: true}));
};

interface Entity {
	id?: number;
}

enum Tables {
	users = 'users', submissions = 'submissions', double_time_beatmaps = 'double_time_beatmaps', beatmaps = 'beatmaps'
}

export {Entity, Tables, setupDatabaseConnection};
export default database;
