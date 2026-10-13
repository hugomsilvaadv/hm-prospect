import { signIn } from '@/app/actions';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const params=await searchParams;
 return <main className="login"><section className="panel"><h1>HM Prospect</h1><p>Entre para acessar o painel de prospecção.</p>
 {params.error&&<p role="alert">Token inválido. Verifique o código de acesso.</p>}
 <form action={signIn}><label htmlFor="token">Chave de acesso</label><input id="token" type="password" name="token" autoComplete="current-password" required/>
 <button type="submit">Entrar</button></form></section></main>;
}
