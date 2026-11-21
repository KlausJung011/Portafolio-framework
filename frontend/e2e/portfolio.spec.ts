import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/admin');
  await page.getByLabel('Usuario', { exact: true }).fill(process.env.ADMIN_USERNAME || 'admin');
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.ADMIN_PASSWORD || 'TestPasswordForCI12345678');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Tu portafolio' })).toBeVisible();
}

test('muestra proyectos reales de la API y permite filtrarlos', async ({ page, request }) => {
  const response = await request.get('/api/portfolio');
  expect(response.ok()).toBeTruthy();
  const { content } = await response.json();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: content.profile.name, exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill(content.projects[0].title);
  await expect(page.locator('.project-card')).toHaveCount(1);
  await expect(page.locator('.project-card')).toContainText(content.projects[0].title);
});

test('un visitante envia una consulta y el administrador puede atenderla', async ({ page }) => {
  const message = `Consulta E2E ${Date.now()}: necesito una aplicación web`;
  await page.goto('/');
  await page.getByLabel('Nombre', { exact: true }).fill('Visitante E2E');
  await page.getByLabel('Correo electrónico').fill('visitante@example.com');
  await page.getByLabel('Mensaje', { exact: true }).fill(message);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('status')).toContainText('Mensaje recibido');
  await login(page);
  await page.getByRole('button', { name: 'Mensajes', exact: true }).click();
  const card = page.locator('.message-card').filter({ hasText: message });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Marcar atendido' }).click();
  await expect(card.getByRole('button', { name: 'Marcar pendiente' })).toBeVisible();
});

test('el administrador edita la presentacion y el cambio aparece en el sitio', async ({ page, request }) => {
  const original = (await (await request.get('/api/portfolio')).json()).content.profile.title;
  await login(page);
  const updated = `Desarrollador de software · E2E ${Date.now()}`;
  try {
    await page.getByLabel('Título', { exact: true }).fill(updated);
    await page.getByRole('button', { name: 'Guardar y publicar' }).click();
    await expect(page.getByRole('status')).toHaveText('Cambios publicados.');
    await page.goto('/');
    await expect(page.locator('.header .title')).toHaveText(updated);
  } finally {
    const payload = await (await page.request.get('/api/portfolio')).json();
    payload.content.profile.title = original;
    const restored = await page.request.put('/api/admin/portfolio', { headers: { 'X-CSRF-Protection': '1' }, data: payload });
    expect(restored.ok()).toBeTruthy();
  }
});
