import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const filename = path.resolve(process.cwd(), process.env.DATABASE_URL || './data/hm-prospect.db');
fs.mkdirSync(path.dirname(filename), { recursive: true });
export const sqlite = new Database(filename);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');
export const db = drizzle(sqlite, { schema });
