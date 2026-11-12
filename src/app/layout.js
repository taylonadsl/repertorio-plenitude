import '@fontsource-variable/manrope';
import './globals.css';

export const metadata = {
  title: 'Repertório Banda Plenitude',
  description: 'Quem canta o quê na Banda Plenitude',
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050e22' },
    { media: '(prefers-color-scheme: light)', color: '#edf2fa' },
  ],
};

// Define o tema antes da página aparecer (evita piscar): usa a escolha salva ou a do aparelho
const themeScript = `(function(){try{var t=localStorage.getItem('plenitude-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
