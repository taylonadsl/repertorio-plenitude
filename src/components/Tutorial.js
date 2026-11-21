'use client';
import { useEffect, useRef, useState } from 'react';
import { BulbIcon, PencilIcon, XIcon, FlagIcon, ReleaseIcon, TrashIcon, MicIcon, PlusIcon, SunIcon, SearchIcon, ChevronIcon } from './Icons';

// Tutorial geral do site.
// MOSTRAR_SEMPRE = true  -> abre toda vez que a pessoa entra no site.
// MOSTRAR_SEMPRE = false -> abre só na primeira vez (e quando o TUTORIAL_KEY mudar). O botão "Ajuda" abre quando quiser.
export const MOSTRAR_SEMPRE = true;
export const TUTORIAL_KEY = 'plenitude-tutorial-v3';

export const tutorialJaVisto = () => {
  if (MOSTRAR_SEMPRE) return false;
  try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch (e) { return false; }
};
export const tutorialMarcarVisto = () => { try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (e) {} };

const Dot = ({ k }) => <i className={`dot ${k}`} aria-hidden="true" />;

export default function Tutorial({ isAdmin, onClose }) {
  const [step, setStep] = useState(0);
  const primary = useRef(null);

  const steps = [
    (
      <div className="tour-body tour-intro" key="0">
        <div className="tour-glow" aria-hidden="true"><BulbIcon /></div>
        <span className="tour-tag">Tutorial rápido</span>
        <h2 id="tour-title">Bem-vindo ao Repertório Plenitude</h2>
        <p>Aqui cada voz da banda mostra as músicas que canta. Assim ninguém repete música sem querer. Em poucos passos você aprende a usar tudo.</p>
      </div>
    ),
    (
      <div className="tour-body" key="1">
        <h2 id="tour-title">Pesquise antes de escolher</h2>
        <p>Na barra de busca, digite o nome da música, do cantor original ou de quem canta. O site responde na hora, com uma cor:</p>
        <ul className="tour-legend">
          <li><Dot k="bad" /><span><b>Já tem dona:</b> outra pessoa canta essa música.</span></li>
          <li><Dot k="warn" /><span><b>Emergência:</b> qualquer pessoa pode cantar.</span></li>
          <li><Dot k="info" /><span><b>Disponível:</b> alguém deixou livre. Você pode assumir.</span></li>
          <li><Dot k="good" /><span><b>Livre:</b> ninguém canta ainda. Pode escolher.</span></li>
        </ul>
      </div>
    ),
    (
      <div className="tour-body" key="2">
        <h2 id="tour-title">Coloque no seu repertório</h2>
        <ol className="tour-steps">
          <li><span>Pesquise a música. Se estiver livre, toque em <b>Cantar esta música</b>.</span></li>
          <li><span>Ou, no <b>seu cartão</b> (o que tem a etiqueta <b>Você</b>), escreva o nome da música e toque no botão <b>+</b>.</span></li>
          <li><span>Você só mexe no seu cartão. Se a música for de outra pessoa, o site avisa.</span></li>
        </ol>
      </div>
    ),
    (
      <div className="tour-body" key="3">
        <h2 id="tour-title">O que cada botão faz</h2>
        <p>Em cada música do seu cartão aparecem estes botões:</p>
        <div className="tour-demo" aria-hidden="true">
          <div className="tour-song">
            <b>Tudo é Teu</b>
            <div className="tour-acts">
              <span className="act"><FlagIcon /> Emergência</span>
              <span className="act"><ReleaseIcon /> Disponível</span>
              <span className="act danger"><TrashIcon /> Remover</span>
            </div>
          </div>
        </div>
        <ul className="tour-legend">
          <li><Dot k="warn" /><span><b>Emergência:</b> qualquer pessoa da banda pode cantar, se precisar.</span></li>
          <li><Dot k="info" /><span><b>Disponível:</b> você não quer mais cantar. A música sai do seu repertório e vai para a lista de disponíveis.</span></li>
          <li><Dot k="bad" /><span><b>Remover:</b> apaga a música do site.</span></li>
        </ul>
      </div>
    ),
    (
      <div className="tour-body" key="4">
        <h2 id="tour-title">Músicas disponíveis</h2>
        <p>É a lista das músicas que alguém deixou de cantar. Ela mostra quem cantava antes.</p>
        <div className="tour-demo" aria-hidden="true">
          <div className="tour-song">
            <div><b>Tudo é Teu</b><small>Antes cantada por Maria</small></div>
            <div className="tour-acts"><span className="act primary"><MicIcon /> Quero cantar</span></div>
          </div>
        </div>
        <p>Quer cantar uma delas? Toque em <b>Quero cantar</b>. A música vai direto para o seu repertório e sai da lista.</p>
      </div>
    ),
    (
      <div className="tour-body" key="5">
        <h2 id="tour-title">Sugestões</h2>
        <p>Na seção <b>Sugestões</b>, qualquer pessoa pode sugerir uma música para a semana ou para um culto. Todos veem quem sugeriu.</p>
        <div className="tour-demo" aria-hidden="true">
          <div className="tour-card">
            <div className="tour-card-head"><b>Tudo é Teu</b><span><PencilIcon /></span></div>
            <small>Original: Ministério Zoe</small>
            <div className="tour-note">Boa para abrir o culto de domingo. Tom em Sol.</div>
          </div>
        </div>
        <p>Use a <b>observação</b> para dizer o culto, o tom ou quem poderia cantar. Para mudar depois, toque no <b>lápis</b>.</p>
      </div>
    ),
    (
      <div className="tour-body" key="6">
        <h2 id="tour-title">Outras dicas</h2>
        <ul className="tour-legend plain">
          <li><ChevronIcon /><span>Toque no <b>título de cada lista</b> para abrir ou fechar. O botão <b>Expandir tudo</b> abre todas de uma vez.</span></li>
          <li><SearchIcon /><span>Os números no topo mostram quantas vozes, músicas, emergências, disponíveis e sugestões existem.</span></li>
          <li><PlusIcon /><span>Em <b>Cantores e cantoras</b>, use <b>Todos / Cantoras / Cantores</b> para filtrar a lista.</span></li>
          <li><SunIcon /><span>O botão de <b>sol e lua</b> troca entre o modo claro e o escuro.</span></li>
          <li><BulbIcon /><span>Ficou com dúvida? O botão <b>Ajuda</b>, no topo, abre este tutorial de novo.</span></li>
        </ul>
      </div>
    ),
  ];
  if (isAdmin) {
    steps.push(
      <div className="tour-body" key="7">
        <h2 id="tour-title">Para quem administra</h2>
        <p>Na aba <b>Administração</b> você adiciona cantores e cantoras, troca permissões e exclui perfis. Nas listas, você também pode remover ou mover qualquer música.</p>
      </div>
    );
  }

  const total = steps.length;
  const last = step === total - 1;

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
        {steps[step]}
        <footer className="tour-foot">
          <div className="tour-dots" role="img" aria-label={`Passo ${step + 1} de ${total}`}>
            {steps.map((_, i) => <span key={i} className={i === step ? 'on' : ''} />)}
          </div>
          <div className="tour-btns">
            {step > 0
              ? <button className="btn-ghost sm" onClick={() => setStep(step - 1)}>Voltar</button>
              : <button className="link" onClick={onClose}>Pular</button>}
            {last
              ? <button ref={primary} className="btn" onClick={onClose}>Entendi, vamos lá</button>
              : <button ref={primary} className="btn" onClick={() => setStep(step + 1)}>{step === 0 ? 'Começar' : 'Próximo'}</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}
