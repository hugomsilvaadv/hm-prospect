import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'HM Prospect',description:'Painel local de prospecção e relacionamento comercial'};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="pt-BR"><body>{children}</body></html>;
}
