'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPanel({ profiles, me, isDev, onChange, toast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('f');

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from('profiles').insert({ name: name.trim(), email: email.trim().toLowerCase() || null, gender });
    if (error) return toast(error.code === '23505' ? 'Esse e-mail já está cadastrado.' : 'Não foi possível adicionar.', 'err');
    setName(''); setEmail(''); toast(gender === 'm' ? 'Cantor adicionado!' : 'Cantora adicionada!'); onChange();
  };

  const update = async (p, fields, ok) => {
    const { error } = await supabase.from('profiles').update(fields).eq('id', p.id);
    error ? toast('Não foi possível alterar.', 'err') : (toast(ok), onChange());
  };

  const remove = async (p) => {
    if (!confirm(`Excluir ${p.name}? As músicas desse repertório também serão removidas.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', p.id);
    error ? toast('Não foi possível excluir.', 'err') : (toast(`${p.name} foi excluído(a).`), onChange());
  };

  return (
    <section className="panel">
      <h2>Administração</h2>
      <p className="lede">Cadastre cantores e cantoras e defina quem pode administrar o repertório.</p>
      <form className="row admin-add glass" onSubmit={add}>
        <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome" />
        <input placeholder="E-mail (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" />
        <select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Cantor ou cantora">
          <option value="f">Cantora</option>
          <option value="m">Cantor</option>
        </select>
        <button className="btn" type="submit">Adicionar</button>
      </form>
      <p className="hint">Com o e-mail, a pessoa assume este perfil quando criar a conta com ele.</p>
      <ul className="people">
        {profiles.map((p) => (
          <li key={p.id} className="glass">
            <div><strong>{p.name}</strong><small>{p.email || 'sem e-mail'}{p.user_id ? '' : ' (ainda não entrou)'}</small></div>
            <select value={p.gender || ''} onChange={(e) => update(p, { gender: e.target.value }, 'Atualizado.')} aria-label={`Voz de ${p.name}`}>
              {!p.gender && <option value="" disabled>Escolha</option>}
              <option value="f">Cantora</option>
              <option value="m">Cantor</option>
            </select>
            <select value={p.role} onChange={(e) => update(p, { role: e.target.value }, 'Permissão atualizada.')} disabled={p.id === me.id} aria-label={`Permissão de ${p.name}`}>
              <option value="singer">Integrante</option>
              <option value="admin">{isDev && p.id === me.id ? 'Desenvolvedor' : 'Administrador(a)'}</option>
            </select>
            {p.id !== me.id ? <button className="btn-danger" onClick={() => remove(p)}>Excluir</button> : <span />}
          </li>
        ))}
      </ul>
    </section>
  );
}
