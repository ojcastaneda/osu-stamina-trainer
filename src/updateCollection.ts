import dotenv from 'dotenv';
dotenv.config();
import BeatmapsStatisticsUpdater from './server/logic/collection/tasks/BeatmapsStatisticsUpdater';

const rankedBeatmapsProcessor = new BeatmapsStatisticsUpdater();

rankedBeatmapsProcessor.updateAllStatistics().catch(error => console.log(error));
