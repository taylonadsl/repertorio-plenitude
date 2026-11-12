import './globals.css';
import { Fraunces, Figtree } from 'next/font/google';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const body = Figtree({ subsets: ['latin'], variable: '--font-body' });

export const metadata = {
  title: 'Repertório Banda Plenitude',
  description: 'Quem canta o quê na Banda Plenitude',
};
export const viewport = { width: 'device-width', initialScale: 1 };

// Define o tema antes da página aparecer (evita piscar): usa a escolha salva ou a do aparelho
const themeScript = `(function(){try{var t=localStorage.getItem('plenitude-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
