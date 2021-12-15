import { uploadFileToCloudStorage } from '../fileManager';
import { retrieveBeatmaps } from '../../models/beatmap';

const osucolle = require('osucolle');

/**
 * Uploads the new version of the collection.db file to the cloud storage.
 */
const updateCollectionFile = async (): Promise<void> => {
	const collectionDatabase = await generateCollectionFile();
	await uploadFileToCloudStorage(collectionDatabase.toBuffer(), 'collection.db');
};

/**
 * Generates a collection.db object from all the beatmaps in the database, categorizing them into bursts, streams and deathstreams.
 * 
 * @returns A promise with the collection.db object.
 */
const generateCollectionFile = async (): Promise<any> => {
	const collectionDatabase = new osucolle.Database();
	const collections = ['Bursts', 'Streams', 'Deathstreams'];
	collections.forEach(collection => collectionDatabase.appendCollection(collection));
	const beatmaps = await retrieveBeatmaps(['hash', 'average'], [], [`active_status = 'true'`]);
	beatmaps.forEach(beatmap => {
		if (beatmap.average! < 9) collectionDatabase.collection(collections[0]).appendBeatmap(beatmap.hash);
		else if (beatmap.average! < 25) collectionDatabase.collection(collections[1]).appendBeatmap(beatmap.hash);
		else collectionDatabase.collection(collections[2]).appendBeatmap(beatmap.hash);
	});
	return collectionDatabase;
};

export { updateCollectionFile };
