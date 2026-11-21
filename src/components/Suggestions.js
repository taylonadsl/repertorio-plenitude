'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/utils';
import { TrashIcon, PencilIcon } from './Icons';
import Collapse from './Collapse';

const when = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

// Sugestões: qualquer pessoa sugere uma música (nova ou do repertório) com uma observação.
export default function Suggestions({ items, byId, me, isAdmin, toast, onChange, tone, open, onToggle }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('suggestions').insert({
      title: title.trim(), artist: artist.trim() || null, note: note.trim() || null, added_by: me.id,
    });
    setBusy(false);
    if (error) return toast('Não foi possível enviar a sugestão.', 'err');
    setTitle(''); setArtist(''); setNote(''); toast('Sugestão enviada!'); onChange();
  };

  return (
    <Collapse id="sug" className="suggestions" title="Sugestões" hint="músicas para a semana, ideias ou novidades" count={items.length} open={open} onToggle={onToggle}>
      <form className="sug-form" onSubmit={add}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da música" aria-label="Nome da música sugerida" />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Cantor original (opcional)" aria-label="Cantor original" />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Observação (opcional): para qual culto, tom, quem poderia cantar…" aria-label="Observação" />
        <button className="btn" type="submit" disabled={busy}>Sugerir música</button>
      </form>
      <ul className="sug-list">
        {items.length === 0 && <li className="empty">Nenhuma sugestão por aqui ainda.</li>}
        {items.map((s) => (
          <Suggestion key={s.id} s={s} author={byId[s.added_by]} canEdit={isAdmin || s.added_by === me.id} toast={toast} onChange={onChange} tone={tone} />
        ))}
      </ul>
    </Collapse>
  );
}

function Suggestion({ s, author, canEdit, toast, onChange, tone }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(s.note || '');

  const save = async () => {
    const { error } = await supabase.from('suggestions').update({ note: text.trim() || null }).eq('id', s.id);
    if (error) return toast('Não foi possível salvar a observação.', 'err');
    setEditing(false); toast('Observação salva.'); onChange();
  };
  const remove = async () => {
    if (!confirm(`Remover a sugestão "${s.title}"?`)) return;
    const { error } = await supabase.from('suggestions').delete().eq('id', s.id);
    error ? toast('Não foi possível remover.', 'err') : (toast('Sugestão removida.'), onChange());
  };

  const name = author?.name || 'Alguém da banda';
  return (
    <li className="sug">
      <div className="sug-head">
        <div className="info">
          <span className="t">{s.title}</span>
          {s.artist && <span className="a">Original: {s.artist}</span>}
        </div>
        {canEdit && (
          <div className="acts">
            {!editing && <button className="icon-btn sm" title={s.note ? 'Editar observação' : 'Adicionar observação'} aria-label={`Observação de ${s.title}`} onClick={() => { setText(s.note || ''); setEditing(true); }}><PencilIcon /></button>}
            <button className="icon-btn sm danger" title="Remover sugestão" aria-label={`Remover sugestão ${s.title}`} onClick={remove}><TrashIcon /></button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="sug-edit">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} autoFocus placeholder="Escreva sua observação" aria-label="Observação" />
          <div className="sug-edit-btns">
            <button className="btn-ghost sm" onClick={() => setEditing(false)}>Cancelar</button>
            <button className="btn sm-btn" onClick={save}>Salvar</button>
          </div>
        </div>
      ) : s.note ? (
        <p className="sug-note">{s.note}</p>
      ) : null}
      <div className="sug-meta">
        <span className="av" style={{ width: 22, height: 22, fontSize: 9, background: tone(name) }}>{initials(name)}</span>
        <span>Sugerida por <b>{name}</b> em {when(s.created_at)}</span>
      </div>
    </li>
  );
}
