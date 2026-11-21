import { useState, type ReactNode } from 'react';
import { api } from './api';
import type { Project } from './types';

export function Section({ id, title, icon, children }: { id: string; title: string; icon: string; children: ReactNode }) {
  return <section className="section glass-card reveal visible" id={id}><div className="section-header"><span className="section-icon"><i className={icon} aria-hidden="true" /></span><h2 className="section-title gradient-text">{title}</h2></div>{children}</section>;
}

export function filterProjects(projects: Project[], query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return projects.filter(p => `${p.title} ${p.tags.join(' ')} ${p.status}`.toLocaleLowerCase().includes(needle));
}

export function Projects({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState('');
  const filtered = filterProjects(projects, query);
  return <><label className="field">Filtrar proyectos<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tecnología, nombre o estado" /></label><div className="projects-grid">{filtered.map((p, i) => <article className="project-card" key={`${p.title}-${i}`}><div className="project-top"><div className="project-icon-wrap"><i className={p.icon} aria-hidden="true" /></div><div className="project-links">{p.repository && <a href={p.repository} className="proj-link" target="_blank" rel="noopener noreferrer" aria-label={`Repositorio de ${p.title}`}><i className="fab fa-github" /></a>}{p.demo && <a href={p.demo} className="proj-link" target="_blank" rel="noopener noreferrer" aria-label={`Demo de ${p.title}`}><i className="fas fa-arrow-up-right-from-square" /></a>}</div></div>{p.status && <div className="project-status">{p.status}</div>}<h3 className="project-title">{p.title}</h3><p className="project-desc">{p.description}</p><Tags tags={p.tags} /></article>)}</div>{!filtered.length && <p role="status">No se encontraron proyectos.</p>}</>;
}

export function Tags({ tags }: { tags: string[] }) {
  return <div className="project-tags">{tags.map((tag, i) => <span key={`${tag}-${i}`}>{tag}</span>)}</div>;
}

export function ContactForm() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setStatus('');
    try {
      await api('/contact', { method: 'POST', body: JSON.stringify({ name: data.get('name'), email: data.get('email'), phone: data.get('phone'), message: data.get('message'), consent: data.get('consent') === 'on', website: data.get('website') }) });
      form.reset(); setStatus('Mensaje recibido. Gracias por contactarme.');
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="contact-form"><p>Cuéntame sobre tu proyecto o consulta. Tus datos se usarán para responderte y no se publicarán.</p><div className="form-grid"><label className="field">Nombre<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label><label className="field">Correo electrónico<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label className="field">Teléfono (opcional)<input name="phone" type="tel" maxLength={40} autoComplete="tel" /></label></div><label className="field">Mensaje<textarea name="message" required minLength={10} maxLength={4000} rows={5} /></label><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div><label className="check-label"><input type="checkbox" name="consent" required /> Acepto que se guarden mis datos para responder esta consulta. Puedo solicitar su eliminación mediante el correo del portafolio.</label><button disabled={busy} type="submit">{busy ? 'Enviando…' : 'Enviar mensaje'}</button><p role="status" aria-live="polite">{status}</p></form>;
}
