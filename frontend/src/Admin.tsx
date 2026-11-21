import { useEffect, useState } from 'react';
import { api } from './api';
import type { Content, Message, Portfolio } from './types';

const names: Record<string, string> = { profile: 'Presentación', interests: 'Intereses', tech_groups: 'Tecnologías', skills: 'Habilidades', languages: 'Idiomas', soft_skills: 'Habilidades blandas', education: 'Educación', courses: 'Cursos', experience: 'Experiencia', projects: 'Proyectos', name: 'Nombre', title: 'Título', email: 'Correo', phone: 'Teléfono', location: 'Ubicación', availability: 'Disponibilidad', about: 'Sobre mí (un párrafo por línea)', description: 'Descripción', icon: 'Clase de icono Font Awesome', tags: 'Etiquetas (separadas por coma)', level: 'Nivel (%)', flag: 'Bandera', badge: 'Nivel descriptivo', organization: 'Organización', period: 'Período', provider: 'Institución', year: 'Año', status: 'Estado', repository: 'URL del repositorio', demo: 'URL de la demo' };
const templates: Record<Exclude<keyof Content, 'profile'>, Record<string, unknown>> = {
  interests: { title: '', description: '', icon: 'fas fa-star' }, soft_skills: { title: '', description: '', icon: 'fas fa-star' },
  tech_groups: { title: '', tags: [] }, skills: { name: '', level: 50 }, languages: { name: '', flag: '', level: 50, badge: '', description: '' },
  education: { title: '', organization: '', period: '', description: '', tags: [] }, experience: { title: '', organization: '', period: '', description: '', tags: [] },
  courses: { title: '', provider: '', year: '' }, projects: { title: '', description: '', tags: [], status: '', repository: '', demo: '', icon: 'fas fa-code' },
};

function ObjectEditor({ value, change }: { value: Record<string, unknown>; change: (next: Record<string, unknown>) => void }) {
  return <div className="form-grid">{Object.entries(value).map(([key, val]) => {
    const isArray = Array.isArray(val);
    const text = isArray ? val.join(key === 'about' ? '\n' : ', ') : String(val);
    const update = (input: string) => change({ ...value, [key]: typeof val === 'number' ? Number(input) : isArray ? input.split(key === 'about' ? '\n' : ',').map(s => s.trim()) : input });
    return <label className={`field ${['description', 'about'].includes(key) ? 'wide' : ''}`} key={key}>{names[key] ?? key}{['description', 'about'].includes(key) ? <textarea rows={4} value={text} onChange={e => update(e.target.value)} /> : <input type={typeof val === 'number' ? 'number' : key === 'email' ? 'email' : 'text'} min={typeof val === 'number' ? 0 : undefined} max={typeof val === 'number' ? 100 : undefined} value={text} onChange={e => update(e.target.value)} />}</label>;
  })}</div>;
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<Portfolio>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<keyof Content | 'messages'>('profile');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [offset, setOffset] = useState(0);
  async function loadContent() {
    const data = await api<Portfolio>('/portfolio');
    setPortfolio(data); setDirty(false);
  }
  async function loadMessages(nextOffset = offset) {
    setMessages(await api<Message[]>(`/admin/messages?offset=${nextOffset}`));
    setOffset(nextOffset);
  }
  useEffect(() => {
    api('/admin/me').then(async () => { setAuthenticated(true); await loadContent(); await loadMessages(0); }).catch(() => setAuthenticated(false)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setNotice('');
    try { await api('/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(data)) }); setAuthenticated(true); await loadContent(); await loadMessages(0); }
    catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  }
  function changeSection(value: unknown) {
    if (!portfolio || tab === 'messages') return;
    setPortfolio({ ...portfolio, content: { ...portfolio.content, [tab]: value } }); setDirty(true); setNotice('');
  }
  async function save() {
    setBusy(true); setNotice('');
    try {
      // Elimina etiquetas/párrafos vacíos al guardar; el editor mantiene el separador mientras escribes.
      const clean = JSON.parse(JSON.stringify(portfolio), (key, value) => ['tags', 'about'].includes(key) && Array.isArray(value) ? value.filter(Boolean) : value);
      setPortfolio(await api<Portfolio>('/admin/portfolio', { method: 'PUT', body: JSON.stringify(clean) })); setDirty(false); setNotice('Cambios publicados.');
    } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  }
  async function run(action: () => Promise<unknown>) {
    setBusy(true); setNotice('');
    try { await action(); } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  }
  if (loading) return <main className="admin-shell"><p role="status">Comprobando sesión…</p></main>;
  if (!authenticated) return <main className="admin-shell login-shell"><div className="bg-canvas" /><section className="section glass-card"><a href="/">← Volver al portafolio</a><h1 className="gradient-text">Administración</h1><form onSubmit={login}><label className="field">Usuario<input name="username" required autoComplete="username" maxLength={80} /></label><label className="field">Contraseña<input name="password" type="password" required autoComplete="current-password" maxLength={256} /></label><button disabled={busy}>Iniciar sesión</button></form><p role="alert">{notice}</p></section></main>;
  const section = portfolio && tab !== 'messages' ? portfolio.content[tab] : undefined;
  return <main className="admin-shell"><div className="bg-canvas" /><header className="admin-toolbar glass-card"><h1 className="gradient-text">Tu portafolio</h1><a href="/" target="_blank" rel="noopener noreferrer">Ver sitio</a><button disabled={busy} onClick={() => run(async () => { await api('/admin/logout', { method: 'POST' }); setAuthenticated(false); setPortfolio(undefined); setMessages([]); setDirty(false); })}>Cerrar sesión</button></header><nav className="admin-tabs" aria-label="Editor">{[...Object.keys(names).filter(k => k in templates || k === 'profile'), 'messages'].map(key => <button className={tab === key ? 'selected' : ''} key={key} onClick={() => setTab(key as typeof tab)}>{names[key] ?? 'Mensajes'}</button>)}</nav><p role="status" aria-live="polite">{notice}</p>{tab === 'messages' ? <section className="section glass-card"><h2>Mensajes recibidos</h2><button disabled={busy} onClick={() => run(() => loadMessages())}>Actualizar mensajes</button>{messages.length === 0 && <p>No hay mensajes en esta página.</p>}{messages.map(message => <article className="message-card glass-inner" key={message.id}><h3>{message.name}</h3><a href={`mailto:${message.email}`}>{message.email}</a><p>{message.phone}</p><p>{new Date(message.created_at * 1000).toLocaleString('es-BO')}</p><p className="preserve-lines">{message.message}</p><button disabled={busy} onClick={() => run(async () => { await api(`/admin/messages/${message.id}`, { method: 'PATCH', body: JSON.stringify({ attended: !message.attended }) }); await loadMessages(); })}>{message.attended ? 'Marcar pendiente' : 'Marcar atendido'}</button><button className="danger" disabled={busy} onClick={() => { if (confirm('¿Eliminar definitivamente este mensaje y sus datos de contacto?')) run(async () => { await api(`/admin/messages/${message.id}`, { method: 'DELETE' }); await loadMessages(); }); }}>Eliminar mensaje</button></article>)}<div className="admin-toolbar"><button disabled={busy || offset === 0} onClick={() => run(() => loadMessages(Math.max(0, offset - 100)))}>Anterior</button><span>Página {offset / 100 + 1}</span><button disabled={busy || messages.length < 100} onClick={() => run(() => loadMessages(offset + 100))}>Siguiente</button></div></section> : <section className="section glass-card"><h2>{names[tab]}</h2><p>Los cambios se publican al guardar. {dirty ? 'Tienes cambios pendientes.' : ''}</p><fieldset disabled={busy}>{tab === 'profile' && section && <ObjectEditor value={section as unknown as Record<string, unknown>} change={changeSection} />}{Array.isArray(section) && <>{section.map((item, i) => <details key={`${tab}-${i}`} className="editor-card glass-inner" open={undefined}><summary>{(item as { title?: string; name?: string }).title || (item as { name?: string }).name || `Elemento ${i + 1}`}</summary><ObjectEditor value={item as unknown as Record<string, unknown>} change={next => changeSection(section.map((old, j) => j === i ? next : old))} /><button type="button" className="danger" onClick={() => { if (confirm('¿Quitar este elemento? Se aplicará al guardar.')) changeSection(section.filter((_, j) => j !== i)); }}>Quitar elemento</button></details>)}<button type="button" onClick={() => changeSection([...section, structuredClone(templates[tab as Exclude<keyof Content, 'profile'>])])}>Añadir elemento</button></>}</fieldset><div className="admin-toolbar"><button disabled={busy || !dirty} onClick={save}>{busy ? 'Guardando…' : 'Guardar y publicar'}</button><button disabled={busy} onClick={() => { if (!dirty || confirm('¿Descartar los cambios pendientes?')) run(loadContent); }}>Recargar contenido</button></div></section>}</main>;
}
