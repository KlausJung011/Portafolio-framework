# Práctica: portafolio full stack en Oracle Cloud

Toda la documentación está en esta carpeta. El código conserva los estilos, fuentes, GIF, CV y contenido del portafolio original; `info.md` y las credenciales de los ejemplos no se copiaron.

Sigue este orden:

1. [Ejecutar y probar en Windows](01-local.md).
2. [Configurar secretos y variables en GitHub](02-secretos.md).
3. [Preparar OCI y desplegar desde main](03-despliegue.md).
4. [Mantenimiento, backups y recuperación](04-operacion.md).
5. [Arquitectura, pruebas y evidencias de la práctica](05-arquitectura.md).
6. [Verificaciones realizadas y pendientes](06-verificacion.md).

Repositorio: https://github.com/KlausJung011/Portafolio-framework

La preparación local no crea recursos en OCI. El push a `main`, con todas las credenciales configuradas, sí crea recursos facturables. La VM propuesta es `VM.Standard.E2.1`, Ubuntu 24.04 y disco de 50 GB, como referencia del ejemplo; confirma su disponibilidad y consumo en tu cuenta antes de desplegar. No se administra la VM ni la VCN de las prácticas anteriores.

No necesitas Cloudflare ni un proveedor de correo: las consultas se guardan en PostgreSQL y se leen en `/admin`. HTTPS utiliza inicialmente un certificado autofirmado para laboratorio, no un certificado público de confianza.
