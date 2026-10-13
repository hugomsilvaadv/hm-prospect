import fs from 'node:fs';
import path from 'node:path';
import { sqlite } from './client';
const sqlFile = path.resolve(process.cwd(),'src/db/migrations/0001_init.sql');
sqlite.exec(fs.readFileSync(sqlFile,'utf8'));
console.log('Database migration complete.');
