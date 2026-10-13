import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'EKPRIA Prospect',description:'Prospecção comercial B2B da EKPRIA'};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="pt-BR"><body>{children}</body></html>;
}
