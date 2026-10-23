# ERP Logística

MVP de inventario para pequeñas empresas. Incluye una API Laravel, una interfaz React y una opción de desarrollo local con Docker Compose.

## Iniciar con Docker

En PowerShell, desde la raíz del proyecto:

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose up --build -d
docker compose exec app php scripts/ensure-local-keys.php
docker compose exec app php artisan migrate --force
```

Abre `http://localhost:5173`. La interfaz llama a la API en `http://localhost:8080/api/` y MySQL queda disponible en el puerto local `3307`.

## Iniciar sin Docker

Instala PHP 8.2+, Composer, Node.js 22+ y MySQL o SQLite.

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
Set-Location backend
composer run setup
```

En otra terminal:

```powershell
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
Set-Location frontend
npm ci
npm run dev
```

En una tercera terminal, inicia la API desde `backend`:

```powershell
Set-Location backend
php artisan serve --host=0.0.0.0 --port=8080
```

Para apuntar el frontend a otra API, define `VITE_API_BASE_URL` en `frontend/.env` antes de arrancar Vite. La URL debe terminar en `/api/`.

## Roles

- `staff`: responsable de la empresa; administra la configuración y puede asignar administradores.
- `admin`: gestiona operadores y operaciones de inventario.
- `operator`: consulta productos, existencias, ubicaciones e historial.

Los límites de usuarios y productos se aplican por empresa. El responsable inicial se crea al registrar una empresa.

## Consideraciones

Docker Compose está configurado para desarrollo local: habilita depuración y usa credenciales de ejemplo. Usa secretos y configuración propios antes de desplegar en un entorno público. Los cambios de esquema se aplican con migraciones; no borres el volumen de MySQL para actualizar la aplicación.

La migración conserva movimientos antiguos cuando el producto y el usuario pertenecen a la misma empresa. Los registros históricos con relaciones entre empresas quedan sin asignar para que no alteren el inventario; revísalos antes de confiar en saldos históricos completos. Si encuentra correos duplicados o SKU que solo difieren por mayúsculas o espacios, la migración se detiene para que se corrijan antes de continuar.
