import dotenv from 'dotenv';
dotenv.config();
import RankedBeatmapsProcessor from './processing/tasks/rankedBeatmapsProcessor';

const rankedBeatmapsProcessor = new RankedBeatmapsProcessor();

rankedBeatmapsProcessor.processRankedBeatmaps().catch(error => console.log(error));