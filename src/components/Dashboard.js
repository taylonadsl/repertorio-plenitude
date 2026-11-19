'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { norm, initials, voiceOf } from '@/lib/utils';
import AdminPanel from './AdminPanel';
import Suggestions from './Suggestions';
import WhatsNew, { TOUR_KEY } from './WhatsNew';
import ThemeToggle from './ThemeToggle';
import { SearchIcon, TrashIcon, FlagIcon, PlusIcon, XIcon } from './Icons';
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
  const [msg, setMsg] = useState(null);
  const [tour, setTour] = useState(false);

  // Mostra o tutorial da novidade uma vez por pessoa (neste aparelho)
  useEffect(() => {
    try { if (!localStorage.getItem(`${TOUR_KEY}-${me.id}`)) setTour(true); } catch { setTour(true); }
  }, [me.id]);
  const closeTour = () => {
    try { localStorage.setItem(`${TOUR_KEY}-${me.id}`, '1'); } catch {}
    setTour(false);
  };
  const goToSuggestions = () => {
    closeTour(); setTab('repertorio');
    setTimeout(() => document.querySelector('.suggestions')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

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

  const emergencyAll = songs.filter((s) => s.is_emergency);
  const emergency = emergencyAll.filter(matches);
  const singers = profiles
    .map((p) => ({ ...p, list: songs.filter((s) => s.owner_id === p.id) }))
    .map((p) => ({ ...p, shown: p.list.filter(matches), nameHit: q && norm(p.name).includes(q) }))
    .filter((p) => !q || p.shown.length || p.nameHit)
    .filter((p) => who === 'todos' || p.gender === who);

  let st = null;
  if (q) {
    if (exact?.is_emergency) st = { kind: 'emerg', text: <>“{exact.title}” é uma <b>música de emergência</b>: qualquer pessoa da banda pode cantar.</> };
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
              </div>
            )}
            <dl className="stats">
              <div><dt>Vozes</dt><dd>{profiles.length}</dd></div>
              <div><dt>Músicas</dt><dd>{songs.length}</dd></div>
              <div><dt>Emergência</dt><dd>{emergencyAll.length}</dd></div>
              <div><dt>Sugestões</dt><dd>{suggestions.length}</dd></div>
            </dl>
          </section>

          <section className="block emergency glass">
            <h2>Músicas de emergência <small>qualquer pessoa da banda pode assumir</small></h2>
            <ul className="songs">
              {emergency.length === 0 && <li className="empty">Nenhuma música de emergência{q ? ' com essa busca' : ' ainda'}.</li>}
              {emergency.map((s) => <Song key={s.id} s={s} hit={!!q} canDelete={isAdmin || s.added_by === me.id} onDelete={removeSong} />)}
            </ul>
          </section>

          <Suggestions
            items={suggestions.filter(matches)}
            byId={byId} me={me} isAdmin={isAdmin} toast={toast} onChange={load} tone={toneOf}
          />

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
              return (
                <article key={p.id} className={`card glass ${mine ? 'mine' : ''}`}>
                  <header>
                    <Avatar p={p} />
                    <div><h3>{p.name}</h3><small>{voiceOf(p.gender)}, {p.list.length} {p.list.length === 1 ? 'música' : 'músicas'}</small></div>
                    {mine && <span className="badge">Você</span>}
                  </header>
                  <ul className="songs">
                    {p.shown.length === 0 && <li className="empty">{p.list.length ? 'Nada nesta busca.' : 'Ainda sem músicas.'}</li>}
                    {p.shown.map((s) => <Song key={s.id} s={s} hit={!!q} canDelete={canEdit} onDelete={removeSong} onEmergency={canEdit ? toEmergency : null} />)}
                  </ul>
                  {canEdit && <AddInline onAdd={(t, a) => addSong(t, { ownerId: p.id, artistName: a })} />}
                </article>
              );
            })}
          </section>
        </main>
      )}
      {msg && <div className={`toast ${msg.type}`} role="status">{msg.text}</div>}
      {tour && <WhatsNew onClose={closeTour} onGo={goToSuggestions} />}
    </div>
  );
}

function Song({ s, hit, canDelete, onDelete, onEmergency }) {
  return (
    <li className={`song ${hit ? 'hit' : ''}`}>
      <div className="info"><span className="t">{s.title}</span>{s.artist && <span className="a">Original: {s.artist}</span>}</div>
      <div className="acts">
        {onEmergency && !s.is_emergency && <button className="icon-btn sm" title="Mover para emergência" aria-label={`Mover ${s.title} para emergência`} onClick={() => onEmergency(s)}><FlagIcon /></button>}
        {canDelete && <button className="icon-btn sm danger" title="Remover" aria-label={`Remover ${s.title}`} onClick={() => onDelete(s)}><TrashIcon /></button>}
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
