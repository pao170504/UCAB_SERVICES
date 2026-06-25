-- =====================================================================
--  security.sql  —  Seguridad de UCAB-Services (PostgreSQL)
--  Combina: cifrado de contraseñas (pgcrypto), RBAC completo con
--  jerarquía de roles, vistas DAC y políticas RLS (MAC-like).
--
--  Orden de ejecución recomendado:
--    create.sql  ->  inserts.sql  ->  logic.sql  ->  security.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Limpieza idempotente (permite re-ejecutar el script)
-- ---------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT rolname FROM pg_roles
           WHERE rolname IN (
             'ucab_app',   'ucab_dba',
             'ucab_lectura','ucab_auditor',
             'ucab_estudiante','ucab_egresado',
             'ucab_profesor','ucab_administrativo',
             'ucab_cajero','ucab_aliado','ucab_entidad_interna',
             'app_administrativo','app_cajero','app_profesor',
             'app_estudiante','app_egresado','app_aliado','app_entidad'
           )
  LOOP
    EXECUTE format('REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM %I', r.rolname);
    EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r.rolname);
    EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r.rolname);
    EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', r.rolname);
    EXECUTE format('DROP ROLE IF EXISTS %I', r.rolname);
  END LOOP;
END$$;

-- =====================================================================
-- SECCIÓN 1: CIFRADO DE CONTRASEÑAS (pgcrypto)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE Miembro_Comunidad
    ALTER COLUMN Contrasena TYPE TEXT;

SET app.clave_simetrica = 'UCABServices';
ALTER DATABASE proyectobd SET app.clave_simetrica = 'UCABServices';

CREATE OR REPLACE FUNCTION fn_cifrar_contrasena(p_contrasena TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(p_contrasena, current_setting('app.clave_simetrica', false)),
        'base64'
    );
END;
$$;

CREATE OR REPLACE FUNCTION fn_verificar_contrasena(
    p_contrasena_plana   TEXT,
    p_contrasena_cifrada TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(p_contrasena_cifrada, 'base64'),
        current_setting('app.clave_simetrica', false)
    ) = p_contrasena_plana;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION fn_trigger_cifrar_contrasena()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.Contrasena := fn_cifrar_contrasena(NEW.Contrasena);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cifrar_contrasena ON Miembro_Comunidad;
CREATE TRIGGER trg_cifrar_contrasena
BEFORE INSERT OR UPDATE OF Contrasena ON Miembro_Comunidad
FOR EACH ROW EXECUTE FUNCTION fn_trigger_cifrar_contrasena();

-- Migrar contraseñas en texto plano existentes al formato cifrado
ALTER TABLE Miembro_Comunidad DISABLE TRIGGER trg_cifrar_contrasena;

UPDATE Miembro_Comunidad
SET Contrasena = encode(
    pgp_sym_encrypt(Contrasena, current_setting('app.clave_simetrica', false)),
    'base64'
);

ALTER TABLE Miembro_Comunidad ENABLE TRIGGER trg_cifrar_contrasena;

-- =====================================================================
-- SECCIÓN 2: ROLES DE GRUPO (NOLOGIN)
-- =====================================================================

CREATE ROLE ucab_dba             NOLOGIN;
CREATE ROLE ucab_lectura         NOLOGIN;  -- base: solo lectura de catálogos públicos
CREATE ROLE ucab_auditor         NOLOGIN;  -- lectura de sesiones y auditoría
CREATE ROLE ucab_estudiante      NOLOGIN;
CREATE ROLE ucab_egresado        NOLOGIN;
CREATE ROLE ucab_profesor        NOLOGIN;
CREATE ROLE ucab_cajero          NOLOGIN;
CREATE ROLE ucab_aliado          NOLOGIN;
CREATE ROLE ucab_entidad_interna NOLOGIN;
CREATE ROLE ucab_administrativo  NOLOGIN;

-- =====================================================================
-- SECCIÓN 3: PRIVILEGIOS DE ESQUEMA
-- =====================================================================

GRANT USAGE ON SCHEMA public TO
  ucab_lectura, ucab_auditor,
  ucab_estudiante, ucab_egresado, ucab_profesor,
  ucab_cajero, ucab_aliado, ucab_entidad_interna,
  ucab_administrativo;

-- =====================================================================
-- SECCIÓN 4: PERFIL BASE (ucab_lectura)
--   Catálogos de solo lectura accesibles por todos los perfiles.
-- =====================================================================

GRANT SELECT ON
  Sede, Edificacion, Espacio_Fisico,
  Categoria_Servicio, Servicio, Requisitos_Acceso, Regula,
  Entidad_Prestadora, Entidad_Interna, Entidad_Externa,
  Zona_Estacionamiento, Puesto, Tasa
TO ucab_lectura;

-- Todos los perfiles de usuario heredan la lectura base
GRANT ucab_lectura TO ucab_estudiante, ucab_egresado, ucab_profesor,
                      ucab_cajero, ucab_aliado, ucab_entidad_interna,
                      ucab_administrativo, ucab_auditor;

-- =====================================================================
-- SECCIÓN 5: PERFIL AUDITOR DE SEGURIDAD
--   Solo lectura de la huella de acceso.
-- =====================================================================

GRANT SELECT ON Sesion, Miembro_Comunidad, Persona,
                Periodo_Vinculacion TO ucab_auditor;

-- =====================================================================
-- SECCIÓN 6: PERFIL ESTUDIANTE
--   Gestión de sus propias solicitudes, folios, ítems, pagos y reservas.
--   El filtrado por cédula lo imponen las RLS de la sección 9.
-- =====================================================================

GRANT SELECT, INSERT, UPDATE         ON Solicitud_Servicio  TO ucab_estudiante;
GRANT SELECT, INSERT, UPDATE         ON Folio_Consumo        TO ucab_estudiante;
GRANT SELECT, INSERT, UPDATE, DELETE ON Item_Consumo         TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Paso_Actividad       TO ucab_estudiante;
GRANT SELECT, INSERT, DELETE         ON Acompanante          TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Reserva              TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Registro_Acceso      TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Factura              TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Pago, TAI, Efectivo,
                                        Pago_Movil, Tarjeta,
                                        Cripto, Zelle         TO ucab_estudiante;
GRANT SELECT, INSERT, UPDATE         ON Cumple               TO ucab_estudiante;
GRANT SELECT                         ON Acreditacion, Requiere TO ucab_estudiante;
GRANT SELECT, INSERT, UPDATE         ON Sesion               TO ucab_estudiante;
GRANT SELECT                         ON Persona, Miembro_Comunidad,
                                        Periodo_Vinculacion,
                                        Estudiante, Becario, Preparador TO ucab_estudiante;

-- =====================================================================
-- SECCIÓN 7: PERFIL EGRESADO
--   Hereda estudiante + acceso a bolsa de trabajo.
-- =====================================================================

GRANT ucab_estudiante TO ucab_egresado;

GRANT SELECT                  ON Egresado        TO ucab_egresado;
GRANT SELECT, INSERT, DELETE  ON Postula         TO ucab_egresado;
GRANT UPDATE (Estatus)        ON Postula         TO ucab_egresado;
GRANT SELECT                  ON Vacante_Laboral TO ucab_egresado;

-- =====================================================================
-- SECCIÓN 8: PERFIL PROFESOR
--   Hereda estudiante + gestión académica + registro de beneficiarios.
-- =====================================================================

GRANT ucab_estudiante TO ucab_profesor;

GRANT SELECT                              ON Profesor, Personal_Administrativo TO ucab_profesor;
GRANT SELECT, INSERT, UPDATE, DELETE      ON Beneficiario, Carga_Mayor,
                                             Carga_Menor, Vacunacion           TO ucab_profesor;
GRANT SELECT, UPDATE (Estado_Paso, Fecha_Completada)
                                          ON Paso_Actividad                    TO ucab_profesor;

-- Acceso de solo lectura a reportes analíticos (definidos en logic.sql)
GRANT SELECT ON v_reporte_cuellos_botella     TO ucab_profesor;
GRANT SELECT ON v_reporte_ocupacion_espacios  TO ucab_profesor;
GRANT SELECT ON v_solicitudes_activas         TO ucab_profesor;
GRANT SELECT ON v_espacios_disponibles        TO ucab_profesor;
GRANT SELECT ON v_vinculaciones_activas       TO ucab_profesor;

-- =====================================================================
-- SECCIÓN 8B: PERFIL CAJERO
--   Valida pagos, procesa facturas e identifica al cliente.
-- =====================================================================

GRANT SELECT                         ON Persona              TO ucab_cajero;
GRANT SELECT                         ON Solicitud_Servicio   TO ucab_cajero;
GRANT SELECT                         ON Folio_Consumo        TO ucab_cajero;
GRANT SELECT                         ON Item_Consumo         TO ucab_cajero;
GRANT SELECT                         ON Tasa                 TO ucab_cajero;
GRANT SELECT, UPDATE (Estado, Saldo) ON Factura              TO ucab_cajero;
GRANT SELECT, INSERT, UPDATE         ON Pago                 TO ucab_cajero;
GRANT SELECT, INSERT                 ON TAI                  TO ucab_cajero;
GRANT SELECT, INSERT                 ON Efectivo             TO ucab_cajero;
GRANT SELECT, INSERT                 ON Pago_Movil           TO ucab_cajero;
GRANT SELECT, INSERT                 ON Tarjeta              TO ucab_cajero;
GRANT SELECT, INSERT                 ON Cripto               TO ucab_cajero;
GRANT SELECT, INSERT                 ON Zelle                TO ucab_cajero;
GRANT SELECT, UPDATE (Estado)        ON Puesto               TO ucab_cajero;
GRANT SELECT, INSERT, UPDATE         ON Registro_Acceso      TO ucab_cajero;

-- =====================================================================
-- SECCIÓN 8C: PERFIL ALIADO EXTERNO
--   Empresa aliada: gestiona vacantes y visualiza postulantes.
-- =====================================================================

GRANT SELECT, INSERT, UPDATE ON Vacante_Laboral      TO ucab_aliado;
GRANT SELECT                 ON Postula              TO ucab_aliado;
GRANT SELECT                 ON Periodo_Vinculacion  TO ucab_aliado;
GRANT SELECT                 ON Egresado             TO ucab_aliado;
GRANT SELECT                 ON Servicio             TO ucab_aliado;
GRANT SELECT                 ON Categoria_Servicio   TO ucab_aliado;

-- =====================================================================
-- SECCIÓN 8D: PERFIL ENTIDAD INTERNA
--   Dependencias UCAB: gestionan sus propios servicios y pasos.
-- =====================================================================

GRANT SELECT, INSERT, UPDATE         ON Servicio             TO ucab_entidad_interna;
GRANT SELECT, INSERT, UPDATE, DELETE ON Requisitos_Acceso    TO ucab_entidad_interna;
GRANT SELECT, INSERT, UPDATE, DELETE ON Requiere             TO ucab_entidad_interna;
GRANT SELECT                         ON Solicitud_Servicio   TO ucab_entidad_interna;
GRANT SELECT, INSERT, UPDATE         ON Paso_Actividad       TO ucab_entidad_interna;
GRANT SELECT                         ON Folio_Consumo        TO ucab_entidad_interna;
GRANT SELECT, INSERT                 ON Item_Consumo         TO ucab_entidad_interna;
GRANT SELECT                         ON Entidad_Interna      TO ucab_entidad_interna;
GRANT SELECT                         ON Entidad_Prestadora   TO ucab_entidad_interna;
GRANT SELECT, INSERT                 ON Reserva              TO ucab_entidad_interna;
GRANT SELECT                         ON Tasa                 TO ucab_entidad_interna;
GRANT SELECT                         ON Acreditacion         TO ucab_entidad_interna;

-- =====================================================================
-- SECCIÓN 8E: PERFIL PERSONAL ADMINISTRATIVO
--   Gestión operativa amplia con restricciones de auditoría.
-- =====================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO ucab_administrativo;

-- Restricciones de auditoría: no puede borrar registros contables ni trazabilidad
REVOKE DELETE ON Persona        FROM ucab_administrativo;
REVOKE DELETE ON Sesion         FROM ucab_administrativo;
REVOKE DELETE ON Factura        FROM ucab_administrativo;
REVOKE DELETE ON Pago           FROM ucab_administrativo;
REVOKE DELETE ON Paso_Actividad FROM ucab_administrativo;
REVOKE DELETE ON Item_Consumo   FROM ucab_administrativo;

-- Reportes con opción de delegar acceso a otros roles
GRANT SELECT ON v_reporte_cuellos_botella    TO ucab_administrativo WITH GRANT OPTION;
GRANT SELECT ON v_reporte_ocupacion_espacios TO ucab_administrativo WITH GRANT OPTION;
GRANT SELECT ON v_facturas_pendientes        TO ucab_administrativo WITH GRANT OPTION;
GRANT SELECT ON v_vinculaciones_activas      TO ucab_administrativo WITH GRANT OPTION;

-- =====================================================================
-- SECCIÓN 9: CUENTAS DE USUARIO
-- =====================================================================

-- Cuenta de aplicación de mínimo privilegio (la que usa el backend Node.js)
-- Configura en back/.env: DB_USER=ucab_app  DB_PASSWORD=ucab_app_2026
CREATE ROLE ucab_app LOGIN PASSWORD 'ucab_app_2026';
GRANT ucab_administrativo TO ucab_app;

-- Cuentas individuales por rol (para entornos con un usuario por perfil)
CREATE USER app_administrativo WITH PASSWORD 'Admin';
CREATE USER app_cajero         WITH PASSWORD 'Cajero';
CREATE USER app_profesor       WITH PASSWORD 'Profesor';
CREATE USER app_estudiante     WITH PASSWORD 'Estudiante';
CREATE USER app_egresado       WITH PASSWORD 'Egresado';
CREATE USER app_aliado         WITH PASSWORD 'Aliado';
CREATE USER app_entidad        WITH PASSWORD 'Entidad';

GRANT ucab_administrativo  TO app_administrativo;
GRANT ucab_cajero          TO app_cajero;
GRANT ucab_profesor        TO app_profesor;
GRANT ucab_estudiante      TO app_estudiante;
GRANT ucab_egresado        TO app_egresado;
GRANT ucab_aliado          TO app_aliado;
GRANT ucab_entidad_interna TO app_entidad;

-- =====================================================================
-- SECCIÓN 10: VALORES POR DEFECTO PARA OBJETOS FUTUROS
-- =====================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO ucab_lectura;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ucab_administrativo;

-- =====================================================================
-- SECCIÓN 11: VISTAS DE SEGURIDAD (DAC reforzado con vistas)
-- =====================================================================

-- Vista 1: Perfil público del miembro (sin contraseña)
CREATE OR REPLACE VIEW v_miembro_publico AS
SELECT
    mc.Cedula,
    mc.Correo_Institucional,
    mc.Estado_de_Cuenta,
    mc.Fecha_Cambio_Clave,
    mc.Ciudad,
    mc.Estado       AS Estado_Residencia,
    mc.Calle,
    mc.ID_Sede,
    p.Primer_Nombre,
    p.Segundo_Nombre,
    p.Primer_Apellido,
    p.Segundo_Apellido,
    p.Sexo,
    p.Fecha_Nacimiento
FROM Miembro_Comunidad mc
JOIN Persona p ON p.Cedula = mc.Cedula;

COMMENT ON VIEW v_miembro_publico IS
'DAC via vista: expone todos los atributos del miembro excepto Contrasena.';

-- Vista 2: Datos mínimos del cliente para operaciones de caja
CREATE OR REPLACE VIEW v_cliente_cajero AS
SELECT
    mc.Cedula,
    p.Primer_Nombre || ' ' || p.Primer_Apellido AS Nombre_Completo,
    mc.Correo_Institucional,
    mc.Estado_de_Cuenta,
    s.Nombre AS Sede
FROM Miembro_Comunidad mc
JOIN Persona p ON p.Cedula  = mc.Cedula
JOIN Sede s    ON s.ID_Sede = mc.ID_Sede;

COMMENT ON VIEW v_cliente_cajero IS
'DAC via vista: permite al cajero identificar al cliente sin acceder a Contrasena ni datos académicos.';

-- Vista 3: Perfil académico resumido del egresado para la bolsa de trabajo
CREATE OR REPLACE VIEW v_perfil_egresado_bolsa AS
SELECT
    eg.Cedula,
    p.Primer_Nombre || ' ' || p.Primer_Apellido AS Nombre,
    eg.Titulo,
    eg.Indice_Academico,
    eg.Ano_Graduacion,
    pv.Fecha_Inicio AS Inicio_Vinculacion,
    pv.Fecha_Fin    AS Fin_Vinculacion
FROM Egresado eg
JOIN Periodo_Vinculacion pv
     ON eg.Cedula = pv.Cedula AND eg.Fecha_Inicio = pv.Fecha_Inicio
JOIN Persona p ON p.Cedula = eg.Cedula;

COMMENT ON VIEW v_perfil_egresado_bolsa IS
'DAC via vista: aliados externos ven perfil académico del egresado sin datos personales de contacto.';

-- Vista 4: Historial de sesiones para auditoría (audit trail)
CREATE OR REPLACE VIEW v_auditoria_sesiones AS
SELECT
    s.Cedula,
    p.Primer_Nombre || ' ' || p.Primer_Apellido AS Miembro,
    s.UUID,
    s.Fecha_Hora_Acceso,
    s.Direccion_IP,
    s.Intentos_Fallidos,
    CASE
        WHEN s.Latitud IS NOT NULL AND s.Longitud IS NOT NULL
        THEN s.Latitud::TEXT || ', ' || s.Longitud::TEXT
        ELSE 'No registrada'
    END AS Geolocalizacion,
    mc.Estado_de_Cuenta
FROM Sesion s
JOIN Miembro_Comunidad mc ON mc.Cedula = s.Cedula
JOIN Persona p            ON p.Cedula  = s.Cedula;

COMMENT ON VIEW v_auditoria_sesiones IS
'Vista de auditoría (audit trail): historial de accesos para revisión por DBA o administrativo.';

-- Acceso a las vistas de seguridad
GRANT SELECT ON v_beneficiarios_mayoria_prox TO ucab_administrativo, ucab_profesor;
GRANT SELECT ON v_miembro_publico            TO ucab_administrativo, ucab_profesor;
GRANT SELECT ON v_cliente_cajero         TO ucab_cajero WITH GRANT OPTION;
GRANT SELECT ON v_perfil_egresado_bolsa  TO ucab_aliado;
GRANT SELECT ON v_auditoria_sesiones     TO ucab_administrativo, ucab_auditor;

-- =====================================================================
-- SECCIÓN 12: RLS — SEGURIDAD A NIVEL DE FILA (MAC-like)
--   La aplicación establece el contexto al inicio de cada sesión:
--     SELECT set_config('app.cedula_actual', '<cedula>', TRUE);
--     SELECT set_config('app.rif_actual',    '<rif>',    TRUE);
-- =====================================================================

-- 12.1 Sesion: cada miembro ve solo sus propias sesiones
ALTER TABLE Sesion ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_sesion_propietario ON Sesion
    FOR SELECT
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (Cedula = current_setting('app.cedula_actual', true));

CREATE POLICY pol_sesion_admin ON Sesion
    FOR ALL
    TO ucab_administrativo
    USING (true);

-- 12.2 Periodo_Vinculacion: cada miembro ve solo sus periodos
ALTER TABLE Periodo_Vinculacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_vinculacion_propietario ON Periodo_Vinculacion
    FOR SELECT
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (Cedula = current_setting('app.cedula_actual', true));

CREATE POLICY pol_vinculacion_admin ON Periodo_Vinculacion
    FOR ALL
    TO ucab_administrativo, ucab_cajero, ucab_entidad_interna
    USING (true);

-- 12.3 Solicitud_Servicio: cada miembro ve solo sus solicitudes
ALTER TABLE Solicitud_Servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_solicitud_propietario ON Solicitud_Servicio
    FOR ALL
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (Cedula = current_setting('app.cedula_actual', true));

CREATE POLICY pol_solicitud_admin ON Solicitud_Servicio
    FOR ALL
    TO ucab_administrativo, ucab_cajero, ucab_entidad_interna
    USING (true);

-- 12.4 Factura: el miembro ve solo sus facturas
ALTER TABLE Factura ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_factura_propietario ON Factura
    FOR SELECT
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (
        ID_Folio IN (
            SELECT fc.ID_Folio
            FROM   Folio_Consumo fc
            JOIN   Solicitud_Servicio ss ON ss.ID_Solicitud = fc.ID_Solicitud
            WHERE  ss.Cedula = current_setting('app.cedula_actual', true)
        )
    );

CREATE POLICY pol_factura_cajero ON Factura
    FOR ALL
    TO ucab_cajero
    USING (true);

CREATE POLICY pol_factura_admin ON Factura
    FOR ALL
    TO ucab_administrativo
    USING (true);

-- 12.5 Vacante_Laboral
ALTER TABLE Vacante_Laboral ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_vacante_aliado ON Vacante_Laboral
    FOR ALL
    TO ucab_aliado
    USING (RIF = current_setting('app.rif_actual', true));

CREATE POLICY pol_vacante_miembro ON Vacante_Laboral
    FOR SELECT
    TO ucab_estudiante, ucab_egresado
    USING (Estatus = 'Disponible');

CREATE POLICY pol_vacante_admin ON Vacante_Laboral
    FOR ALL
    TO ucab_administrativo
    USING (true);

-- 12.6 Postula: egresados ven sus postulaciones; aliados ven las de sus vacantes
ALTER TABLE Postula ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_postula_egresado ON Postula
    FOR ALL
    TO ucab_egresado
    USING (Cedula = current_setting('app.cedula_actual', true));

CREATE POLICY pol_postula_aliado ON Postula
    FOR SELECT
    TO ucab_aliado
    USING (
        ID_Vacante IN (
            SELECT ID_Vacante FROM Vacante_Laboral
            WHERE  RIF = current_setting('app.rif_actual', true)
        )
    );

CREATE POLICY pol_postula_admin ON Postula
    FOR ALL
    TO ucab_administrativo
    USING (true);

-- 12.7 Registro_Acceso: miembros ven solo sus propios registros de estacionamiento
ALTER TABLE Registro_Acceso ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_acceso_parking_miembro ON Registro_Acceso
    FOR SELECT
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (
        ID_Folio IS NULL
        OR (ID_Folio, Numero) IN (
            SELECT ic.ID_Folio, ic.Numero
            FROM   Item_Consumo ic
            JOIN   Folio_Consumo fc      ON fc.ID_Folio     = ic.ID_Folio
            JOIN   Solicitud_Servicio ss ON ss.ID_Solicitud = fc.ID_Solicitud
            WHERE  ss.Cedula = current_setting('app.cedula_actual', true)
        )
    );

CREATE POLICY pol_acceso_parking_cajero ON Registro_Acceso
    FOR ALL
    TO ucab_cajero, ucab_administrativo
    USING (true);

-- =====================================================================
-- SECCIÓN 13: PRIVILEGIOS SOBRE FUNCIONES Y PROCEDIMIENTOS
-- =====================================================================

-- Verificación de contraseña: todos los roles la necesitan para el login
GRANT EXECUTE ON FUNCTION fn_verificar_contrasena(TEXT, TEXT) TO
    ucab_administrativo, ucab_cajero, ucab_profesor,
    ucab_estudiante, ucab_egresado, ucab_aliado, ucab_entidad_interna;

-- Cifrado directo: solo el DBA (el trigger lo invoca como SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION fn_cifrar_contrasena(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION fn_cifrar_contrasena(TEXT) TO ucab_dba;

-- Funciones de negocio (definidas en logic.sql)
GRANT EXECUTE ON FUNCTION fn_tiempo_resolucion(VARCHAR)
    TO ucab_administrativo, ucab_profesor;

GRANT EXECUTE ON FUNCTION fn_indice_recurrencia(VARCHAR)
    TO ucab_administrativo, ucab_cajero, ucab_profesor,
       ucab_estudiante, ucab_egresado;

GRANT EXECUTE ON FUNCTION fn_costo_final_servicio(VARCHAR, VARCHAR)
    TO ucab_administrativo, ucab_cajero, ucab_estudiante,
       ucab_egresado, ucab_profesor;

GRANT EXECUTE ON FUNCTION fn_dias_habiles(TIMESTAMP, TIMESTAMP)
    TO ucab_administrativo, ucab_profesor;

-- Procedimientos almacenados (solo administrativo)
GRANT EXECUTE ON PROCEDURE proc_cierre_masivo_folios()            TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_actualizar_tasa(DATE, REAL, REAL) TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_archivar_expirados()              TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_transicion_mayoria_edad()         TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_conciliacion_financiera(DATE, DATE) TO ucab_administrativo;

-- =====================================================================
--  Fin de security.sql
-- =====================================================================