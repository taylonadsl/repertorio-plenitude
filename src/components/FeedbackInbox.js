'use client';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/utils';
import { TrashIcon } from './Icons';

const when = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// Aba "Pedidos de melhorias": só aparece para o desenvolvedor.
export default function FeedbackInbox({ items, byId, onChange, toast }) {
  const mark = async (f, read) => {
    const { error } = await supabase.from('feedback').update({ read }).eq('id', f.id);
    error ? toast('Não foi possível atualizar.', 'err') : onChange();
  };
  const remove = async (f) => {
    if (!confirm('Apagar este pedido?')) return;
    const { error } = await supabase.from('feedback').delete().eq('id', f.id);
    error ? toast('Não foi possível apagar.', 'err') : (toast('Pedido apagado.'), onChange());
  };
  const unread = items.filter((f) => !f.read).length;

  return (
    <section className="panel">
      <h2>Pedidos de melhorias</h2>
      <p className="lede">{items.length === 0 ? 'Nenhum pedido ainda.' : `${items.length} ${items.length === 1 ? 'pedido' : 'pedidos'}, ${unread} ${unread === 1 ? 'novo' : 'novos'}. Só você vê esta aba.`}</p>
      <ul className="fb-list">
        {items.map((f) => {
          const name = byId[f.from_id]?.name || 'Pessoa removida';
          return (
            <li key={f.id} className={`glass fb-item ${f.read ? '' : 'new'}`}>
              <div className="fb-who">
                <span className="av" style={{ width: 34, height: 34, fontSize: 12, background: 'var(--accent)' }}>{initials(name)}</span>
                <div><strong>{name}</strong><small>{byId[f.from_id]?.email || ''} · {when(f.created_at)}</small></div>
                {!f.read && <span className="badge">Novo</span>}
              </div>
              <p className="fb-msg">{f.message}</p>
              <div className="fb-acts">
                <button className="btn-ghost sm" onClick={() => mark(f, !f.read)}>{f.read ? 'Marcar como não lido' : 'Marcar como lido'}</button>
                <button className="icon-btn sm danger" onClick={() => remove(f)} aria-label="Apagar pedido" title="Apagar"><TrashIcon /></button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
