'use client';
import { ChevronIcon } from './Icons';

// Bloco recolhível: o título é um botão que abre e fecha a lista.
export default function Collapse({ id, title, hint, count, open, onToggle, className = '', children }) {
  return (
    <section className={`block collapsible glass ${className}`} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>
        <button type="button" className="coll-head" aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}>
          <span className="coll-title">{title}<span className="count">{count}</span></span>
          {hint && <small>{hint}</small>}
          <ChevronIcon />
        </button>
      </h2>
      {open && <div id={`${id}-body`} className="coll-body">{children}</div>}
    </section>
  );
}
