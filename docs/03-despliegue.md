# Preparar OCI y desplegar

## 1. Preparación única en Oracle

1. Confirma que puedes crear Compute, VCN, subredes, gateways, tablas de rutas y listas de seguridad en el compartment elegido. La clave API configurada debe pertenecer a un usuario con esos permisos. Si tu usuario de laboratorio ya administra ese compartment, probablemente podrás reutilizarlo, pero se verifica al planificar.
2. En São Paulo, busca la imagen oficial de Canonical Ubuntu 24.04 **AMD64/x86_64**, compatible con `VM.Standard.E2.1`; confirma el OCID que tienes. No uses la imagen ARM de Ampere para este shape. Cambiar a un shape ARM requiere también adaptar el build de imágenes a `linux/arm64`; el proyecto está preparado inicialmente para AMD64.
3. En **Storage → Buckets**, selecciona el compartment y crea un bucket llamado, por ejemplo, `portafolio-terraform-state`, acceso privado, nivel Standard, **Object Versioning habilitado**. Anota el namespace de Object Storage y configura ambas variables en GitHub.
4. Asegura permisos del usuario API para consultar el bucket y leer, crear, actualizar y eliminar objetos en él. Terraform utiliza objetos también para el bloqueo del estado.
5. La VCN y subred de la aplicación **no se crean manualmente**: lo hace Terraform. El bucket es previo porque `terraform init` necesita dónde guardar el estado antes de crear infraestructura.

El bucket no almacena los datos del portafolio: almacena el registro de recursos de Terraform. PostgreSQL persiste en un volumen en la VM. No copies `terraform.tfstate` ni `terraform.tfvars` de `oci-ubuntu-1` al nuevo repositorio.

## 2. Docker Hub y GitHub

1. En Docker Hub crea `klausjung011/portafolio-api` y `klausjung011/portafolio-web`. Pueden ser públicos; si son privados, el mismo token debe permitir descargarlos.
2. Completa todos los secrets y variables de [la lista](02-secretos.md).
3. En GitHub crea un Environment llamado `production`, permitiendo despliegues desde `main`. Puedes dejarlo sin revisores obligatorios para cumplir el despliegue automático por push. Los secrets de esta guía se configuran a nivel repositorio.
4. Comprueba que GitHub Actions esté habilitado.

## 3. Primer commit en dev

La carpeta ya puede contener `.git` con el remoto correcto. Compruébalo; no ejecutes `git init` si ya existe:

```powershell
git remote -v
git switch -c dev
git status --short
git add .
git diff --cached --stat
git diff --cached --name-only
git commit -m "Implementar portafolio full stack y automatizacion OCI"
git push -u origin dev
```

Antes del commit verifica que no estén `.env`, `terraform.tfvars`, claves privadas, `.local`, `.venv`, `node_modules` ni estados Terraform. `.terraform.lock.hcl`, `package-lock.json`, `constraints.txt` y los archivos `.example` **sí** deben versionarse.

Si Git avisa de propiedad dudosa al usar otro usuario de Windows, ejecuta los comandos desde tu usuario habitual. Solo si reconoces y confías en esta carpeta, puedes autorizar **esa ruta concreta** con `git config --global --add safe.directory 'C:/Niko/UnivalleISI/Semestre6/ProyectoSistemas3/Practicas/Practica32/Portafolio-framework'`; no uses un comodín global.

Abre **Actions → Pruebas del portafolio** y espera que pasen todos los jobs. La rama `dev` no crea infraestructura.

## 4. Primer despliegue a main

Una vez completos los secretos, las variables y el bucket:

```powershell
git switch -c main
git push -u origin main
```

Si `main` ya existe, cambia a ella y fusiona `dev` en lugar de crearla de nuevo. Para entregas siguientes, utiliza un pull request de `dev` a `main` con los checks obligatorios.

El push a `main` dispara:

1. Unitarias, integración con PostgreSQL, E2E, compilación y validación de infraestructura.
2. Construcción y publicación de dos imágenes con etiquetas `latest` y SHA del commit. El despliegue utiliza **el SHA**.
3. `terraform init`, `plan` y `apply` sobre el mismo estado privado remoto.
4. Creación de VCN, Internet Gateway, rutas, lista de seguridad, subred y VM Ubuntu nueva.
5. Inventario Ansible con la IP que devolvió Terraform.
6. Instalación de Docker, Compose, Git y firewall; configuración de HTTPS, copia de Compose y descarga de imágenes.
7. Backup previo, migraciones, creación inicial del administrador y arranque de servicios.
8. Verificación HTTPS y publicación de la URL en el resumen de Actions.

No se crea otra VM en cada commit: Terraform conserva y actualiza los recursos que administra mediante el estado. Cambios que impliquen reemplazo se muestran en el plan. No hay reintentos ciegos de `apply`; si OCI no tiene capacidad, revisa el error y vuelve a ejecutar el workflow cuando corresponda.

## 5. HTTPS sin Cloudflare: certificado de laboratorio

El playbook genera un certificado autofirmado con la IP en el SAN. Esto cifra la conexión, pero los navegadores no confían automáticamente en su emisor. Es apropiado para la práctica controlada; para recibir consultas de público real, sustituye el certificado por uno de una autoridad pública para un dominio o IP compatible.

El workflow recupera el certificado por SSH y verifica HTTPS con `curl --cacert`; no deshabilita la validación en el chequeo externo. Para obtenerlo desde tu PC:

```powershell
$vmIp = 'IP_QUE_MUESTRA_ACTIONS'
ssh -i 'C:\RUTA\ssh-key.key' "ubuntu@$vmIp" 'sudo openssl x509 -in /opt/portafolio/tls/server.crt -noout -fingerprint -sha256'
ssh -i 'C:\RUTA\ssh-key.key' "ubuntu@$vmIp" 'sudo cat /opt/portafolio/tls/server.crt' | Set-Content -Encoding ascii .local-server.crt
curl.exe --cacert .local-server.crt "https://$vmIp/api/health"
```

Verifica la identidad SSH antes de aceptar su clave en tu PC. Para confiar en el certificado del sitio durante la práctica, verifica su huella por esa conexión y utiliza la gestión de certificados del navegador/sistema. No distribuyas la clave `server.key`. Un simple acceso HTTP redirige a HTTPS; el login utiliza una cookie Secure.

El runner registra automáticamente la primera clave de host SSH obtenida para la IP recién creada (**TOFU**, confianza en el primer uso). No equivale a una verificación independiente de identidad; para un entorno más exigente, valida la huella por la consola OCI y fija esa clave antes de conectar. La comprobación estricta de SSH permanece activada después del registro.

## Terraform manual opcional

Utiliza el perfil `DEFAULT` de `~/.oci/config` (tenancy, user, fingerprint, key_file, region). La clave privada debe permanecer fuera del repositorio. Crea copias locales de los ejemplos y rellénalas:

```powershell
cd infra\terraform
Copy-Item backend.hcl.example backend.hcl
Copy-Item terraform.tfvars.example terraform.tfvars
# Editar ambos archivos: sin marcadores REEMPLAZAR ni direcciones de documentación.
terraform init -reconfigure -backend-config=backend.hcl
terraform fmt -check
terraform validate
terraform plan -out=local.tfplan
# Revisar el plan antes de aplicarlo; crea recursos facturables.
terraform apply local.tfplan
terraform output
```

Usa exactamente el mismo bucket, namespace y key que Actions (`portafolio/production.tfstate`) si vas a administrar esos mismos recursos. Evita ejecutar cambios manuales durante un despliegue. El bloqueo del estado y `concurrency` protegen contra operaciones simultáneas, pero no sustituyen la coordinación.

Fuentes: [backend OCI de Terraform](https://developer.hashicorp.com/terraform/language/backend/oci), [estado en Object Storage](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/object-storage-state.htm), [Docker en Ubuntu](https://docs.docker.com/engine/install/ubuntu/).
