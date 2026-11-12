# Repertório Banda Plenitude

Site com cadastro e login por e-mail e senha, repertório por cantora, músicas de emergência, busca que avisa de quem é cada música, painel de administrador, modo claro/escuro e atualização em tempo real. Funciona em celular, tablet e computador.

**Stack:** Next.js + Supabase (banco e login) + Vercel.

## 1) GitHub
1. github.com → **+** → **Novo repositório** → nome `repertorio-plenitude` → **Criar repositório**.
2. Clique em **enviando um arquivo existente**.
3. Descompacte este zip, entre na pasta, selecione TUDO que está dentro (Ctrl+A) e arraste para a página.
4. Clique em **Confirmar alterações**.

## 2) Vercel
1. vercel.com → **Novo Projeto** → importe o repositório → **Criar Projeto/Implantar**.
2. Sem o banco, o site mostra "Falta conectar o banco de dados". É normal.

## 3) Supabase
1. supabase.com → **New project** (região São Paulo).
2. **SQL Editor → New query** → cole `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers → Email**: desative **Confirm email**.
4. **Project Settings → API Keys**: copie a *Project URL* e a chave *anon public* (ou *Publishable key*).
5. Na Vercel → **Variáveis de ambiente**: crie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. **Implantações → Reimplantar**.
7. **Authentication → URL Configuration**: em *Site URL*, coloque o endereço do site na Vercel (necessário para o link de "Esqueci minha senha").

## 4) Virar administradora
Crie sua conta no site e, no SQL Editor:
```sql
update profiles set role = 'admin' where email = 'SEU_EMAIL';
```
