import { Context } from 'telegraf';
import { SessionData } from './SessionData';

export interface ZorkContext extends Context {
	session: SessionData;
}
