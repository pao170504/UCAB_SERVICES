# UCAB Services

Sistema web OLTP para la gestión de servicios universitarios de la UCAB: solicitudes de
servicio, pagos multimoneda, infraestructura y reservas, estacionamiento, bolsa de trabajo,
acreditaciones y beneficiarios. Proyecto académico de Bases de Datos II (INFO-02012).

## Stack tecnológico

- **Base de datos:** PostgreSQL 18 (PL/pgSQL, RBAC, RLS, pgcrypto)
- **Backend:** Node.js + Express 5, driver `pg`
- **Frontend:** HTML/CSS/JS sin framework, servido como estático por Express
- **Reportes:** Microsoft Power BI Report Builder (vía ODBC/psqlODBC)
- **Ambiente de desarrollo:** Windows 11 + Git Bash / PowerShell

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior y npm
- [PostgreSQL](https://www.postgresql.org/) 14 o superior (probado en 18), con la extensión `pgcrypto` disponible
- (Opcional, solo para ver los reportes) Power BI Desktop / Report Builder + driver ODBC **psqlODBC**

## Instalación y despliegue

### 1. Clonar el repositorio

```bash
git clone https://github.com/pao170504/UCAB_SERVICES.git
cd UCAB_SERVICES
```

### 2. Crear la base de datos

```bash
psql -U postgres -c "CREATE DATABASE proyectobd;"
```

### 3. Cargar los scripts SQL, **en este orden exacto**

```bash
psql -U postgres -d proyectobd -f sql/create.sql
psql -U postgres -d proyectobd -f sql/inserts.sql
psql -U postgres -d proyectobd -f sql/logic.sql
psql -U postgres -d proyectobd -f sql/extras.sql
psql -U postgres -d proyectobd -f sql/security.sql
```

- `create.sql` — las 52 tablas, llaves primarias/foráneas y restricciones `CHECK`.
- `inserts.sql` — datos de prueba para las 52 tablas (idempotente, usa `ON CONFLICT`).
- `logic.sql` — triggers, funciones, procedimientos e índices de la lógica de negocio.
- `extras.sql` — triggers/funciones adicionales y las vistas usadas por los reportes de Power BI.
- `security.sql` — cifrado de contraseñas, roles, usuarios de aplicación, privilegios (GRANT/REVOKE) y políticas RLS. **Debe correr al final**, porque otorga permisos sobre las vistas creadas en `extras.sql`.

> El script `security.sql` limpia y recrea los roles cada vez que se ejecuta (es idempotente
> dentro de la misma base de datos). Si se ejecuta contra un servidor donde esos roles ya
> existen en **otra** base de datos, el `DROP ROLE` inicial puede fallar porque en PostgreSQL
> los roles son globales al clúster, no a la base de datos.

### 4. Configurar el backend

Crear el archivo `back/.env` (no se versiona) con:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=proyectobd
DB_PASSWORD=<tu_password_de_postgres>
DB_PORT=5432
PORT=3000
```

Instalar dependencias y levantar el servidor:

```bash
cd back
npm install
npm start
```

### 5. Abrir la aplicación

```
http://localhost:3000/pages/login.html
```

## Credenciales de prueba

El login pide cédula (formato `V-XXXXXXXX`), correo institucional, contraseña y sede, y
luego un código MFA de 6 dígitos generado por el propio backend (se muestra en pantalla,
no se envía correo real).

| Cédula | Correo | Contraseña | Sede |
|---|---|---|---|
| V-30411315 | pvdesousa.23@ucab.edu.ve | 30411315 | Montalbán |

> La contraseña de cada usuario de prueba es igual a su cédula (se cifra automáticamente
> en la base de datos con `pgcrypto` al insertarse). Puede usarse cualquier otra cédula de
> `sql/inserts.sql` (sección `MIEMBRO_COMUNIDAD`) siguiendo el mismo patrón.

## Reportes (Power BI)

Los reportes institucionales (tiempos de respuesta, conciliación multimoneda, rentabilidad
de espacios, trayectoria institucional, efectividad de la bolsa de trabajo, auditoría de
seguridad) se construyeron en Power BI Report Builder, conectado por ODBC a las vistas
definidas en la sección "A4. VISTAS PARA POWERBI" de `sql/extras.sql`. El archivo (`.rdl`
o `.pbix`) exportado debe colocarse en `reportes/` antes de la entrega.

Conexión ODBC usada: DSN de sistema `UCAB_BD` (driver **PostgreSQL Unicode (x64)**, psqlODBC),
cadena `DSN=UCAB_BD;UID=app_administrativo;PWD=Admin;` con credenciales embebidas y
"No credentials required" en la pestaña Credentials del reporte (el DSN no debe tener
usuario/password propios guardados, o pisan las credenciales del reporte).

## Seguridad implementada

- **Cifrado simétrico** de contraseñas con `pgcrypto` (`pgp_sym_encrypt`/`pgp_sym_decrypt`).
- **RBAC**: 9 roles de negocio (`ucab_dba`, `ucab_administrativo`, `ucab_cajero`,
  `ucab_profesor`, `ucab_estudiante`, `ucab_egresado`, `ucab_aliado`,
  `ucab_entidad_interna`, `ucab_auditor`) y usuarios de aplicación (`app_*`) con
  privilegios GRANT/REVOKE por tabla y columna.
- **RLS (Row-Level Security)** en `Sesion`, `Periodo_Vinculacion`, `Solicitud_Servicio`,
  `Factura`, `Vacante_Laboral` y `Postula`.
- La aplicación web usa autenticación propia a nivel de aplicación (sesión + MFA); el
  RBAC/RLS a nivel de motor de base de datos se demuestra conectando directamente como
  cada rol (`psql` o el DSN ODBC usado por Power BI).

## Estructura del repositorio

```
sql/       scripts de base de datos (create, inserts, logic, extras, security)
back/      API REST (Express) — back/routes/*.js
front/     interfaz web estática (HTML/CSS/JS)
reportes/  archivo(s) de Power BI
```
