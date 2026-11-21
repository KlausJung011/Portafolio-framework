import { useEffect, useState } from 'react';
import { api } from './api';
import Admin from './Admin';
import { ContactForm, Projects, Section, Tags } from './components';
import type { Content, Portfolio, Timeline } from './types';

const navigation = [['sobre-mi', 'Sobre mí'], ['intereses', 'Intereses'], ['habilidades', 'Habilidades'], ['idiomas', 'Idiomas'], ['blandas', 'Soft Skills'], ['educacion', 'Educación'], ['experiencia', 'Experiencia'], ['proyectos', 'Proyectos'], ['contacto', 'Contacto']];

function TimelineList({ items }: { items: Timeline[] }) {
  return <div className="timeline">{items.map((item, i) => <article className="timeline-item" key={i}><div className="timeline-dot active" /><div className="timeline-content glass-inner"><div className="tl-header"><div><h3 className="tl-title">{item.title}</h3><div className="tl-company">{item.organization}</div></div><span className="tl-date">{item.period}</span></div><p>{item.description}</p><Tags tags={item.tags} /></div></article>)}</div>;
}

function PublicPortfolio({ content: c }: { content: Content }) {
  const p = c.profile;
  useEffect(() => {
    const nodes = document.querySelectorAll('main section[id]');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return <><a className="skip-link" href="#contenido">Ir al contenido</a><div className="bg-canvas" aria-hidden="true" /><header className="header glass-gradient-border"><div className="header-inner"><div className="profile-wrapper"><div className="profile-img-ring"><img src="/img/perfil.gif" alt={`Foto de ${p.name}`} className="profile-img" /></div><div className="status-badge"><span className="status-dot" />{p.availability}</div></div><div className="header-info"><p className="header-greeting">Hola, soy</p><h1 className="name gradient-text">{p.name}</h1><p className="title">{p.title}</p><div className="contact-row"><a className="contact-chip" href={`mailto:${p.email}`}>{p.email}</a><a className="contact-chip" href={`tel:${p.phone}`}>{p.phone}</a><span className="contact-chip">{p.location}</span></div><div className="social-row"><a href="https://github.com/KlausJung011" className="social-btn" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://www.linkedin.com/in/nicol%C3%A1s-arturo-vargas-silva-749306187" className="social-btn" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://www.instagram.com/klausjung.011" className="social-btn" target="_blank" rel="noopener noreferrer">Instagram</a><a href="/Curriculum_NAVS.pdf" className="social-btn btn-cv" download>Descargar CV</a></div></div></div></header><nav className="sticky-nav" aria-label="Secciones"><div className="nav-inner">{navigation.map(([id, title]) => <a key={id} href={`#${id}`} className="nav-link">{title}</a>)}</div></nav><main className="main-wrapper" id="contenido">
    <Section id="sobre-mi" title="Sobre mí" icon="fas fa-user-astronaut"><div className="about-grid">{p.about.map((paragraph, i) => <p className="about-text" key={i}>{paragraph}</p>)}</div></Section>
    <Section id="intereses" title="Mis intereses" icon="fas fa-compass"><div className="interests-grid">{c.interests.map((item, i) => <article className="interest-card" key={i}><div className="interest-icon"><i className={item.icon} /></div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></Section>
    <Section id="habilidades" title="Habilidades técnicas" icon="fas fa-code"><div className="tech-categories">{c.tech_groups.map((group, i) => <div className="tech-group" key={i}><h3 className="tech-group-title">{group.title}</h3><Tags tags={group.tags} /></div>)}</div><h3 className="skills-bars-title">Nivel de dominio</h3><div className="skills-bars">{c.skills.map((skill, i) => <div className="skill-bar-item" key={i}><div className="skill-bar-label"><span>{skill.name}</span><span>{skill.level}%</span></div><div className="skill-bar-track" role="meter" aria-label={skill.name} aria-valuenow={skill.level} aria-valuemin={0} aria-valuemax={100}><div className="skill-bar-fill filled" style={{ width: `${skill.level}%` }} /></div></div>)}</div></Section>
    <Section id="idiomas" title="Idiomas" icon="fas fa-language"><div className="languages-grid">{c.languages.map((language, i) => <article className="language-card" key={i}><div className="lang-flag">{language.flag}</div><h3 className="lang-name">{language.name}</h3><div className="lang-level-bar"><div className="lang-level-fill filled" style={{ width: `${language.level}%` }} /></div><span className="lang-badge">{language.badge}</span><p className="lang-desc">{language.description}</p></article>)}</div></Section>
    <Section id="blandas" title="Habilidades blandas" icon="fas fa-heart"><div className="soft-skills-grid">{c.soft_skills.map((item, i) => <article className="soft-skill-card" key={i}><div className="soft-icon"><i className={item.icon} /></div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></Section>
    <Section id="educacion" title="Educación" icon="fas fa-graduation-cap"><TimelineList items={c.education} /><h3 className="edu-subsection-title">Certificaciones y cursos</h3><div className="courses-grid">{c.courses.map((course, i) => <article className="course-card" key={i}><div className="course-info"><h4 className="course-title">{course.title}</h4><p className="course-provider">{course.provider}</p><span className="course-year">{course.year}</span></div></article>)}</div></Section>
    <Section id="experiencia" title="Experiencia" icon="fas fa-briefcase"><TimelineList items={c.experience} /></Section>
    <Section id="proyectos" title="Proyectos" icon="fas fa-rocket"><Projects projects={c.projects} /></Section>
    <Section id="contacto" title="Hablemos de tu proyecto" icon="fas fa-envelope"><ContactForm /></Section>
  </main><footer className="footer"><p className="footer-name gradient-text">{p.name}</p><p>Diseñado y desarrollado con creatividad · {new Date().getFullYear()}</p><a href="/admin">Administración</a></footer></>;
}

export default function App() {
  const [portfolio, setPortfolio] = useState<Portfolio>();
  const [error, setError] = useState('');
  useEffect(() => { if (!window.location.pathname.startsWith('/admin')) api<Portfolio>('/portfolio').then(setPortfolio).catch(e => setError(e.message)); }, []);
  if (window.location.pathname.startsWith('/admin')) return <Admin />;
  if (error) return <main className="main-wrapper glass-card section"><h1>El portafolio no está disponible</h1><p role="alert">{error}</p><button onClick={() => location.reload()}>Reintentar</button></main>;
  if (!portfolio) return <main className="main-wrapper"><p role="status">Cargando portafolio…</p></main>;
  return <PublicPortfolio content={portfolio.content} />;
}
