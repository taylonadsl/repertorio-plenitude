'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { norm, initials, voiceOf } from '@/lib/utils';
import AdminPanel from './AdminPanel';
import Suggestions from './Suggestions';
import Collapse from './Collapse';
import Tutorial, { tutorialJaVisto, tutorialMarcarVisto } from './Tutorial';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import { SearchIcon, TrashIcon, FlagIcon, PlusIcon, XIcon, ReleaseIcon, MicIcon, HelpIcon, ChevronIcon } from './Icons';
import { LogoMark } from './Equalizer';

const TONES = ['#2f6bff', '#0e9ad8', '#7457f0', '#0f9f8f', '#d9487f', '#d98a12'];
const toneOf = (n = '') => TONES[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

function Avatar({ p, size = 40 }) {
  const st = { width: size, height: size, fontSize: size * 0.36 };
  return p.avatar_url
    ? <img className="av" style={st} src={p.avatar_url} alt="" referrerPolicy="no-referrer" />
    : <span className="av" style={{ ...st, background: toneOf(p.name) }}>{initials(p.name)}</span>;
}

export default function Dashboard({ me, onSignOut }) {
  const isAdmin = me.role === 'admin';
  const [profiles, setProfiles] = useState([]);
  const [songs, setSongs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState('');
  const [artist, setArtist] = useState('');
  const [tab, setTab] = useState('repertorio');
  const [who, setWho] = useState('todos');
  // Listas recolhíveis: chave -> aberta/fechada. O cartão da própria pessoa começa aberto.
  const [openMap, setOpenMap] = useState({});
  const isOpen = (k, def = false) => (k in openMap ? openMap[k] : def);
  const toggle = (k, def = false) => setOpenMap((m) => ({ ...m, [k]: !(k in m ? m[k] : def) }));
  const [msg, setMsg] = useState(null);
  // Tutorial geral: abre na primeira vez (ou em nova versão do tutorial) e pelo botão "Ajuda".
  // Para abrir toda vez que a pessoa entra, troque MOSTRAR_SEMPRE para true em Tutorial.js.
  const [tour, setTour] = useState(false);
  useEffect(() => { if (!tutorialJaVisto()) setTour(true); }, []);
  const closeTour = () => { tutorialMarcarVisto(); setTour(false); };

  const toast = (text, type = 'ok') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3200); };

  const load = useCallback(async () => {
    const [p, s, g] = await Promise.all([
      supabase.from('profiles').select('*').order('name'),
      supabase.from('songs').select('*').order('title'),
      supabase.from('suggestions').select('*').order('created_at', { ascending: false }),
    ]);
    setProfiles(p.data || []); setSongs(s.data || []); setSuggestions(g.data || []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('plenitude')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const byId = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);
  const q = norm(query);
  // Ao pesquisar, abre tudo para mostrar os resultados
  useEffect(() => {
    if (!q) return;
    setOpenMap({ sug: true, disp: true, emerg: true, ...Object.fromEntries(profiles.map((p) => ['p:' + p.id, true])) });
  }, [q, profiles]);
  const setAll = (open) => setOpenMap({ sug: open, disp: open, emerg: open, ...Object.fromEntries(profiles.map((p) => ['p:' + p.id, open])) });
  const allClosed = !['sug', 'disp', 'emerg'].some((k) => isOpen(k)) && !profiles.some((p) => isOpen('p:' + p.id, p.id === me.id));
  const exact = q ? songs.find((s) => s.title_key === q) : null;
  const matches = (s) => !q || norm(s.title).includes(q) || norm(s.artist || '').includes(q) || norm(s.note || '').includes(q);

  const addSong = async (title, { ownerId = null, emergency = false, artistName = '' } = {}) => {
    const clean = title.trim();
    if (!clean) return;
    const { error } = await supabase.from('songs').insert({
      title: clean, artist: artistName.trim() || null, title_key: norm(clean),
      owner_id: emergency ? null : ownerId, is_emergency: emergency, added_by: me.id,
    });
    if (error) return toast(error.code === '23505' ? 'Essa música já está no repertório de alguém.' : 'Não foi possível adicionar.', 'err');
    toast(emergency ? 'Adicionada às músicas de emergência.' : 'Música adicionada!');
    setQuery(''); setArtist(''); load();
  };

  const removeSong = async (s) => {
    if (!confirm(`Remover "${s.title}"?`)) return;
    const { error } = await supabase.from('songs').delete().eq('id', s.id);
    error ? toast('Você não pode remover esta música.', 'err') : (toast('Música removida.'), load());
  };

  const toEmergency = async (s) => {
    const { error } = await supabase.from('songs').update({ is_emergency: true, owner_id: null }).eq('id', s.id);
    error ? toast('Não foi possível mover.', 'err') : (toast('Movida para emergência.'), load());
  };

  const toAvailable = async (s) => {
    if (!confirm(`Deixar "${s.title}" disponível? Ela sai do repertório e qualquer pessoa da banda poderá assumir.`)) return;
    const { error } = await supabase.from('songs').update({ is_available: true, is_emergency: false, owner_id: null, released_by: s.owner_id }).eq('id', s.id);
    error ? toast('Não foi possível deixar disponível.', 'err') : (toast('Música disponível para a banda.'), load());
  };

  const claimSong = async (s) => {
    const { data, error } = await supabase.from('songs')
      .update({ owner_id: me.id, is_available: false, is_emergency: false, released_by: null })
      .eq('id', s.id).eq('is_available', true).select();
    if (error || !data?.length) return toast('Alguém já assumiu essa música.', 'err');
    toast(`"${s.title}" agora está no seu repertório!`); setQuery(''); load();
  };

  const emergencyAll = songs.filter((s) => s.is_emergency);
  const emergency = emergencyAll.filter(matches);
  const availableAll = songs.filter((s) => s.is_available);
  const available = availableAll.filter(matches);
  const singers = profiles
    .map((p) => ({ ...p, list: songs.filter((s) => s.owner_id === p.id) }))
    .map((p) => ({ ...p, shown: p.list.filter(matches), nameHit: q && norm(p.name).includes(q) }))
    .filter((p) => !q || p.shown.length || p.nameHit)
    .filter((p) => who === 'todos' || p.gender === who);

  let st = null;
  if (q) {
    if (exact?.is_emergency) st = { kind: 'emerg', text: <>“{exact.title}” é uma <b>música de emergência</b>: qualquer pessoa da banda pode cantar.</> };
    else if (exact?.is_available) st = { kind: 'avail', song: exact, text: <>“{exact.title}” está nas <b>músicas disponíveis</b>{byId[exact.released_by] ? <> (antes cantada por {byId[exact.released_by].name})</> : null}. Quem quiser pode assumir.</> };
    else if (exact) st = { kind: 'taken', text: <>“{exact.title}” já pertence ao repertório de <b>{byId[exact.owner_id]?.name || 'outra pessoa'}</b>.</> };
    else st = { kind: 'free', text: <>Ninguém canta “{query.trim()}” ainda. Está livre!</> };
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><LogoMark /> Plenitude</div>
        <div className="tools">
          <ThemeToggle />
          <Avatar p={me} size={36} />
          <span className="who">{me.name.split(' ')[0]}{isAdmin && <em>ADM</em>}</span>
          <button className="btn-ghost sm help-btn" onClick={() => setTour(true)} aria-label="Ajuda: abrir o tutorial"><HelpIcon /><span>Ajuda</span></button>
          <button className="btn-ghost sm" onClick={onSignOut}>Sair</button>
        </div>
        <nav className="tabs-nav" aria-label="Seções">
          <button className={tab === 'repertorio' ? 'on' : ''} onClick={() => setTab('repertorio')}>Repertório</button>
          {isAdmin && <button className={tab === 'admin' ? 'on' : ''} onClick={() => setTab('admin')}>Administração</button>}
        </nav>
      </header>

      {tab === 'admin' && isAdmin ? (
        <AdminPanel profiles={profiles} me={me} onChange={load} toast={toast} />
      ) : (
        <main>
          <section className="finder">
            <h1>Alguém já canta essa música?</h1>
            <p className="lede">Pesquise antes de escolher. O site avisa se outro cantor ou cantora já canta.</p>
            <div className="search glass">
              <SearchIcon />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Música, artista ou cantor(a)" aria-label="Pesquisar" />
              {query && <button className="icon-btn sm" onClick={() => setQuery('')} aria-label="Limpar busca"><XIcon /></button>}
            </div>
            {st && (
              <div className={`status ${st.kind}`} role="status">
                <p>{st.text}</p>
                {st.kind === 'free' && (
                  <div className="actions">
                    <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Cantor original (opcional)" />
                    <button className="btn" onClick={() => addSong(query, { ownerId: me.id, artistName: artist })}>Cantar esta música</button>
                    <button className="btn-ghost" onClick={() => addSong(query, { emergency: true, artistName: artist })}>Marcar como emergência</button>
                  </div>
                )}
                {st.kind === 'avail' && (
                  <div className="actions single">
                    <button className="btn" onClick={() => claimSong(st.song)}>Quero cantar esta música</button>
                  </div>
                )}
              </div>
            )}
            <dl className="stats">
              <div><dt>Vozes</dt><dd>{profiles.length}</dd></div>
              <div><dt>Músicas</dt><dd>{songs.length}</dd></div>
              <div><dt>Emergência</dt><dd>{emergencyAll.length}</dd></div>
              <div><dt>Disponíveis</dt><dd>{availableAll.length}</dd></div>
              <div><dt>Sugestões</dt><dd>{suggestions.length}</dd></div>
            </dl>
          </section>

          <div className="expand-bar">
            <button type="button" className="btn-ghost sm" onClick={() => setAll(allClosed)}>{allClosed ? 'Expandir tudo' : 'Recolher tudo'}</button>
          </div>

          <Suggestions
            items={suggestions.filter(matches)}
            byId={byId} me={me} isAdmin={isAdmin} toast={toast} onChange={load} tone={toneOf}
            open={isOpen('sug')} onToggle={() => toggle('sug')}
          />

          <Collapse id="disp" className="available" title="Músicas disponíveis" hint="cantoras que não querem mais cantar. Quem quiser, assume"
            count={available.length} open={isOpen('disp')} onToggle={() => toggle('disp')}>
            <ul className="songs">
              {available.length === 0 && <li className="empty">Nenhuma música disponível{q ? ' com essa busca' : ' no momento'}.</li>}
              {available.map((s) => (
                <Song key={s.id} s={s} hit={!!q} onClaim={claimSong}
                  note={byId[s.released_by] ? `Antes cantada por ${byId[s.released_by].name}` : null}
                  canDelete={isAdmin || s.added_by === me.id} onDelete={removeSong} />
              ))}
            </ul>
          </Collapse>

          <Collapse id="emerg" className="emergency" title="Músicas de emergência" hint="qualquer pessoa da banda pode assumir"
            count={emergency.length} open={isOpen('emerg')} onToggle={() => toggle('emerg')}>
            <ul className="songs">
              {emergency.length === 0 && <li className="empty">Nenhuma música de emergência{q ? ' com essa busca' : ' ainda'}.</li>}
              {emergency.map((s) => <Song key={s.id} s={s} hit={!!q} canDelete={isAdmin || s.added_by === me.id} onDelete={removeSong} />)}
            </ul>
          </Collapse>

          <div className="section-head">
            <h2 className="section-title">Cantores e cantoras</h2>
            <div className="filter" role="group" aria-label="Filtrar vozes">
              {[['todos', 'Todos'], ['f', 'Cantoras'], ['m', 'Cantores']].map(([k, l]) => (
                <button key={k} className={who === k ? 'on' : ''} aria-pressed={who === k} onClick={() => setWho(k)}>{l}</button>
              ))}
            </div>
          </div>
          <section className="grid">
            {singers.length === 0 && <p className="empty">Ninguém encontrado com essa busca.</p>}
            {singers.map((p) => {
              const mine = p.id === me.id;
              const canEdit = mine || isAdmin;
              const key = 'p:' + p.id;
              const open = isOpen(key, mine);
              return (
                <article key={p.id} className={`card glass ${mine ? 'mine' : ''}`}>
                  <header>
                    <button type="button" className="card-toggle" aria-expanded={open} aria-controls={`p-${p.id}`} onClick={() => toggle(key, mine)}>
                      <Avatar p={p} />
                      <span className="card-name"><h3>{p.name}</h3><small>{voiceOf(p.gender)}, {p.list.length} {p.list.length === 1 ? 'música' : 'músicas'}</small></span>
                      {mine && <span className="badge">Você</span>}
                      <ChevronIcon />
                    </button>
                  </header>
                  {open && (
                    <div id={`p-${p.id}`} className="coll-body">
                      <ul className="songs">
                        {p.shown.length === 0 && <li className="empty">{p.list.length ? 'Nada nesta busca.' : 'Ainda sem músicas.'}</li>}
                        {p.shown.map((s) => <Song key={s.id} s={s} hit={!!q} canDelete={canEdit} onDelete={removeSong} onEmergency={canEdit ? toEmergency : null} onAvailable={canEdit ? toAvailable : null} />)}
                      </ul>
                      {canEdit && <AddInline onAdd={(t, a) => addSong(t, { ownerId: p.id, artistName: a })} />}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </main>
      )}
      <Footer />
      {msg && <div className={`toast ${msg.type}`} role="status">{msg.text}</div>}
      {tour && <Tutorial isAdmin={isAdmin} onClose={closeTour} />}
    </div>
  );
}

function Song({ s, hit, canDelete, onDelete, onEmergency, onAvailable, onClaim, note }) {
  return (
    <li className={`song ${hit ? 'hit' : ''}`}>
      <div className="info">
        <span className="t">{s.title}</span>
        {s.artist && <span className="a">Original: {s.artist}</span>}
        {note && <span className="a">{note}</span>}
      </div>
      <div className="acts">
        {onClaim && <button className="act primary" title="Colocar esta música no meu repertório" aria-label={`Quero cantar ${s.title}`} onClick={() => onClaim(s)}><MicIcon /> Quero cantar</button>}
        {onEmergency && !s.is_emergency && <button className="act" title="Qualquer pessoa da banda pode cantar" aria-label={`Mover ${s.title} para emergência`} onClick={() => onEmergency(s)}><FlagIcon /> Emergência</button>}
        {onAvailable && <button className="act" title="Eu não quero mais cantar: deixar livre para outra pessoa" aria-label={`Deixar ${s.title} disponível`} onClick={() => onAvailable(s)}><ReleaseIcon /> Disponível</button>}
        {canDelete && <button className="act danger" title="Apagar do site" aria-label={`Remover ${s.title}`} onClick={() => onDelete(s)}><TrashIcon /> Remover</button>}
      </div>
    </li>
  );
}

function AddInline({ onAdd }) {
  const [v, setV] = useState('');
  const [a, setA] = useState('');
  return (
    <form className="inline" onSubmit={(e) => { e.preventDefault(); if (!v.trim()) return; onAdd(v, a); setV(''); setA(''); }}>
      <div className="inline-fields">
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Nome da música" aria-label="Nome da música" />
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Cantor original (opcional)" aria-label="Cantor original" />
      </div>
      <button className="btn-sm" type="submit" aria-label="Adicionar música"><PlusIcon /></button>
    </form>
  );
}
