import '../db/migrate';
import { sqlite } from '../db/client';
import { isPaused } from '../lib/jobs';
console.log('HM Prospect worker inicializado; painel local pronto para configurar tarefas.');
setInterval(() => {
  if (isPaused()) return;
  const queued = sqlite.prepare("SELECT COUNT(*) AS total FROM jobs WHERE status='queued'").get() as {total:number};
  if (queued.total) console.log('Tarefas pendentes:', queued.total);
}, 15000);
