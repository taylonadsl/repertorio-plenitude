'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPanel({ profiles, me, onChange, toast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from('profiles').insert({ name: name.trim(), email: email.trim().toLowerCase() || null });
    if (error) return toast(error.code === '23505' ? 'Esse e-mail já está cadastrado.' : 'Não foi possível adicionar.', 'err');
    setName(''); setEmail(''); toast('Cantora adicionada!'); onChange();
  };

  const setRole = async (p, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id);
    error ? toast('Não foi possível alterar.', 'err') : (toast('Permissão atualizada.'), onChange());
  };

  const remove = async (p) => {
    if (!confirm(`Excluir ${p.name}? As músicas dela também serão removidas.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', p.id);
    error ? toast('Não foi possível excluir.', 'err') : (toast('Cantora excluída.'), onChange());
  };

  return (
    <section className="panel">
      <h2>Administração</h2>
      <p className="lede">Cadastre cantoras e defina quem pode administrar o repertório.</p>
      <form className="row glass" onSubmit={add}>
        <input placeholder="Nome da cantora" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="E-mail (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" type="submit">Adicionar cantora</button>
      </form>
      <p className="hint">Com o e-mail, a cantora assume este perfil quando criar a conta com ele.</p>
      <ul className="people">
        {profiles.map((p) => (
          <li key={p.id} className="glass">
            <div><strong>{p.name}</strong><small>{p.email || 'sem e-mail'}{p.user_id ? '' : ' • ainda não entrou'}</small></div>
            <select value={p.role} onChange={(e) => setRole(p, e.target.value)} disabled={p.id === me.id}>
              <option value="singer">Cantora</option>
              <option value="admin">Administrador</option>
            </select>
            {p.id !== me.id && <button className="btn-danger" onClick={() => remove(p)}>Excluir</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
