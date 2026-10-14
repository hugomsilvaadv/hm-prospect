import fs from 'node:fs';
import path from 'node:path';
import { sqlite } from '../src/db/client';

async function main():Promise<void>{
 const dir=path.resolve('backups');
 fs.mkdirSync(dir,{recursive:true});
 const destination=path.join(dir,new Date().toISOString().replace(/[:.]/g,'-')+'.db');
 await sqlite.backup(destination);
 console.log('Backup salvo em '+destination);
 sqlite.close();
}
main().catch(error=>{console.error('Falha no backup:',error);process.exitCode=1;});
