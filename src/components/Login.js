'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';

const traduz = (m = '') => {
  const t = m.toLowerCase();
  if (t.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (t.includes('already registered')) return 'Esse e-mail já tem conta. Use a aba "Entrar".';
  if (t.includes('at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (t.includes('not confirmed')) return 'Confirme seu e-mail pelo link que enviamos.';
  if (t.includes('rate limit') || t.includes('seconds')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if (t.includes('valid email') || t.includes('invalid format')) return 'Digite um e-mail válido.';
  return 'Algo deu errado. Tente de novo.';
};

export default function Login() {
  const [mode, setMode] = useState('entrar'); // entrar | criar | recuperar
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (m) => { setMode(m); setError(''); setInfo(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    const mail = email.trim().toLowerCase();
    if (mode === 'criar') {
      const { data, error } = await supabase.auth.signUp({ email: mail, password, options: { data: { full_name: name.trim() } } });
      if (error) setError(traduz(error.message));
      else if (!data.session) setInfo('Conta criada! Abra o seu e-mail e clique no link de confirmação para entrar.');
    } else if (mode === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) setError(traduz(error.message));
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: window.location.origin });
      if (error) setError(traduz(error.message));
      else setInfo('Se esse e-mail tiver conta, enviamos um link para criar uma nova senha.');
    }
    setBusy(false);
  };

  const title = { entrar: 'Bem-vinda de volta', criar: 'Crie sua conta', recuperar: 'Recuperar senha' }[mode];

  return (
    <main className="login">
      <aside className="hero">
        <svg className="staff" viewBox="0 0 420 120" aria-hidden="true">
          {[30, 42, 54, 66, 78].map((y) => <line key={y} x1="0" x2="420" y1={y} y2={y} />)}
          {[[70, 78], [130, 66], [190, 54], [250, 66], [310, 42], [370, 54]].map(([x, y]) => (
            <g key={x}><ellipse cx={x} cy={y} rx="9" ry="6.5" transform={`rotate(-20 ${x} ${y})`} /><line className="stem" x1={x + 8} x2={x + 8} y1={y - 2} y2={y - 38} /></g>
          ))}
        </svg>
        <p className="eyebrow">Banda Plenitude</p>
        <h1>Cada voz com as suas canções.</h1>
        <p>Veja quem canta o quê, publique o seu repertório e evite músicas repetidas, tudo num só lugar.</p>
      </aside>

      <section className="auth-wrap">
        <div className="auth-top"><ThemeToggle /></div>
        <form className="auth" onSubmit={submit}>
          <h2>{title}</h2>
          {mode !== 'recuperar' && (
            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'entrar'} className={mode === 'entrar' ? 'on' : ''} onClick={() => go('entrar')}>Entrar</button>
              <button type="button" role="tab" aria-selected={mode === 'criar'} className={mode === 'criar' ? 'on' : ''} onClick={() => go('criar')}>Criar conta</button>
            </div>
          )}
          {mode === 'criar' && (
            <label className="field">Seu nome
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Como você é chamada" autoComplete="name" />
            </label>
          )}
          <label className="field">E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@email.com" autoComplete="email" />
          </label>
          {mode !== 'recuperar' && (
            <label className="field">Senha
              <span className="pw">
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="mínimo 6 caracteres" autoComplete={mode === 'criar' ? 'new-password' : 'current-password'} />
                <button type="button" className="link" onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</button>
              </span>
            </label>
          )}
          {error && <p className="msg err" role="alert">{error}</p>}
          {info && <p className="msg ok" role="status">{info}</p>}
          <button className="btn big" type="submit" disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'criar' ? 'Criar minha conta' : mode === 'entrar' ? 'Entrar' : 'Enviar link'}
          </button>
          {mode === 'entrar' && <button type="button" className="link center-link" onClick={() => go('recuperar')}>Esqueci minha senha</button>}
          {mode === 'recuperar' && <button type="button" className="link center-link" onClick={() => go('entrar')}>Voltar para o login</button>}
        </form>
      </section>
    </main>
  );
}
