import dotenv from 'dotenv';
dotenv.config();
import RankedBeatmapsProcessor from './server/logic/collection/tasks/rankedBeatmapsProcessor';

const rankedBeatmapsProcessor = new RankedBeatmapsProcessor();

rankedBeatmapsProcessor.processRankedBeatmaps().catch(error => console.warn(error));
