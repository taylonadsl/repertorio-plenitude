'use client';
import { useEffect, useState } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import Login from '@/components/Login';
import NewPassword from '@/components/NewPassword';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [session, setSession] = useState(undefined);
  const [me, setMe] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setMe(null); setNoProfile(false); return; }
    let tries = 0, stop = false;
    const fetchMe = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      if (stop) return;
      if (data) setMe(data);
      else if (tries++ < 6) setTimeout(fetchMe, 800);
      else setNoProfile(true);
    };
    fetchMe();
    return () => { stop = true; };
  }, [session]);

  if (!isConfigured) return (
    <main className="center"><div className="notice">
      <h2>Falta conectar o banco de dados</h2>
      <p>Adicione <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> nas variáveis de ambiente da Vercel e reimplante o site.</p>
    </div></main>
  );
  if (session === undefined) return <div className="splash">Carregando…</div>;
  if (!session) return <Login />;
  if (recovery) return <NewPassword onDone={() => setRecovery(false)} />;
  if (noProfile) return (
    <main className="center"><div className="notice">
      <h2>Não encontramos o seu perfil</h2>
      <p>Isso acontece quando o arquivo <code>schema.sql</code> ainda não foi executado no Supabase. Rode-o no SQL Editor e entre de novo.</p>
      <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
    </div></main>
  );
  if (!me) return <div className="splash">Preparando seu perfil…</div>;
  return <Dashboard me={me} onSignOut={() => supabase.auth.signOut()} />;
}
