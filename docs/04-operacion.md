# Operación y recuperación

## Entrar a la VM y consultar servicios

Para conectarte desde cualquier red durante esta práctica, configura `ADMIN_SSH_CIDR` con `0.0.0.0/0` y despliega. Puedes limitarlo a tu IP pública `/32` si lo prefieres. En ambos casos necesitas la clave privada SSH. Los siguientes comandos de shell se ejecutan **dentro de la VM**, después de conectar:

```powershell
ssh -i 'C:\RUTA\ssh-key.key' ubuntu@IP_PUBLICA
```

```bash
sudo -i
cd /opt/portafolio
docker compose -f compose.yml -f compose.prod.yml ps
docker compose -f compose.yml -f compose.prod.yml logs --tail=100 api web
systemctl status portafolio-firewall
iptables -S PORTFOLIO_INPUT
iptables -S PORTFOLIO_DOCKER
```

## Panel administrativo

- `/admin`: usuario inicial definido en `ADMIN_USERNAME`, contraseña inicial en `ADMIN_PASSWORD`.
- Presentación: nombre, título, contacto, disponibilidad, ubicación y párrafos de biografía.
- Proyectos: título, descripción, etiquetas, estado, enlaces e icono.
- Editores de intereses, tecnologías, habilidades, idiomas, habilidades blandas, educación, cursos y experiencia.
- Usa **Añadir elemento**, despliega su formulario, completa los campos y pulsa **Guardar y publicar**. Quitar un elemento no se publica hasta guardar.
- Mensajes: listado privado paginado, marcar atendido/pendiente y eliminar tras confirmación.
- **Ver sitio** abre el resultado en otra pestaña. Si otro administrador guardó mientras editabas, se rechaza tu guardado con conflicto; recarga y vuelve a aplicar los cambios.

No hay registro público, recuperación de contraseña por correo ni notificaciones de correo. La foto, las fuentes, los enlaces sociales y el PDF se modifican por código/assets; no hay carga de archivos desde el panel. El contenido editable se guarda en un documento JSON validado dentro de PostgreSQL; los mensajes, administradores y sesiones tienen sus propias tablas.

## Restablecer contraseña de administrador

Actualiza `ADMIN_PASSWORD` en GitHub y vuelve a desplegar para actualizar el `.env` de la VM. Después ejecuta dentro de la VM:

```bash
cd /opt/portafolio
docker compose -f compose.yml -f compose.prod.yml run --rm init python -m app.init_db --reset-admin
```

Esto actualiza el hash de ese usuario y revoca todas las sesiones; no borra mensajes ni contenido. Las ejecuciones normales de `init` no reemplazan contraseñas ni ediciones existentes. Si cambias el nombre de administrador, se crea otro usuario; el anterior no se elimina automáticamente.

En local, actualiza `.env` y utiliza el mismo comando con `compose.local.yml`.

## Backups

Cada despliegue crea un dump previo en `/opt/portafolio/backups`, antes de migrar. Se conservan en la VM; **no protegen frente a la pérdida de esa VM**. Descárgalos y/o cópialos a un almacenamiento externo privado. Controla el espacio y conserva únicamente las copias necesarias según tu política.

Backup manual dentro de la VM:

```bash
cd /opt/portafolio
set -o pipefail
umask 077
docker compose -f compose.yml -f compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backups/manual-$(date +%Y%m%d-%H%M%S).sql.gz
ls -lh backups
```

Para descargar un backup protegido desde PowerShell:

```powershell
$vmIp = 'IP_PUBLICA'
ssh -i 'C:\RUTA\ssh-key.key' "ubuntu@$vmIp" 'sudo cp /opt/portafolio/backups/NOMBRE.sql.gz /home/ubuntu/backup.sql.gz && sudo chown ubuntu:ubuntu /home/ubuntu/backup.sql.gz && sudo chmod 600 /home/ubuntu/backup.sql.gz'
scp -i 'C:\RUTA\ssh-key.key' "ubuntu@${vmIp}:/home/ubuntu/backup.sql.gz" 'C:\RUTA_PRIVADA\backup.sql.gz'
ssh -i 'C:\RUTA\ssh-key.key' "ubuntu@$vmIp" 'rm /home/ubuntu/backup.sql.gz'
```

Los dumps incluyen mensajes y hashes/sesiones: trátalos como privados. Para restaurar, usa una BD vacía en un entorno de recuperación, carga el dump y verifica el resultado antes de reemplazar la base activa:

```bash
# En el entorno de recuperación; BACKUP.sql.gz debe corresponder a esa base vacía.
gzip -dc BACKUP.sql.gz | docker compose -f compose.yml -f compose.prod.yml exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

No ejecutes restauraciones sobre una base activa como si fueran una fusión de datos.

## Volver a una versión anterior

Revertir un commit en Git y fusionarlo a `main` genera nuevas imágenes y un nuevo despliegue trazable:

```powershell
git switch dev
git pull --ff-only
git revert SHA_DEL_COMMIT_A_REVERTIR
git push
# Crear y fusionar PR dev -> main después de pasar CI.
```

Revertir código **no revierte automáticamente el esquema ni los datos**. Si agregas migraciones en el futuro, revisa compatibilidad y backups antes de desplegar una versión anterior. Durante el despliegue la API se detiene brevemente: este diseño de una sola VM no ofrece cero interrupciones.

## Costos y eliminación al terminar la práctica

Revisa Cost Analysis y los recursos del compartment. Los créditos no garantizan capacidad de un shape ni evitan consumo de almacenamiento/red. Eliminar solo los contenedores no elimina la VM facturable.

Cuando decidas finalizar, usa el mismo backend y variables de Terraform que administran esta práctica, revisa el plan de destrucción y conserva backups externos:

```powershell
cd infra\terraform
terraform init -reconfigure -backend-config=backend.hcl
terraform plan -destroy -out=destroy.tfplan
# Solo después de revisar el plan y respaldar los datos:
terraform apply destroy.tfplan
```

El bucket se creó fuera de este estado y no se elimina con ese comando. Revisa también posibles volúmenes conservados por OCI. No borres el bucket/estado antes de destruir los recursos administrados.

## Problemas frecuentes

| Síntoma | Comprobar |
|---|---|
| Docker no responde en Windows | Iniciar Docker Desktop y usar contenedores Linux |
| Login local no conserva sesión | `COOKIE_SECURE=false` para HTTP local; no mezclar `localhost` con `127.0.0.1` durante la sesión |
| Login remoto falla | HTTPS, certificado verificado y contraseña inicial; cambiar un secret no cambia el hash hasta resetearlo |
| Error al conectar PostgreSQL tras cambiar secret | La contraseña del volumen existente no cambia con la variable; actualizar el usuario de PostgreSQL de manera coordinada |
| OCI devuelve falta de capacidad | Disponibilidad del shape/AD, cuotas y compatibilidad de imagen; no duplicar infraestructura sin revisar el estado |
| Terraform no encuentra bucket | Región, namespace, nombre, permisos y que el bucket exista antes de init |
| SSH expira | IP del runner y de tu PC, reglas de red, salida a Internet y estado de la VM |
| El navegador avisa de certificado | Es autofirmado de laboratorio; verifica huella por SSH o sustituye por certificado público |
| La VM tiene otra IP | Terraform output; volver a desplegar regenera certificado si cambia la IP |
| Terraform muestra recursos inesperados | Detenerse y comprobar bucket, key y estado; no copiar estado de la práctica anterior |
