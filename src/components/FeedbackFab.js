'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BulbIcon, XIcon } from './Icons';

// Bolinha fixa no canto inferior esquerdo: qualquer pessoa envia um pedido de melhoria.
// A mensagem vai para a tabela "feedback", que só o desenvolvedor consegue ler.
export default function FeedbackFab({ me, toast }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const area = useRef(null);
  // Enquanto a pessoa nunca abriu a bolinha, ela dá uns pulinhos suaves e mostra uma dica.
  const [seen, setSeen] = useState(true);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    let was = false;
    try { was = localStorage.getItem('plenitude-fb-seen') === '1'; } catch (e) {}
    setSeen(was);
    if (was) return;
    const a = setTimeout(() => setHint(true), 1200);
    const b = setTimeout(() => setHint(false), 9000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const openSheet = () => {
    setOpen(true); setSeen(true); setHint(false);
    try { localStorage.setItem('plenitude-fb-seen', '1'); } catch (e) {}
  };

  useEffect(() => {
    if (!open) return;
    area.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (message.length < 3) return toast('Escreva um pouquinho mais.', 'err');
    setBusy(true);
    const { error } = await supabase.from('feedback').insert({ message, from_id: me.id });
    setBusy(false);
    if (error) return toast('Não foi possível enviar agora. Tente de novo.', 'err');
    setText(''); setOpen(false); toast('Obrigado! Sua sugestão foi enviada.');
  };

  return (
    <>
      {open && (
        <div className="fb-backdrop" onClick={() => setOpen(false)}>
          <form className="fb-sheet glass" onClick={(e) => e.stopPropagation()} onSubmit={send} role="dialog" aria-modal="true" aria-label="Sugerir melhoria do site">
            <div className="fb-head">
              <h3>Como podemos melhorar?</h3>
              <button type="button" className="icon-btn sm" onClick={() => setOpen(false)} aria-label="Fechar"><XIcon /></button>
            </div>
            <p className="fb-sub">Conte uma ideia, um problema ou algo que ficaria melhor no site. A mensagem chega só para o desenvolvedor.</p>
            <textarea ref={area} value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000} placeholder="Escreva aqui a sua sugestão…" aria-label="Sua sugestão" />
            <div className="fb-foot">
              <small>{text.length}/2000</small>
              <button className="btn" type="submit" disabled={busy || text.trim().length < 3}>{busy ? 'Enviando…' : 'Enviar'}</button>
            </div>
          </form>
        </div>
      )}
      {hint && !open && <span className="fb-hint" onClick={openSheet}>Alguma ideia para o site?</span>}
      <button type="button" className={`fb-fab ${seen ? '' : 'hop'}`} onClick={openSheet} aria-label="Enviar sugestão de melhoria do site" title="Sugerir uma melhoria">
        <BulbIcon />
      </button>
    </>
  );
}
