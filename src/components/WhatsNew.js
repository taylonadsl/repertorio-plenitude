'use client';
import { useEffect, useRef, useState } from 'react';
import { BulbIcon, PencilIcon, XIcon } from './Icons';

// Tutorial da nova ferramenta. Para mostrar de novo para todos numa próxima novidade, troque a versão.
export const TOUR_KEY = 'plenitude-novidade-sugestoes-v1';

export default function WhatsNew({ onClose, onGo }) {
  const [step, setStep] = useState(0);
  const primary = useRef(null);
  const last = step === 2;

  useEffect(() => { primary.current?.focus(); }, [step]);
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="tour-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tour glass" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <button className="icon-btn sm tour-x" onClick={onClose} aria-label="Fechar tutorial"><XIcon /></button>

        {step === 0 && (
          <div className="tour-body tour-intro" key="0">
            <div className="tour-glow" aria-hidden="true"><BulbIcon /></div>
            <span className="tour-tag">Nova ferramenta</span>
            <h2 id="tour-title">Chegou a seção Sugestões</h2>
            <p>Agora qualquer pessoa da banda pode sugerir músicas para a semana, ideias para o próximo culto ou novidades que gostaria de cantar.</p>
          </div>
        )}

        {step === 1 && (
          <div className="tour-body" key="1">
            <h2 id="tour-title">Sugira e explique</h2>
            <p>A sugestão pode ser uma música nova ou uma que já está no repertório de alguém. Todos veem quem sugeriu.</p>
            <div className="tour-demo" aria-hidden="true">
              <div className="tour-field">Tudo é Teu</div>
              <div className="tour-field muted">Ministério Zoe</div>
              <div className="tour-card">
                <div className="tour-card-head"><b>Tudo é Teu</b><span><PencilIcon /></span></div>
                <small>Original: Ministério Zoe</small>
                <div className="tour-note">Boa para abrir o culto de domingo. Tom em Sol.</div>
                <small className="tour-by"><i>VM</i> Sugerida por <b>você</b></small>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="tour-body" key="2">
            <h2 id="tour-title">Como usar</h2>
            <ol className="tour-steps">
              <li><span>Na seção <b>Sugestões</b>, escreva o nome da música e, se quiser, o cantor original.</span></li>
              <li><span>Use a <b>observação</b> para dizer o culto, o tom ou quem poderia cantar.</span></li>
              <li><span>Toque em <b>Sugerir música</b>. Ela aparece para toda a banda na hora.</span></li>
              <li><span>Para mudar a observação depois, toque no <b>lápis</b> ao lado da sua sugestão.</span></li>
            </ol>
          </div>
        )}

        <footer className="tour-foot">
          <div className="tour-dots" aria-label={`Passo ${step + 1} de 3`}>
            {[0, 1, 2].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}
          </div>
          <div className="tour-btns">
            {step > 0
              ? <button className="btn-ghost sm" onClick={() => setStep(step - 1)}>Voltar</button>
              : <button className="link" onClick={onClose}>Pular</button>}
            {last
              ? <button ref={primary} className="btn" onClick={onGo}>Ir para Sugestões</button>
              : <button ref={primary} className="btn" onClick={() => setStep(step + 1)}>{step === 0 ? 'Ver como funciona' : 'Próximo'}</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}
