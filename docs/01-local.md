# Ejecutar y probar en Windows

## Requisitos

- Docker Desktop iniciado, usando contenedores Linux / WSL2.
- Git; Node.js 22.14 o posterior y npm para las pruebas frontend.
- Python 3.13 para pruebas backend fuera de Docker.
- Terraform 1.12 o posterior para infraestructura; el pipeline usa 1.16.0.
- Ansible se ejecuta en el runner Linux de GitHub; para usarlo manualmente en tu PC, utiliza WSL, no PowerShell nativo.

Los comandos PowerShell parten de la carpeta del proyecto:

```powershell
cd C:\Niko\UnivalleISI\Semestre6\ProyectoSistemas3\Practicas\Practica32\Portafolio-framework
```

## Primera ejecución con Docker

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-local.ps1
docker info
docker compose -f compose.yml -f compose.local.yml --profile tools build
docker compose -f compose.yml -f compose.local.yml run --rm init
docker compose -f compose.yml -f compose.local.yml up -d --wait --wait-timeout 180
docker compose -f compose.yml -f compose.local.yml ps
Invoke-RestMethod http://localhost:8080/api/health
Start-Process http://localhost:8080
```

Entra a http://localhost:8080/admin. El usuario inicial es `admin`. Consulta la contraseña generada **solo en tu equipo**:

```powershell
Get-Content .env | Select-String '^ADMIN_PASSWORD='
```

El script no reemplaza un `.env` existente. Las contraseñas de ejemplo no son utilizables para inicializar el administrador. Cambiar `ADMIN_PASSWORD` después de la primera ejecución no modifica por sí solo el usuario ya guardado; consulta la guía de operación.

La primera inicialización aplica Alembic y carga el contenido original si la tabla está vacía. Las siguientes ejecuciones conservan las ediciones del panel. PostgreSQL usa un volumen; no publica el puerto 5432. El frontend y la API tampoco publican puertos de desarrollo en producción.

## Detener y actualizar

```powershell
# Conserva los datos.
docker compose -f compose.yml -f compose.local.yml down

# Tras editar el código:
docker compose -f compose.yml -f compose.local.yml --profile tools build
docker compose -f compose.yml -f compose.local.yml run --rm init
docker compose -f compose.yml -f compose.local.yml up -d --wait
```

No uses `down -v` sobre datos que quieras conservar: elimina el volumen de PostgreSQL. CI lo utiliza únicamente en su entorno descartable.

## Pruebas frontend y E2E

Con la aplicación levantada por Docker:

```powershell
cd frontend
npm ci
npm test
npm run build
npx playwright install chromium

# Las credenciales E2E deben coincidir con el administrador local.
$env:ADMIN_USERNAME = 'admin'
$env:ADMIN_PASSWORD = ((Get-Content ..\.env | Where-Object { $_ -match '^ADMIN_PASSWORD=' }) -split '=', 2)[1]
npm run test:e2e
Remove-Item Env:ADMIN_PASSWORD
cd ..
```

Las E2E crean una consulta identificada como prueba y editan temporalmente el título, que luego restauran. Ejecútalas contra un entorno de pruebas, nunca contra un sitio con visitantes.

## Pruebas backend fuera de Docker

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
cd backend
..\.venv\Scripts\python.exe -m pytest -v
cd ..
```

Sin `TEST_DATABASE_URL`, las pruebas locales usan SQLite en memoria para una comprobación rápida. En GitHub Actions las mismas pruebas de integración usan PostgreSQL real y descartable. **Nunca apuntes `TEST_DATABASE_URL` a producción**: las fixtures recrean las tablas.

## Desarrollo con recarga

Para trabajar en React: levanta la API localmente y en otra terminal ejecuta `cd frontend; npm run dev`. Vite reenvía `/api` a `http://127.0.0.1:8000`.

Para una demostración sin Docker puedes usar SQLite local (no sustituye las pruebas PostgreSQL de CI):

```powershell
$env:ADMIN_PASSWORD = 'CAMBIA_ESTA_CLAVE_POR_UNA_LARGA_Y_NUEVA'
cd backend
..\.venv\Scripts\alembic.exe upgrade head
..\.venv\Scripts\python.exe -m app.init_db
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Mantén `COOKIE_SECURE=false` solo para HTTP local. En OCI el playbook configura `true` y HTTPS.
