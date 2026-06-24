CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ampliar columna de contraseña para alojar el texto cifrado en base64
ALTER TABLE Miembro_Comunidad
    ALTER COLUMN Contrasena TYPE TEXT;

-- Clave simétrica para la sesión actual (para la migración de datos)
SET app.clave_simetrica = 'UCABServices';

-- Clave simétrica como parámetro por defecto para todas las conexiones futuras
ALTER DATABASE proyectobd SET app.clave_simetrica = 'UCABServices';

-- Función de cifrado: recibe texto plano y devuelve el cifrado en base64
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

-- Función de verificación: compara contraseña plana con la almacenada cifrada
CREATE OR REPLACE FUNCTION fn_verificar_contrasena(
    p_contrasena_plana    TEXT,
    p_contrasena_cifrada  TEXT
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

-- Trigger: cifra automáticamente la contraseña en INSERT o en UPDATE de Contrasena
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

CREATE TRIGGER trg_cifrar_contrasena
BEFORE INSERT OR UPDATE OF Contrasena ON Miembro_Comunidad
FOR EACH ROW EXECUTE FUNCTION fn_trigger_cifrar_contrasena();

-- Migrar contraseñas en texto plano existentes al formato cifrado
-- Se desactiva el trigger para hacer el cifrado directamente
ALTER TABLE Miembro_Comunidad DISABLE TRIGGER trg_cifrar_contrasena;

UPDATE Miembro_Comunidad
SET Contrasena = encode(
    pgp_sym_encrypt(Contrasena, current_setting('app.clave_simetrica', false)),
    'base64'
);

ALTER TABLE Miembro_Comunidad ENABLE TRIGGER trg_cifrar_contrasena;

-- Roles funcionales del negocio UCAB
CREATE ROLE ucab_dba;
CREATE ROLE ucab_administrativo;
CREATE ROLE ucab_cajero;
CREATE ROLE ucab_profesor;
CREATE ROLE ucab_estudiante;
CREATE ROLE ucab_egresado;
CREATE ROLE ucab_aliado;
CREATE ROLE ucab_entidad_interna;

-- Cuentas de usuario del sistema (una por rol)
CREATE USER app_administrativo  WITH PASSWORD 'Admin';
CREATE USER app_cajero          WITH PASSWORD 'Cajero';
CREATE USER app_profesor        WITH PASSWORD 'Profesor';
CREATE USER app_estudiante      WITH PASSWORD 'Estudiante';
CREATE USER app_egresado        WITH PASSWORD 'Egresado';
CREATE USER app_aliado          WITH PASSWORD 'Aliado';
CREATE USER app_entidad         WITH PASSWORD 'Entidad';

-- Asignación de cuentas a sus roles correspondientes
GRANT ucab_administrativo  TO app_administrativo;
GRANT ucab_cajero          TO app_cajero;
GRANT ucab_profesor        TO app_profesor;
GRANT ucab_estudiante      TO app_estudiante;
GRANT ucab_egresado        TO app_egresado;
GRANT ucab_aliado          TO app_aliado;
GRANT ucab_entidad_interna TO app_entidad;

-- Acceso al esquema para todos los roles de la aplicación
GRANT USAGE ON SCHEMA public TO
    ucab_administrativo, ucab_cajero, ucab_profesor,
    ucab_estudiante, ucab_egresado, ucab_aliado, ucab_entidad_interna;

-- ==== ROL: ucab_estudiante ====
-- Estudiante activo: accede a servicios, reservas, pagos y su información académica

GRANT SELECT                         ON Sede                 TO ucab_estudiante;
GRANT SELECT                         ON Categoria_Servicio   TO ucab_estudiante;
GRANT SELECT                         ON Servicio             TO ucab_estudiante;
GRANT SELECT                         ON Requisitos_Acceso    TO ucab_estudiante;
GRANT SELECT                         ON Acreditacion         TO ucab_estudiante;
GRANT SELECT, INSERT, UPDATE         ON Cumple               TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Solicitud_Servicio   TO ucab_estudiante;
GRANT SELECT, INSERT, DELETE         ON Acompanante          TO ucab_estudiante;
GRANT SELECT                         ON Folio_Consumo        TO ucab_estudiante;
GRANT SELECT                         ON Item_Consumo         TO ucab_estudiante;
GRANT SELECT                         ON Factura              TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Pago                 TO ucab_estudiante;
GRANT SELECT, INSERT                 ON TAI                  TO ucab_estudiante;
GRANT SELECT                         ON Periodo_Vinculacion  TO ucab_estudiante;
GRANT SELECT                         ON Estudiante           TO ucab_estudiante;
GRANT SELECT                         ON Becario              TO ucab_estudiante;
GRANT SELECT                         ON Preparador           TO ucab_estudiante;
GRANT SELECT                         ON Sesion               TO ucab_estudiante;
GRANT SELECT                         ON Zona_Estacionamiento TO ucab_estudiante;
GRANT SELECT                         ON Puesto               TO ucab_estudiante;
GRANT SELECT, INSERT, UPDATE         ON Registro_Acceso      TO ucab_estudiante;
GRANT SELECT                         ON Vacante_Laboral      TO ucab_estudiante;
GRANT SELECT                         ON Edificacion          TO ucab_estudiante;
GRANT SELECT                         ON Espacio_Fisico       TO ucab_estudiante;
GRANT SELECT, INSERT                 ON Reserva              TO ucab_estudiante;
GRANT SELECT                         ON Paso_Actividad       TO ucab_estudiante;
GRANT SELECT                         ON Entidad_Prestadora   TO ucab_estudiante;
GRANT SELECT                         ON Tasa                 TO ucab_estudiante;
GRANT SELECT                         ON Regula               TO ucab_estudiante;
-- El estudiante NO tiene acceso a: Contrasena (via vista), Personal_Administrativo,
--   Profesor, Entidad_Interna/Externa, Tercero_Corporativo, datos de otros miembros

-- ==== ROL: ucab_egresado ====
-- Hereda todos los privilegios de estudiante, añade acceso a vacantes laborales
GRANT ucab_estudiante TO ucab_egresado;

GRANT SELECT                         ON Egresado             TO ucab_egresado;
GRANT SELECT, INSERT                 ON Postula              TO ucab_egresado;
GRANT UPDATE (Estatus)               ON Postula              TO ucab_egresado;

-- ==== ROL: ucab_profesor ====
-- Profesor: gestiona pasos de actividad y accede a reportes de la plataforma

GRANT SELECT                         ON Sede                 TO ucab_profesor;
GRANT SELECT                         ON Categoria_Servicio   TO ucab_profesor;
GRANT SELECT                         ON Servicio             TO ucab_profesor;
GRANT SELECT                         ON Requisitos_Acceso    TO ucab_profesor;
GRANT SELECT                         ON Acreditacion         TO ucab_profesor;
GRANT SELECT                         ON Cumple               TO ucab_profesor;
GRANT SELECT, INSERT                 ON Solicitud_Servicio   TO ucab_profesor;
GRANT SELECT, UPDATE (Estado_Paso, Fecha_Completada)
                                     ON Paso_Actividad       TO ucab_profesor;
GRANT SELECT, INSERT, DELETE         ON Acompanante          TO ucab_profesor;
GRANT SELECT                         ON Folio_Consumo        TO ucab_profesor;
GRANT SELECT                         ON Item_Consumo         TO ucab_profesor;
GRANT SELECT                         ON Factura              TO ucab_profesor;
GRANT SELECT, INSERT                 ON Pago                 TO ucab_profesor;
GRANT SELECT, INSERT                 ON TAI                  TO ucab_profesor;
GRANT SELECT                         ON Periodo_Vinculacion  TO ucab_profesor;
GRANT SELECT                         ON Profesor             TO ucab_profesor;
GRANT SELECT                         ON Sesion               TO ucab_profesor;
GRANT SELECT                         ON Zona_Estacionamiento TO ucab_profesor;
GRANT SELECT                         ON Puesto               TO ucab_profesor;
GRANT SELECT, INSERT, UPDATE         ON Registro_Acceso      TO ucab_profesor;
GRANT SELECT                         ON Edificacion          TO ucab_profesor;
GRANT SELECT                         ON Espacio_Fisico       TO ucab_profesor;
GRANT SELECT, INSERT                 ON Reserva              TO ucab_profesor;
GRANT SELECT                         ON Entidad_Prestadora   TO ucab_profesor;
GRANT SELECT                         ON Tasa                 TO ucab_profesor;
GRANT SELECT                         ON Regula               TO ucab_profesor;
-- Reportes (solo lectura sobre vistas analíticas)
GRANT SELECT                         ON v_reporte_cuellos_botella     TO ucab_profesor;
GRANT SELECT                         ON v_reporte_ocupacion_espacios  TO ucab_profesor;
GRANT SELECT                         ON v_solicitudes_activas         TO ucab_profesor;
GRANT SELECT                         ON v_espacios_disponibles        TO ucab_profesor;
GRANT SELECT                         ON v_vinculaciones_activas       TO ucab_profesor;

-- ==== ROL: ucab_cajero ====
-- Cajero: valida pagos, procesa facturas y verifica identidad del cliente

GRANT SELECT                         ON Sede                 TO ucab_cajero;
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
GRANT SELECT                         ON Zona_Estacionamiento TO ucab_cajero;
GRANT SELECT, UPDATE (Estado)        ON Puesto               TO ucab_cajero;
GRANT SELECT, INSERT, UPDATE         ON Registro_Acceso      TO ucab_cajero;
-- El cajero usa v_cliente_cajero en lugar de Miembro_Comunidad directamente

-- ==== ROL: ucab_administrativo ====
-- Personal administrativo: acceso amplio para gestionar la plataforma completa

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ucab_administrativo;

-- El administrativo puede propagar acceso a vistas de reportes a otros roles
GRANT SELECT ON v_reporte_cuellos_botella    TO ucab_administrativo WITH GRANT OPTION;
GRANT SELECT ON v_reporte_ocupacion_espacios TO ucab_administrativo WITH GRANT OPTION;
GRANT SELECT ON v_facturas_pendientes        TO ucab_administrativo WITH GRANT OPTION;
GRANT SELECT ON v_vinculaciones_activas      TO ucab_administrativo WITH GRANT OPTION;

-- Restricción de auditoría: el administrativo NO puede borrar registros contables ni de sesión
-- Garantiza trazabilidad total (audit trail)
REVOKE DELETE ON Sesion          FROM ucab_administrativo;
REVOKE DELETE ON Factura         FROM ucab_administrativo;
REVOKE DELETE ON Pago            FROM ucab_administrativo;
REVOKE DELETE ON Paso_Actividad  FROM ucab_administrativo;
REVOKE DELETE ON Item_Consumo    FROM ucab_administrativo;

-- ==== ROL: ucab_aliado ====
-- Empresa aliada: gestiona sus vacantes y visualiza currículos de postulantes

GRANT SELECT                         ON Sede                 TO ucab_aliado;
GRANT SELECT                         ON Entidad_Prestadora   TO ucab_aliado;
GRANT SELECT                         ON Entidad_Externa      TO ucab_aliado;
GRANT SELECT, INSERT, UPDATE         ON Vacante_Laboral      TO ucab_aliado;
GRANT SELECT                         ON Postula              TO ucab_aliado;
GRANT SELECT                         ON Periodo_Vinculacion  TO ucab_aliado;
GRANT SELECT                         ON Egresado             TO ucab_aliado;
GRANT SELECT                         ON Servicio             TO ucab_aliado;
GRANT SELECT                         ON Categoria_Servicio   TO ucab_aliado;
-- El aliado NO tiene acceso a datos personales del miembro ni datos financieros

-- ==== ROL: ucab_entidad_interna ====
-- Dependencias UCAB: gestionan sus propios servicios y pasos de actividad

GRANT SELECT                         ON Sede                 TO ucab_entidad_interna;
GRANT SELECT                         ON Categoria_Servicio   TO ucab_entidad_interna;
GRANT SELECT                         ON Regula               TO ucab_entidad_interna;
GRANT SELECT                         ON Edificacion          TO ucab_entidad_interna;
GRANT SELECT                         ON Espacio_Fisico       TO ucab_entidad_interna;
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


-- ============================================================
-- SECCIÓN 4: VISTAS DE SEGURIDAD (DAC reforzado con vistas)
-- "Las vistas permiten acceso solo a un subconjunto específico de R"
-- ============================================================

-- Vista 1: Perfil público del miembro (sin contraseña)
-- Permite que administrativos y cajeros vean datos del miembro
-- sin exponer la columna Contrasena cifrada
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
-- El cajero identifica al cliente sin ver datos académicos ni contraseña
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
-- El aliado externo solo ve el perfil académico, NO los datos de contacto personales
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
-- Excluye deliberadamente: dirección, teléfono, correo y contraseña

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

-- Otorgar acceso a las vistas de seguridad
GRANT SELECT ON v_miembro_publico         TO ucab_administrativo, ucab_profesor;
GRANT SELECT ON v_cliente_cajero          TO ucab_cajero WITH GRANT OPTION;
GRANT SELECT ON v_perfil_egresado_bolsa   TO ucab_aliado;
GRANT SELECT ON v_auditoria_sesiones      TO ucab_administrativo;


-- ============================================================
-- SECCIÓN 5: RLS — SEGURIDAD A NIVEL DE FILA (MAC-like)
-- "El motor de la base de datos es el que obliga la política"
-- La aplicación establece el contexto por sesión:
--   SELECT set_config('app.cedula_actual', '<cedula>', TRUE);
--   SELECT set_config('app.rif_actual',    '<rif>',    TRUE);
-- ============================================================

-- 5.1 Sesion: cada miembro ve únicamente sus propias sesiones
ALTER TABLE Sesion ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_sesion_propietario ON Sesion
    FOR SELECT
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (Cedula = current_setting('app.cedula_actual', true));

CREATE POLICY pol_sesion_admin ON Sesion
    FOR ALL
    TO ucab_administrativo
    USING (true);

-- 5.2 Periodo_Vinculacion: cada miembro ve solo sus periodos
ALTER TABLE Periodo_Vinculacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_vinculacion_propietario ON Periodo_Vinculacion
    FOR SELECT
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (Cedula = current_setting('app.cedula_actual', true));

CREATE POLICY pol_vinculacion_admin ON Periodo_Vinculacion
    FOR ALL
    TO ucab_administrativo, ucab_cajero, ucab_entidad_interna
    USING (true);

-- 5.3 Solicitud_Servicio: cada miembro ve solo sus solicitudes
ALTER TABLE Solicitud_Servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_solicitud_propietario ON Solicitud_Servicio
    FOR ALL
    TO ucab_estudiante, ucab_egresado, ucab_profesor
    USING (Cedula = current_setting('app.cedula_actual', true));

CREATE POLICY pol_solicitud_admin ON Solicitud_Servicio
    FOR ALL
    TO ucab_administrativo, ucab_cajero, ucab_entidad_interna
    USING (true);

-- 5.4 Factura: el miembro ve solo sus facturas (vía folio → solicitud → cedula)
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

-- 5.5 Vacante_Laboral: aliados gestionan solo sus vacantes; miembros ven solo las disponibles
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

-- 5.6 Postula: egresados ven sus propias postulaciones; aliados ven las de sus vacantes
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

-- 5.7 Registro_Acceso: miembros solo ven sus propios registros de estacionamiento
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


-- ============================================================
-- SECCIÓN 6: PRIVILEGIOS SOBRE FUNCIONES Y PROCEDIMIENTOS
-- ============================================================

-- Todos los roles de la aplicación pueden verificar contraseñas (para login)
GRANT EXECUTE ON FUNCTION fn_verificar_contrasena(TEXT, TEXT) TO
    ucab_administrativo, ucab_cajero, ucab_profesor,
    ucab_estudiante, ucab_egresado, ucab_aliado, ucab_entidad_interna;

-- Solo el DBA puede invocar fn_cifrar_contrasena directamente
-- (el trigger la llama internamente como SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION fn_cifrar_contrasena(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION fn_cifrar_contrasena(TEXT) TO ucab_dba;

-- Funciones de negocio según rol
GRANT EXECUTE ON FUNCTION fn_tiempo_resolucion(VARCHAR)
    TO ucab_administrativo, ucab_profesor;

GRANT EXECUTE ON FUNCTION fn_indice_recurrencia(VARCHAR)
    TO ucab_administrativo, ucab_cajero, ucab_profesor, ucab_estudiante, ucab_egresado;

GRANT EXECUTE ON FUNCTION fn_costo_final_servicio(VARCHAR, VARCHAR)
    TO ucab_administrativo, ucab_cajero, ucab_estudiante, ucab_egresado, ucab_profesor;

GRANT EXECUTE ON FUNCTION fn_dias_habiles(DATE, DATE)
    TO ucab_administrativo, ucab_profesor;

-- Procedimientos almacenados (solo administrativo)
GRANT EXECUTE ON PROCEDURE proc_cierre_masivo_folios()            TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_actualizar_tasa(DATE, REAL, REAL) TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_archivar_expirados()              TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_transicion_mayoria_edad()         TO ucab_administrativo;
GRANT EXECUTE ON PROCEDURE proc_conciliacion_financiera(DATE)     TO ucab_administrativo;
