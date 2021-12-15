import dotenv from 'dotenv';
dotenv.config();
import { updateAllStatistics } from './server/logic/collection/tasks/beatmapsTaks';
import OsuService from './osuApi/osuApiService';
import PQueue from 'p-queue';

updateAllStatistics(new OsuService(), new PQueue({ interval: 1000, intervalCap: 8, concurrency: 8 })).catch(error => console.error(error));
