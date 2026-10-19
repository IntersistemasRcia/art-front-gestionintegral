# Despliegue en Windows (runner self-hosted)

# Despliegue en Windows (runner self-hosted)

Este documento describe los pasos mínimos para preparar un servidor Windows que actúe como runner self-hosted de GitHub Actions y despliegue esta aplicación Next.js usando PM2.

Precondiciones
- Tener acceso de administrador a la máquina Windows.
- GitHub repo con el workflow `.github/workflows/deploy-to-develop.yml` (configurado para `develop`).

1) Instalar herramientas básicas

Abrir PowerShell como administrador y ejecutar:

```powershell
# Actualizar chocolatey (opcional) o usar instaladores oficiales
choco install -y git nodejs-lts

# Verificar
node -v
npm -v
git --version
```

Si no usas Chocolatey, descarga Node.js LTS desde https://nodejs.org/ y Git desde https://git-scm.com/.

2) Instalar PM2 (global)

```powershell
npm install -g pm2
```

3) Registrar el runner self-hosted en GitHub

- En GitHub: Settings → Actions → Runners → New self-hosted runner → Linux/Windows → sigue los pasos.
- Descarga y configura el runner en la máquina. Instálalo como servicio si quieres que arranque automáticamente.

4) Configurar `SITE_PATH` como secret en GitHub

- Ve a Settings → Secrets and variables → Actions → New repository secret
- Name: `SITE_PATH`
- Value: la ruta en la máquina donde desplegarás, por ejemplo `C:\wwwroot\Sitios\ArtFrontGestionIntegral`

Adicionales (opcional):

- `BACKUP_PATH`: ruta donde quieres almacenar backups (por defecto `SITE_PATH\backups`). Ejemplo: `D:\backups\ArtFront`
- `MAX_BACKUPS`: número máximo de backups a conservar. Por defecto `5`.

5) Estructura del workflow

El workflow `deploy-to-develop.yml` realizará:
- checkout
- npm ci
- npm run build
- sincronizar archivos con `robocopy` hacia `SITE_PATH` (excluye `.env`, `web.config`, `server.js`)
- instalar dependencias de producción `npm ci --omit=dev`
- iniciar/recargar con PM2 usando `ecosystem.config.js` (configurado para `PORT=8600`)

6) Verificación rápida después del deploy

En la máquina del runner (o por RDP):

```powershell
# Ver estado pm2
pm2 status

# Información detallada
pm2 show art_gestionintegral

# Logs (últimas 200 líneas)
pm2 logs art_gestionintegral --lines 200

# Ver puerto 8600
Get-NetTCPConnection -LocalPort 8600 -ErrorAction SilentlyContinue

# Si no hay conexión, revisar que app arrancó y que no exista otra variable que reescriba PORT
```

7) Troubleshooting

- Robocopy devuelve códigos de salida >0 aun cuando la copia fue exitosa. El workflow acepta códigos <=3 como éxito.
- Si la app no arranca: revisar `pm2 logs` y `pm2 show`.
- Si PM2 no se reinicia al reiniciar el servidor en Windows, considera usar `pm2-windows-service` o NSSM para ejecutar PM2/Node como servicio.
- Verifica permisos en la carpeta `SITE_PATH` (el usuario del runner debe tener escritura).

8) Notas de seguridad

- No guardes secretos en archivos en el repo. Coloca archivos `.env` solo en la máquina de despliegue con permisos restringidos.

### Identificación de ambiente

El archivo de entorno utilizado para construir cada instancia debe declarar `NEXT_PUBLIC_APP_ENVIRONMENT` con el valor exacto que corresponda:

| Despliegue | Valor requerido |
|---|---|
| Develop | `DEVELOPMENT` |
| TEST | `TEST` |
| Producción | `PRODUCTION` |

El workflow valida este valor antes de compilar. Sólo `TEST` muestra la leyenda visual **AMBIENTE TEST**; los valores ausentes o no reconocidos no muestran la leyenda y provocan el fallo del despliegue.
- Los runners self-hosted tienen acceso a los recursos de la máquina: asegúrate de aislar la máquina si corres trabajos de terceros.

Si quieres, puedo añadir los comandos para instalar `pm2-windows-service` o un ejemplo de configuración para IIS reverse-proxy.

-----

9) Configuración de IIS como reverse-proxy (ARR + URL Rewrite)

Si la aplicación en producción se sirve a través de IIS, puedes usar Application Request Routing (ARR) + URL Rewrite para hacer reverse-proxy hacia la app Node que corre en el puerto 8600.

Pasos resumidos:

1. Instalar los módulos necesarios en el servidor Windows:

```powershell
# Descargar e instalar Web Platform Installer o usar enlaces directos
# Recomendado: instalar Web Server (IIS), URL Rewrite y Application Request Routing (ARR)
# Con WebPI: buscar 'Application Request Routing' y 'URL Rewrite'
```

2. En el IIS Manager:

- Selecciona el servidor en el panel izquierdo → Feature view → Application Request Routing Cache → Server Proxy Settings → habilitar 'Enable proxy'.
- Crea un nuevo Site (o usa uno existente) que apunte al contenido estático si aplica.
- Añade una regla de URL Rewrite al sitio para reescribir todas las peticiones hacia `http://localhost:8600`.

Ejemplo de `web.config` (usa este archivo en la raíz del sitio IIS): ver `web.config.example` en el repo.

3. Reinicia IIS y prueba que http://<tu-dominio> se proxyee a la app en el puerto 8600.

Notas:
- Asegúrate de que el firewall permite conexiones en el puerto 8600 desde localhost (por lo general está permitido).
- Si usas SSL, configura el binding HTTPS en IIS y deja la comunicación entre IIS y la app en HTTP local.

### Copiar `web.config` automáticamente con script

Se incluye `scripts/apply-webconfig.ps1` que realiza:

- Backup del `web.config` existente (si lo hubiere).
- Copia de `web.config.example` al directorio del sitio.
- (Opcional) Reinicio de IIS con `iisreset`.

Uso:

```powershell
# Ejecutar desde la carpeta raíz del repo en la máquina destino
.\scripts\apply-webconfig.ps1 -SitePath 'C:\inetpub\wwwroot\TuSitio' -RestartIIS
```

El parámetro `-RestartIIS` es opcional; si no se añade, el script sólo copia y realiza el backup.

