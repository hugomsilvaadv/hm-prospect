import fs from 'node:fs';
import path from 'node:path';
import { sqlite } from './client';

const migrations=path.resolve(process.cwd(),'src/db/migrations');
sqlite.exec(fs.readFileSync(path.join(migrations,'0001_init.sql'),'utf8'));
const version=sqlite.pragma('user_version', {simple:true}) as number;
if(version<2){
 sqlite.transaction(()=>{
  const columns=sqlite.prepare('PRAGMA table_info(leads)').all() as {name:string}[];
  const names=new Set(columns.map(c=>c.name));
  if(!names.has('location'))sqlite.exec("ALTER TABLE leads ADD COLUMN location TEXT NOT NULL DEFAULT ''");
  if(!names.has('source_url'))sqlite.exec("ALTER TABLE leads ADD COLUMN source_url TEXT NOT NULL DEFAULT ''");
  sqlite.exec('CREATE INDEX IF NOT EXISTS lead_location_idx ON leads(location)');
  sqlite.pragma('user_version = 2');
 })();
}
console.log('Database migrated: version '+sqlite.pragma('user_version',{simple:true}));
