# Arquitectura y evidencias de la práctica

```text
Visitante / administrador
          │ HTTP 80 -> redirección HTTPS 443
          ▼
VM Ubuntu 24.04 en subred pública de una VCN nueva
  ┌──────────────────────────────────────────────────┐
  │ web: Nginx + React compilado                      │
  │          │ /api                                  │
  │          ▼                                       │
  │ api: FastAPI ────────► db: PostgreSQL              │
  │                            │                     │
  │                      volumen persistente         │
  └──────────────────────────────────────────────────┘
```

Solo Nginx publica puertos HTTP/HTTPS. Para esta práctica, `ADMIN_SSH_CIDR=0.0.0.0/0` permite llegar al puerto SSH 22 desde cualquier IPv4, manteniendo la autenticación mediante clave privada. También admite una IP de administrador `/32`; si se deja vacío, solo se agrega la IP `/32` del runner. Docker aplica red privada entre servicios; PostgreSQL no publica 5432. La lista de seguridad de OCI y las reglas iptables de la VM se configuran por separado.

Terraform crea VCN, gateway, tabla de rutas, lista de seguridad, subred y una instancia nueva. El bucket privado conserva el estado Terraform y sus versiones. Su bloqueo impide escrituras simultáneas al estado; GitHub `concurrency` serializa los despliegues. No bloquea consultas del sitio ni PostgreSQL.

Ansible instala y configura Docker, Compose, Git, certificado de laboratorio y firewall persistente mediante systemd. Se usan cadenas iptables propias para INPUT y DOCKER-USER, sin vaciar las reglas de Docker. Copia los archivos del commit exacto que está desplegándose: no ejecuta `git pull main` en la VM, que podría introducir otro commit.

## Persistencia y autenticación

- `portfolio`: documento JSON validado por Pydantic, con revisión para evitar sobrescrituras concurrentes.
- `messages`: consultas y contactos privados; consentimiento obligatorio, campo trampa y límite de envío por IP.
- `admins`: contraseña protegida con Argon2, sin registro público.
- `admin_sessions`: hash de token aleatorio, expiración de ocho horas y revocación al salir.
- Cookie HttpOnly, SameSite=Strict y Secure en producción. Las operaciones administrativas de escritura requieren un encabezado CSRF; la API no habilita CORS.
- El proceso de API es uno solo; el limitador de intentos está en memoria y se reinicia con el proceso. Para escalar a varios procesos/VM, centraliza ese límite en Redis u otro almacenamiento compartido.
- React representa el contenido como texto; el panel no acepta HTML arbitrario. Los enlaces de proyectos se validan para usar HTTP/HTTPS.

## Pruebas incluidas

| Tipo | Archivo | Casos |
|---|---|---|
| Unitarias frontend | `frontend/src/components.test.tsx` | Filtro normalizado, estado sin resultados, validación del formulario |
| Unitarias backend | `backend/tests/test_unit.py` | Consentimiento, rechazo de URL ejecutable, hash de contraseña/token |
| Integración backend | `backend/tests/test_integration.py` | Lectura de BD, persistencia y privacidad del mensaje, rechazo sin inserción, edición/conflicto, CSRF/logout, atención/eliminación |
| E2E | `frontend/e2e/portfolio.spec.ts` | Proyectos reales y filtro, consulta visitante y atención admin, edición y visualización pública |

Hay seis unitarias, seis de integración y tres E2E. CI usa PostgreSQL descartable para integración y la aplicación completa en Docker para E2E. No se hacen mocks de API en E2E.

## Evidencias sugeridas para entregar

1. Capturas del portafolio en escritorio y móvil manteniendo transparencias, fondos oscuros y gradientes.
2. Editor administrativo, cambio guardado y el resultado público.
3. Envío de consulta y recepción en el panel, ocultando contactos personales.
4. Push a `dev` con los tres jobs de CI aprobados y el reporte de Playwright.
5. Push a `main` con pruebas, publicación de imágenes y despliegue aprobados.
6. Docker Hub con imágenes y etiquetas SHA, sin mostrar tokens.
7. OCI: VCN, subred, rutas, reglas, VM Ubuntu y su IP creadas por Terraform.
8. Bucket privado con versionado y objeto de estado (sin mostrar contenido sensible del estado).
9. Resultado de `docker compose ps`, comprobación HTTPS y reglas del firewall en la VM.

## Límites y decisiones

No hay Cloudflare, dominio, SMTP, registro de usuarios ni upload de archivos. El certificado es de laboratorio; el despliegue en una sola VM tiene interrupción breve y los backups previos se almacenan inicialmente en ella. Los recursos OCI requieren permisos, cuotas, una imagen compatible y capacidad disponible. El shape/imagen se parametrizan, pero cambiar arquitectura requiere adaptar también las imágenes Docker.

Fuentes: [Docker y firewalls](https://docs.docker.com/engine/network/packet-filtering-firewalls/), [backend OCI](https://developer.hashicorp.com/terraform/language/backend/oci), [Compose en Ansible](https://docs.ansible.com/projects/ansible/latest/collections/community/docker/docker_compose_v2_module.html), [Playwright](https://playwright.dev/docs/intro).
