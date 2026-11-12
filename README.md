# Repertório Banda Plenitude

Site com cadastro e login por e-mail e senha, repertório por cantora, músicas de emergência, busca que avisa de quem é cada música, painel de administração, modo claro/escuro e atualização em tempo real. Funciona em celular, tablet e computador.

**Stack:** Next.js + Supabase (banco e login) + Vercel.

As chaves públicas do Supabase ficam em `src/lib/config.js`.

## Como atualizar o site
1. No GitHub, abra o repositório `repertorio-plenitude` → **Add file → Upload files**.
2. Descompacte o zip novo, entre na pasta até ver `src`, `supabase` e `package.json`, aperte Ctrl+A e arraste tudo.
3. Clique em **Commit changes**. A Vercel publica sozinha em 1–2 minutos.

## Banco (só se precisar recriar)
Supabase → SQL Editor → New query → cole `supabase/schema.sql` → Run. Pode rodar de novo sem perder dados.
