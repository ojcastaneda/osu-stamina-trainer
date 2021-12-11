import dotenv from 'dotenv';
//dotenv.config();
dotenv.config({ path: './.env.development' });
import RankedBeatmapsProcessor from './server/logic/collection/tasks/rankedBeatmapsProcessor';

const rankedBeatmapsProcessor = new RankedBeatmapsProcessor();

rankedBeatmapsProcessor.processRankedBeatmaps().catch(error => console.log(error));
