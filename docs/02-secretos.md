# Secretos y variables de GitHub

En `KlausJung011/Portafolio-framework`: **Settings → Secrets and variables → Actions**.

Usa **Repository secrets** para los valores privados. No los pegues en el chat, commits, capturas ni archivos del código. El token Docker de `info.md` no se ha copiado: utiliza preferentemente un reemplazo. No es necesario cambiar tus claves OCI/SSH si siguen vigentes y no han sido expuestas.

## Repository secrets obligatorios

| Nombre exacto | Contenido | ¿Ya lo tienes? |
|---|---|---|
| `DOCKER_TOKEN` | Token Docker Hub con Read & Write para publicar y descargar imágenes | Tu token existente puede funcionar; se recomienda reemplazar el expuesto en info.md |
| `OCI_API_KEY_PEM` | Contenido completo del archivo de clave privada API, incluido BEGIN/END | Es el archivo indicado por `private_key_path` en el ejemplo |
| `SSH_PRIVATE_KEY` | Contenido completo de la clave privada SSH de la VM | Puedes reutilizar la del ejemplo si corresponde a la pública |
| `SSH_PUBLIC_KEY` | Contenido de la clave pública SSH, una línea | Valor `ssh_public_key` del ejemplo o archivo `.key.pub` |
| `POSTGRES_PASSWORD` | Contraseña nueva, aleatoria, de 24 a 128 caracteres alfanuméricos | Nueva; no reutilices la de otro servicio |
| `ADMIN_PASSWORD` | Contraseña inicial nueva, distinta, de 24 a 128 caracteres alfanuméricos | Nueva; se guarda como hash en la BD |

La pública SSH se guarda como secret por comodidad, aunque no es una clave privada. La clave API de OCI y la clave SSH son **dos pares de claves con funciones diferentes**.

Para el runner utiliza una clave SSH sin passphrase, dedicada a esta práctica y protegida en GitHub Secrets. El script comprueba que corresponda con la pública antes de crear recursos. Esta configuración tampoco incluye passphrase para la clave API OCI; si tu clave API está cifrada, requiere adaptar su configuración o generar un par dedicado para automatización.

Genera contraseñas localmente con Python y guárdalas también en un gestor de contraseñas:

```powershell
python -c "import secrets; print(secrets.token_hex(24))"
```

Ejecuta el comando dos veces. No cambies `POSTGRES_PASSWORD` después de crear el volumen sin cambiar también la contraseña dentro de PostgreSQL; modificar el secret no actualiza al usuario existente.

## Repository variables obligatorias

En la pestaña **Variables**, crea estos nombres exactos:

| Variable | Valor / origen |
|---|---|
| `OCI_TENANCY_OCID` | `tenancy_ocid` del terraform.tfvars anterior |
| `OCI_USER_OCID` | `user_ocid` |
| `OCI_FINGERPRINT` | `fingerprint` de la clave API |
| `OCI_COMPARTMENT_OCID` | `compartment_ocid`; puede ser el mismo compartment de práctica |
| `OCI_AVAILABILITY_DOMAIN` | `availability_domain`, actualmente `Dcvm:SA-SAOPAULO-1-AD-1` |
| `OCI_UBUNTU_IMAGE_OCID` | `ubuntu_2404_image_ocid`; confirmar Ubuntu 24.04 AMD64 compatible con E2.1 y región |
| `OCI_STATE_BUCKET` | Nombre del bucket privado que crearás, por ejemplo `portafolio-terraform-state` |
| `OCI_NAMESPACE` | Object Storage namespace de tu tenancy; no es un OCID ni el nombre del bucket |

Estos identificadores no autentican por sí solos y pueden almacenarse como variables. Si tu política los considera privados, adapta el workflow para leerlos desde `secrets` en lugar de `vars`.

## Variables opcionales con valor por defecto

| Variable | Predeterminado |
|---|---|
| `OCI_REGION` | `sa-saopaulo-1` |
| `OCI_SHAPE` | `VM.Standard.E2.1` |
| `DOCKER_USERNAME` | `klausjung011` |
| `ADMIN_USERNAME` | `admin` (solo letras, números, guion y guion bajo) |
| `ADMIN_SSH_CIDR` | Vacío por defecto. Para esta práctica configura `0.0.0.0/0` y permite SSH desde cualquier IPv4; también admite una IP específica `/32` |

El workflow detecta automáticamente la IP pública del runner y permite SSH desde ella y desde `ADMIN_SSH_CIDR`. Con `0.0.0.0/0` puedes cambiar de red sin actualizar la variable: el puerto 22 queda accesible desde Internet, pero sigue siendo necesaria la clave privada SSH. Si eliges una IP `/32`, debes actualizarla y volver a desplegar cuando cambie. Si dejas la variable vacía, solo se agrega acceso para el runner. No necesitas configurar `SUBNET_OCID`, `VCN_OCID` ni una IP de VM: Terraform los crea y entrega al despliegue.

## Guardar mediante GitHub CLI (opcional)

Instala `gh`, ejecuta `gh auth login` y usa comandos como estos desde PowerShell. Reemplaza únicamente las rutas/identificadores; **no escribas claves privadas como argumentos**:

Para leer claves desde archivos sin mostrarlas:

```powershell
Get-Content -Raw 'C:\RUTA\oci_api_key.pem' | gh secret set OCI_API_KEY_PEM --repo KlausJung011/Portafolio-framework
Get-Content -Raw 'C:\RUTA\ssh-key.key' | gh secret set SSH_PRIVATE_KEY --repo KlausJung011/Portafolio-framework
Get-Content -Raw 'C:\RUTA\ssh-key.key.pub' | gh secret set SSH_PUBLIC_KEY --repo KlausJung011/Portafolio-framework
gh variable set OCI_REGION --body 'sa-saopaulo-1' --repo KlausJung011/Portafolio-framework
gh variable set OCI_STATE_BUCKET --body 'portafolio-terraform-state' --repo KlausJung011/Portafolio-framework
gh secret list --repo KlausJung011/Portafolio-framework
gh variable list --repo KlausJung011/Portafolio-framework
```

`gh secret list` lista los nombres, no revela valores. Los secrets de las prácticas anteriores pertenecen a sus repositorios; GitHub no los copia automáticamente al nuevo repositorio.
