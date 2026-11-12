'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NewPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError('Não foi possível trocar a senha. Use pelo menos 6 caracteres.');
    else onDone();
  };

  return (
    <main className="center">
      <form className="auth" onSubmit={submit}>
        <h2>Crie uma nova senha</h2>
        <label className="field">Nova senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" />
        </label>
        {error && <p className="msg err">{error}</p>}
        <button className="btn big" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
    </main>
  );
}
