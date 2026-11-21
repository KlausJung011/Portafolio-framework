import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ContactForm, filterProjects, Projects } from './components';
import type { Project } from './types';

const projects: Project[] = [
  { title: 'Web de música', description: 'Arte digital', tags: ['React'], status: 'Publicado', repository: '', demo: '', icon: 'fas fa-music' },
  { title: 'Robótica', description: 'Automatización', tags: ['Python'], status: 'En desarrollo', repository: '', demo: '', icon: 'fas fa-code' },
];
describe('Proyectos y contacto', () => {
  it('filtra por tecnología sin distinguir mayúsculas y espacios externos', () => {
    expect(filterProjects(projects, '  REACT  ')).toEqual([projects[0]]);
  });
  it('informa cuando no hay resultados en el filtro visible', () => {
    render(<Projects projects={projects} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'inexistente' } });
    expect(screen.getByRole('status')).toHaveTextContent('No se encontraron proyectos');
    expect(screen.queryByRole('heading', { name: 'Robótica' })).not.toBeInTheDocument();
  });
  it('exige consentimiento, correo y mensaje antes de enviar', () => {
    render(<ContactForm />);
    expect(screen.getByRole('checkbox')).toBeRequired();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Mensaje')).toHaveAttribute('minlength', '10');
    expect(screen.getByRole('button', { name: 'Enviar mensaje' }).closest('form')?.checkValidity()).toBe(false);
  });
});
