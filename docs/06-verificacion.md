# Verificaciones de la preparación

Fecha: 20 de noviembre de 2026.

Comprobaciones ejecutadas localmente:

- Compilación de TypeScript y frontend con `npm run build`: correcta.
- Vitest: 3 pruebas de interfaz aprobadas.
- pytest: 9 pruebas aprobadas (3 unitarias y 6 de integración API/BD).
- Playwright Chromium: 3 E2E aprobadas contra React y FastAPI reales.
- Migración Alembic inicial, inicialización del contenido y `alembic check`: correctos sobre una BD local de prueba.
- Auditoría npm después de actualizar Vite y Vitest: sin vulnerabilidades reportadas en las dependencias instaladas.
- Terraform `fmt -check` y `validate`: correctos; la validación se ejecutó con Terraform 1.16.0 y proveedor OCI 7.32.0 en Ubuntu WSL.
- Sintaxis de archivos Python, PowerShell, JSON y YAML: correcta.
- Sintaxis del playbook Ansible comprobada en Ubuntu WSL con sus colecciones instaladas, sin ejecutar tareas remotas.
- `docker compose config --quiet`: correcto para las combinaciones local y producción.
- Revisión visual del sitio y del panel en Chromium; sin desbordamiento horizontal a 390 px.

Las pruebas de backend y E2E locales usaron **SQLite**, porque Docker Desktop no estaba en ejecución. No equivalen a verificar PostgreSQL ni las imágenes Docker. Los workflows ejecutarán la integración sobre PostgreSQL real y las E2E con todos los servicios en Docker.

La validación de Terraform con el ejecutable de Windows encontró un error TLS en la comunicación con el plugin local; se completó usando el ejecutable nativo de Linux en WSL. No se desactivó la verificación de certificados para solucionarlo.

Pendiente de ejecutar con tu configuración:

- Construcción y arranque completos mediante Docker Desktop o CI.
- Integración y migraciones contra PostgreSQL en CI.
- Publicación de imágenes usando tu token de Docker Hub.
- `terraform plan/apply` con credenciales y bucket del nuevo proyecto.
- Configuración y despliegue real por Ansible, verificación del firewall y HTTPS en OCI.

No se ha hecho commit, push ni despliegue a Oracle durante esta preparación. Las credenciales de los ejemplos no se copiaron al repositorio.
