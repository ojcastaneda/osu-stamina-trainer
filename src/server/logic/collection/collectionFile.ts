import Beatmap from '../../models/beatmap';
import fileManager from '../fileManager';

const osucolle = require('osucolle');

const updateCollectionFile = async (): Promise<void> => {
	const collectionDatabase = await generateCollectionFile();
	await fileManager.uploadFile(collectionDatabase.toBuffer(), 'collection.db');
};

const generateCollectionFile = async (): Promise<any> => {
	const collectionDatabase = new osucolle.Database();
	const collections = ['Bursts', 'Streams', 'Deathstreams'];
	collections.forEach(collection => collectionDatabase.appendCollection(collection));
	const beatmaps = await Beatmap.retrieveBeatmaps(['hash', 'average'], [], [`active_status = 'true'`]);
	beatmaps.forEach(beatmap => {
		if (beatmap.average! < 9) collectionDatabase.collection(collections[0]).appendBeatmap(beatmap.hash);
		else if (beatmap.average! < 25) collectionDatabase.collection(collections[1]).appendBeatmap(beatmap.hash);
		else collectionDatabase.collection(collections[2]).appendBeatmap(beatmap.hash);
	});
	return collectionDatabase;
};

export {updateCollectionFile};