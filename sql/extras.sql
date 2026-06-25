-- =================================================================
-- UCAB Services — Triggers, Functions, Procedure, Views
-- Run in pgAdmin in this exact order (A1 → A2 → A3 → A4)
-- =================================================================

-- ================================================================
-- A1. TRIGGERS
-- ================================================================

-- TRIGGER 1: Validate Item_Consumo price against category limits
CREATE OR REPLACE FUNCTION fn_validar_precio_item()
RETURNS TRIGGER AS $$
DECLARE
  v_min  REAL;
  v_max  REAL;
  v_sol  VARCHAR(50);
BEGIN
  SELECT fc.id_solicitud INTO v_sol
  FROM   Folio_Consumo fc WHERE fc.id_folio = NEW.id_folio;

  SELECT r.costo_min, r.costo_max
  INTO   v_min, v_max
  FROM   Solicitud_Servicio ss
  JOIN   Servicio           sv ON sv.id_servicio = ss.id_servicio
  JOIN   Regula             r  ON r.id_categoria = sv.id_categoria
  JOIN   Miembro_Comunidad  mc ON mc.cedula      = ss.cedula
  WHERE  ss.id_solicitud = v_sol
    AND  r.id_sede       = mc.id_sede;

  IF v_min IS NOT NULL AND NEW.precio > 0 THEN
    IF NEW.precio < v_min OR NEW.precio > v_max THEN
      RAISE EXCEPTION
        'Precio % fuera del rango permitido [%, %]',
        NEW.precio, v_min, v_max;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_validar_precio_item
BEFORE INSERT OR UPDATE ON Item_Consumo
FOR EACH ROW EXECUTE FUNCTION fn_validar_precio_item();

-- TRIGGER 2: Suspend account when no active vinculaciones remain
CREATE OR REPLACE FUNCTION fn_suspender_cuenta_sin_vinculacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_fin IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM Periodo_Vinculacion
      WHERE  cedula       = NEW.cedula
        AND  fecha_fin    IS NULL
        AND  fecha_inicio <> NEW.fecha_inicio
    ) THEN
      UPDATE Miembro_Comunidad
      SET    estado_de_cuenta = 'Suspendida'
      WHERE  cedula           = NEW.cedula
        AND  estado_de_cuenta = 'Activa';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_suspender_cuenta
AFTER UPDATE ON Periodo_Vinculacion
FOR EACH ROW EXECUTE FUNCTION fn_suspender_cuenta_sin_vinculacion();

-- TRIGGER 3: Mark space unavailable on reserva insert
CREATE OR REPLACE FUNCTION fn_marcar_espacio_no_disponible()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE Espacio_Fisico
  SET    disponibilidad = 'No disponible'
  WHERE  id_sede            = NEW.id_sede
    AND  nombre_edificacion = NEW.nombre_edificacion
    AND  numero_espacio     = NEW.numero_espacio;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_espacio_no_disponible
AFTER INSERT ON Reserva
FOR EACH ROW EXECUTE FUNCTION fn_marcar_espacio_no_disponible();

-- TRIGGER 4: Auto-timestamp when Paso_Actividad is completed
CREATE OR REPLACE FUNCTION fn_timestamp_paso_completado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado_paso = 'Completado' AND
    (OLD.estado_paso IS DISTINCT FROM 'Completado') THEN
    NEW.fecha_completada = CURRENT_TIMESTAMP;
  END IF;
  IF OLD.estado_paso = 'Completado' THEN
    NEW.fecha_completada = OLD.fecha_completada;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_timestamp_paso
BEFORE UPDATE ON Paso_Actividad
FOR EACH ROW EXECUTE FUNCTION fn_timestamp_paso_completado();

-- TRIGGER 5: Block duplicate reservations
CREATE OR REPLACE FUNCTION fn_evitar_duplicado_reserva()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM Reserva
    WHERE id_sede            = NEW.id_sede
      AND nombre_edificacion = NEW.nombre_edificacion
      AND numero_espacio     = NEW.numero_espacio
      AND fecha_uso          = NEW.fecha_uso
      AND bloque_horario     = NEW.bloque_horario
  ) THEN
    RAISE EXCEPTION
      'El espacio ya tiene una reserva en ese bloque horario';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_evitar_duplicado_reserva
BEFORE INSERT ON Reserva
FOR EACH ROW EXECUTE FUNCTION fn_evitar_duplicado_reserva();

-- TRIGGER 6: Block suspended/blocked accounts from new requests
CREATE OR REPLACE FUNCTION fn_verificar_estado_cuenta()
RETURNS TRIGGER AS $$
DECLARE
  v_estado VARCHAR(20);
BEGIN
  SELECT estado_de_cuenta INTO v_estado
  FROM   Miembro_Comunidad WHERE cedula = NEW.cedula;

  IF v_estado IN ('Bloqueada', 'Suspendida') THEN
    RAISE EXCEPTION
      'Cuenta % — no puede realizar solicitudes', v_estado;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_verificar_estado_cuenta
BEFORE INSERT ON Solicitud_Servicio
FOR EACH ROW EXECUTE FUNCTION fn_verificar_estado_cuenta();


-- ================================================================
-- A2. FUNCTIONS
-- ================================================================

-- FUNCTION 1: Resolution time excluding weekends
CREATE OR REPLACE FUNCTION fn_tiempo_resolucion(p_id_solicitud VARCHAR)
RETURNS TABLE (
  horas_netas    NUMERIC,
  dias_habiles   NUMERIC,
  fecha_apertura TIMESTAMP,
  fecha_cierre   TIMESTAMP
) AS $$
DECLARE
  v_apertura TIMESTAMP;
  v_cierre   TIMESTAMP;
  v_diff_hrs NUMERIC;
  v_cur      TIMESTAMP;
  v_fines    NUMERIC := 0;
BEGIN
  SELECT ss.fecha_apertura::TIMESTAMP,
         MAX(pa.fecha_completada)
  INTO   v_apertura, v_cierre
  FROM   Solicitud_Servicio ss
  JOIN   Paso_Actividad pa ON pa.id_solicitud = ss.id_solicitud
  WHERE  ss.id_solicitud = p_id_solicitud
  GROUP  BY ss.fecha_apertura;

  IF v_cierre IS NULL THEN v_cierre := CURRENT_TIMESTAMP; END IF;

  v_cur := v_apertura;
  WHILE v_cur < v_cierre LOOP
    IF EXTRACT(DOW FROM v_cur) IN (0, 6) THEN
      v_fines := v_fines + 1;
    END IF;
    v_cur := v_cur + INTERVAL '1 hour';
  END LOOP;

  v_diff_hrs := EXTRACT(EPOCH FROM (v_cierre - v_apertura)) / 3600;

  RETURN QUERY SELECT
    ROUND((v_diff_hrs - v_fines)::NUMERIC, 2),
    ROUND(((v_diff_hrs - v_fines) / 8)::NUMERIC, 2),
    v_apertura,
    v_cierre;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 2: Member recurrence index
CREATE OR REPLACE FUNCTION fn_indice_recurrencia(p_cedula VARCHAR)
RETURNS TABLE (
  indice    NUMERIC,
  categoria VARCHAR,
  servicios BIGINT,
  facturas  BIGINT,
  pagadas   BIGINT
) AS $$
DECLARE
  v_servicios BIGINT;
  v_facturas  BIGINT;
  v_pagadas   BIGINT;
  v_score     NUMERIC;
  v_cat       VARCHAR;
BEGIN
  SELECT COUNT(*) INTO v_servicios
  FROM   Solicitud_Servicio
  WHERE  cedula        = p_cedula
    AND  estado        = 'Completada'
    AND  fecha_apertura >= CURRENT_DATE - INTERVAL '12 months';

  SELECT
    COUNT(*),
    COUNT(*) FILTER (
      WHERE (
        SELECT COALESCE(SUM(p.monto), 0)
        FROM   Pago p WHERE p.id_factura = f.id_factura
      ) >= f.monto
    )
  INTO v_facturas, v_pagadas
  FROM   Factura f
  JOIN   Folio_Consumo      fc ON fc.id_folio     = f.id_folio
  JOIN   Solicitud_Servicio ss ON ss.id_solicitud = fc.id_solicitud
  WHERE  ss.cedula = p_cedula;

  v_score := (v_servicios * 10)
           + (CASE WHEN v_facturas > 0
                   THEN (v_pagadas::NUMERIC / v_facturas) * 50
                   ELSE 0 END);

  v_cat := CASE
    WHEN v_score >= 80 THEN 'Preferencial'
    WHEN v_score >= 40 THEN 'Frecuente'
    ELSE 'Regular'
  END;

  RETURN QUERY SELECT
    ROUND(v_score, 2), v_cat, v_servicios, v_facturas, v_pagadas;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 3: Final cost with loyalty discounts
CREATE OR REPLACE FUNCTION fn_costo_final_servicio(
  p_id_servicio VARCHAR,
  p_cedula      VARCHAR
)
RETURNS TABLE (
  precio_base   REAL,
  descuento_pct NUMERIC,
  precio_final  REAL,
  tipo_tarifa   VARCHAR
) AS $$
DECLARE
  v_base REAL;
  v_desc NUMERIC := 0;
  v_tipo VARCHAR;
  v_cat  VARCHAR;
BEGIN
  SELECT r.costo_min INTO v_base
  FROM   Servicio s
  JOIN   Regula r ON r.id_categoria = s.id_categoria
  JOIN   Miembro_Comunidad mc ON mc.id_sede = r.id_sede
  WHERE  s.id_servicio = p_id_servicio AND mc.cedula = p_cedula;

  IF EXISTS (SELECT 1 FROM Estudiante WHERE cedula = p_cedula) THEN
    v_tipo := 'Miembro Activo (Estudiante)';
  ELSIF EXISTS (SELECT 1 FROM Egresado WHERE cedula = p_cedula) THEN
    v_tipo := 'Egresado'; v_desc := 5;
  ELSE
    v_tipo := 'Miembro Activo (Empleado)';
  END IF;

  SELECT categoria INTO v_cat FROM fn_indice_recurrencia(p_cedula);
  IF v_cat = 'Preferencial' THEN v_desc := v_desc + 15;
  ELSIF v_cat = 'Frecuente' THEN v_desc := v_desc + 8;
  END IF;

  RETURN QUERY SELECT
    v_base, v_desc,
    ROUND((v_base * (1 - v_desc / 100))::NUMERIC, 2)::REAL,
    v_tipo;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- A3. STORED PROCEDURE
-- ================================================================

CREATE OR REPLACE PROCEDURE proc_cierre_masivo_folios()
LANGUAGE plpgsql AS $$
DECLARE
  v_folio  RECORD;
  v_monto  REAL;
  v_id_fac VARCHAR(50);
BEGIN
  FOR v_folio IN
    SELECT id_folio FROM Folio_Consumo WHERE estado = 'Abierto'
  LOOP
    SELECT COALESCE(SUM(precio * cantidad + impuesto), 0)
    INTO   v_monto
    FROM   Item_Consumo WHERE id_folio = v_folio.id_folio;

    UPDATE Folio_Consumo SET estado = 'Cerrado'
    WHERE  id_folio = v_folio.id_folio;

    IF v_monto > 0 THEN
      v_id_fac := 'FAC-CIERRE-' || v_folio.id_folio || '-' ||
                  TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
      INSERT INTO Factura (id_factura, emisión, monto, id_folio, rif)
      VALUES (v_id_fac, CURRENT_DATE, v_monto, v_folio.id_folio, NULL);
    END IF;
  END LOOP;
END;
$$;


-- ================================================================
-- A4. VIEWS FOR POWERBI
-- ================================================================

-- View 1: Response times by office
CREATE OR REPLACE VIEW v_tiempos_respuesta AS
SELECT
  ss.id_solicitud,
  sv.descripcion                              AS tramite,
  pa.responsable                              AS oficina,
  pa.fecha_inicio,
  pa.fecha_completada,
  pa.estado_paso,
  ROUND(
    EXTRACT(EPOCH FROM (
      COALESCE(pa.fecha_completada, CURRENT_TIMESTAMP) - pa.fecha_inicio
    )) / 3600, 2
  )                                           AS horas_transcurridas,
  mc.cedula,
  p.primer_nombre || ' ' || p.primer_apellido AS solicitante,
  se.nombre                                   AS sede
FROM   Paso_Actividad      pa
JOIN   Solicitud_Servicio  ss ON ss.id_solicitud = pa.id_solicitud
JOIN   Servicio            sv ON sv.id_servicio  = ss.id_servicio
JOIN   Miembro_Comunidad   mc ON mc.cedula       = ss.cedula
JOIN   Persona             p  ON p.cedula        = mc.cedula
JOIN   Sede                se ON se.id_sede      = mc.id_sede;

-- View 2: Session audit
CREATE OR REPLACE VIEW v_auditoria_sesiones AS
SELECT
  s.cedula,
  p.primer_nombre || ' ' || p.primer_apellido AS nombre,
  mc.correo_institucional,
  mc.estado_de_cuenta,
  s.fecha_hora_acceso,
  s.direccion_ip,
  s.uuid                                      AS session_uuid,
  s.intentos_fallidos,
  s.latitud,
  s.longitud,
  CASE
    WHEN s.intentos_fallidos >= 5 THEN 'Alto riesgo'
    WHEN s.intentos_fallidos >= 3 THEN 'Riesgo moderado'
    ELSE 'Normal'
  END                                         AS nivel_riesgo
FROM   Sesion            s
JOIN   Persona           p  ON p.cedula  = s.cedula
JOIN   Miembro_Comunidad mc ON mc.cedula = s.cedula;

-- View 3: Multi-currency payment reconciliation
CREATE OR REPLACE VIEW v_conciliacion_pagos AS
SELECT
  f.id_factura,
  f.monto                                     AS monto_total,
  f.emisión                                   AS fecha_factura,
  COALESCE(SUM(pg.monto), 0)                  AS total_pagado,
  GREATEST(f.monto - COALESCE(SUM(pg.monto), 0), 0) AS saldo,
  CASE
    WHEN COALESCE(SUM(pg.monto), 0) = 0            THEN 'Pendiente'
    WHEN f.monto - COALESCE(SUM(pg.monto), 0) <= 0 THEN 'Pagada'
    ELSE 'Parcial'
  END                                         AS estado,
  pg.id_pago,
  pg.monto                                    AS monto_pago,
  pg.fecha_pago,
  t.usd                                       AS tasa_usd,
  CASE
    WHEN tai.id_pago IS NOT NULL THEN 'TAI'
    WHEN ef.id_pago  IS NOT NULL THEN 'Efectivo'
    WHEN pm.id_pago  IS NOT NULL THEN 'Pago Móvil'
    WHEN tj.id_pago  IS NOT NULL THEN 'Tarjeta'
    WHEN cr.id_pago  IS NOT NULL THEN 'Cripto'
    WHEN ze.id_pago  IS NOT NULL THEN 'Zelle'
  END                                         AS metodo_pago,
  sv.descripcion                              AS servicio,
  mc.cedula,
  p.primer_nombre || ' ' || p.primer_apellido AS miembro,
  se.nombre                                   AS sede
FROM   Factura            f
JOIN   Folio_Consumo      fc  ON fc.id_folio     = f.id_folio
JOIN   Solicitud_Servicio ss  ON ss.id_solicitud = fc.id_solicitud
JOIN   Servicio           sv  ON sv.id_servicio  = ss.id_servicio
JOIN   Miembro_Comunidad  mc  ON mc.cedula       = ss.cedula
JOIN   Persona            p   ON p.cedula        = mc.cedula
JOIN   Sede               se  ON se.id_sede      = mc.id_sede
LEFT   JOIN Pago          pg  ON pg.id_factura   = f.id_factura
LEFT   JOIN Tasa          t   ON t.fecha_tasa    = pg.fecha_pago
LEFT   JOIN TAI           tai ON tai.id_pago     = pg.id_pago
LEFT   JOIN Efectivo      ef  ON ef.id_pago      = pg.id_pago
LEFT   JOIN Pago_Movil    pm  ON pm.id_pago      = pg.id_pago
LEFT   JOIN Tarjeta       tj  ON tj.id_pago      = pg.id_pago
LEFT   JOIN Cripto        cr  ON cr.id_pago      = pg.id_pago
LEFT   JOIN Zelle         ze  ON ze.id_pago      = pg.id_pago
GROUP  BY f.id_factura, f.monto, f.emisión, pg.id_pago,
          pg.monto, pg.fecha_pago, t.usd,
          tai.id_pago, ef.id_pago, pm.id_pago,
          tj.id_pago, cr.id_pago, ze.id_pago,
          sv.descripcion, mc.cedula,
          p.primer_nombre, p.primer_apellido, se.nombre;

-- View 4: Space profitability
CREATE OR REPLACE VIEW v_rentabilidad_espacios AS
SELECT
  se.nombre                                   AS sede,
  ef.nombre_edificacion,
  e.numero_espacio,
  e.tipo_espacio,
  e.capacidad_max,
  COUNT(r.id_solicitud)                       AS total_reservas,
  COALESCE(SUM(ic.precio * ic.cantidad), 0)   AS ingresos_totales
FROM   Espacio_Fisico e
JOIN   Edificacion    ef ON ef.id_sede            = e.id_sede
                        AND ef.nombre_edificacion = e.nombre_edificacion
JOIN   Sede           se ON se.id_sede            = ef.id_sede
LEFT   JOIN Reserva   r  ON r.id_sede             = e.id_sede
                        AND r.nombre_edificacion  = e.nombre_edificacion
                        AND r.numero_espacio      = e.numero_espacio
LEFT   JOIN Solicitud_Servicio ss ON ss.id_solicitud = r.id_solicitud
LEFT   JOIN Folio_Consumo      fc ON fc.id_solicitud = ss.id_solicitud
LEFT   JOIN Item_Consumo       ic ON ic.id_folio     = fc.id_folio
GROUP  BY se.nombre, ef.nombre_edificacion,
          e.numero_espacio, e.tipo_espacio, e.capacidad_max;

-- View 5: Institutional trajectory
CREATE OR REPLACE VIEW v_trayectoria_institucional AS
SELECT
  mc.cedula,
  p.primer_nombre || ' ' || p.primer_apellido AS nombre,
  mc.correo_institucional,
  pv.fecha_inicio,
  pv.fecha_fin,
  CASE
    WHEN e.cedula  IS NOT NULL THEN 'Estudiante'
    WHEN pr.cedula IS NOT NULL THEN 'Profesor'
    WHEN pa.cedula IS NOT NULL THEN 'Personal Administrativo'
    WHEN eg.cedula IS NOT NULL THEN 'Egresado'
    ELSE 'Sin rol'
  END                                         AS rol,
  CASE
    WHEN e.cedula  IS NOT NULL THEN e.escuela
    WHEN pr.cedula IS NOT NULL THEN pr.escalafon
    WHEN pa.cedula IS NOT NULL THEN pa.unidad_adscripcion
    WHEN eg.cedula IS NOT NULL THEN eg.titulo
  END                                         AS atributo_principal,
  se.nombre                                   AS sede
FROM   Periodo_Vinculacion          pv
JOIN   Miembro_Comunidad            mc ON mc.cedula      = pv.cedula
JOIN   Persona                      p  ON p.cedula       = pv.cedula
JOIN   Sede                         se ON se.id_sede     = mc.id_sede
LEFT   JOIN Estudiante              e  ON e.cedula       = pv.cedula AND e.fecha_inicio  = pv.fecha_inicio
LEFT   JOIN Profesor                pr ON pr.cedula      = pv.cedula AND pr.fecha_inicio = pv.fecha_inicio
LEFT   JOIN Personal_Administrativo pa ON pa.cedula      = pv.cedula AND pa.fecha_inicio = pv.fecha_inicio
LEFT   JOIN Egresado                eg ON eg.cedula      = pv.cedula AND eg.fecha_inicio = pv.fecha_inicio;

-- View 6: Job board effectiveness
CREATE OR REPLACE VIEW v_bolsa_trabajo_efectividad AS
SELECT
  vl.id_vacante,
  vl.cargo,
  vl.estatus                                  AS estado_vacante,
  vl.fecha_oferta,
  ee.razon_social                             AS empresa,
  COUNT(po.cedula)                            AS total_postulaciones,
  COUNT(po.cedula)
    FILTER (WHERE po.estatus = 'Contactado')  AS contactados,
  p.primer_nombre || ' ' || p.primer_apellido AS egresado,
  eg.titulo,
  eg.indice_academico,
  po.fecha_postulacion,
  po.estatus                                  AS estado_postulacion
FROM   Vacante_Laboral vl
JOIN   Entidad_Externa ee ON ee.rif        = vl.rif
LEFT   JOIN Postula    po ON po.id_vacante = vl.id_vacante
LEFT   JOIN Egresado   eg ON eg.cedula     = po.cedula
                         AND eg.fecha_inicio = po.fecha_inicio
LEFT   JOIN Persona    p  ON p.cedula      = po.cedula
GROUP  BY vl.id_vacante, vl.cargo, vl.estatus, vl.fecha_oferta,
          ee.razon_social, p.primer_nombre, p.primer_apellido,
          eg.titulo, eg.indice_academico,
          po.fecha_postulacion, po.estatus;

-- View 7: Parking occupancy
CREATE OR REPLACE VIEW v_ocupacion_estacionamiento AS
SELECT
  se.nombre                                   AS sede,
  z.nombre                                    AS zona,
  z.capacidad,
  pu.tipo_vehiculo,
  COUNT(pu.numero_puesto)                     AS total_puestos,
  COUNT(pu.numero_puesto)
    FILTER (WHERE pu.estado = 'Libre')        AS libres,
  COUNT(pu.numero_puesto)
    FILTER (WHERE pu.estado = 'Ocupado')      AS ocupados,
  COUNT(pu.numero_puesto)
    FILTER (WHERE pu.estado = 'Reservado')    AS reservados,
  COUNT(pu.numero_puesto)
    FILTER (WHERE pu.estado = 'Mantenimiento') AS en_mantenimiento,
  ROUND(
    COUNT(pu.numero_puesto)
      FILTER (WHERE pu.estado = 'Ocupado') * 100.0
    / NULLIF(COUNT(pu.numero_puesto), 0), 2
  )                                           AS tasa_ocupacion_pct
FROM   Zona_Estacionamiento z
JOIN   Sede                 se ON se.id_sede = z.id_sede
LEFT   JOIN Puesto          pu ON pu.id_zona = z.id_zona
GROUP  BY se.nombre, z.nombre, z.capacidad, pu.tipo_vehiculo;

-- View 8: Parking revenue
CREATE OR REPLACE VIEW v_recaudacion_estacionamiento AS
SELECT
  f.id_factura,
  f.emisión                                   AS fecha_factura,
  f.monto                                     AS monto_total,
  COALESCE(SUM(pg.monto), 0)                  AS total_pagado,
  CASE
    WHEN COALESCE(SUM(pg.monto), 0) = 0            THEN 'Pendiente'
    WHEN f.monto - COALESCE(SUM(pg.monto), 0) <= 0 THEN 'Pagada'
    ELSE 'Parcial'
  END                                         AS estado,
  mc.cedula,
  pe.primer_nombre || ' ' || pe.primer_apellido AS usuario,
  CASE
    WHEN est.cedula IS NOT NULL THEN 'Estudiante'
    WHEN pr.cedula  IS NOT NULL THEN 'Profesor'
    WHEN pa.cedula  IS NOT NULL THEN 'Administrativo'
    WHEN eg.cedula  IS NOT NULL THEN 'Egresado'
    ELSE 'Externo'
  END                                         AS rol_usuario,
  ra.id_zona,
  z.nombre                                    AS zona,
  ra.placa,
  ra.fecha_entrada,
  ra.fecha_salida,
  CASE
    WHEN tai.id_pago IS NOT NULL THEN 'TAI NFC'
    WHEN pm.id_pago  IS NOT NULL THEN 'Pago Móvil'
    WHEN ef.id_pago  IS NOT NULL THEN 'Efectivo'
    ELSE 'Pendiente'
  END                                         AS metodo_pago,
  t.usd                                       AS tasa_bcv
FROM   Registro_Acceso      ra
JOIN   Zona_Estacionamiento z   ON z.id_zona         = ra.id_zona
JOIN   Item_Consumo         ic  ON ic.id_folio        = ra.id_folio
                               AND ic.numero          = ra.numero
JOIN   Folio_Consumo        fc  ON fc.id_folio        = ic.id_folio
JOIN   Solicitud_Servicio   ss  ON ss.id_solicitud    = fc.id_solicitud
JOIN   Miembro_Comunidad    mc  ON mc.cedula          = ss.cedula
JOIN   Persona              pe  ON pe.cedula          = mc.cedula
LEFT   JOIN Factura         f   ON f.id_folio         = ic.id_folio
LEFT   JOIN Pago            pg  ON pg.id_factura      = f.id_factura
LEFT   JOIN Tasa            t   ON t.fecha_tasa       = pg.fecha_pago
LEFT   JOIN TAI             tai ON tai.id_pago        = pg.id_pago
LEFT   JOIN Pago_Movil      pm  ON pm.id_pago         = pg.id_pago
LEFT   JOIN Efectivo        ef  ON ef.id_pago         = pg.id_pago
LEFT   JOIN Periodo_Vinculacion pv ON pv.cedula       = mc.cedula
                                  AND pv.fecha_fin    IS NULL
LEFT   JOIN Estudiante      est ON est.cedula         = pv.cedula
                               AND est.fecha_inicio   = pv.fecha_inicio
LEFT   JOIN Profesor        pr  ON pr.cedula          = pv.cedula
                               AND pr.fecha_inicio    = pv.fecha_inicio
LEFT   JOIN Personal_Administrativo pa ON pa.cedula  = pv.cedula
                               AND pa.fecha_inicio    = pv.fecha_inicio
LEFT   JOIN Egresado        eg  ON eg.cedula          = mc.cedula
GROUP  BY f.id_factura, f.emisión, f.monto, mc.cedula,
          pe.primer_nombre, pe.primer_apellido,
          est.cedula, pr.cedula, pa.cedula, eg.cedula,
          ra.id_zona, z.nombre, ra.placa,
          ra.fecha_entrada, ra.fecha_salida,
          tai.id_pago, pm.id_pago, ef.id_pago, t.usd;


-- TRIGGER: Auto-complete Solicitud when all pasos are done


CREATE OR REPLACE FUNCTION fn_completar_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  v_total     INT;
  v_completados INT;
  v_id_sol    VARCHAR(50);
BEGIN
  v_id_sol := NEW.id_solicitud;

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE estado_paso = 'Completado')
  INTO   v_total, v_completados
  FROM   Paso_Actividad
  WHERE  id_solicitud = v_id_sol;

  -- All steps completed → mark solicitud as Completada
  IF v_total > 0 AND v_total = v_completados THEN
    UPDATE Solicitud_Servicio
    SET    estado     = 'Completada',
           resolucion = 'Todos los pasos han sido completados satisfactoriamente'
    WHERE  id_solicitud = v_id_sol
      AND  estado <> 'Completada';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_completar_solicitud
AFTER UPDATE ON Paso_Actividad
FOR EACH ROW
WHEN (NEW.estado_paso = 'Completado')
EXECUTE FUNCTION fn_completar_solicitud();

-- ============================================================
-- TRIGGER: Block step N from starting if step N-1 not done
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validar_orden_pasos()
RETURNS TRIGGER AS $$
DECLARE
  v_num_paso    INT;
  v_paso_previo VARCHAR(50);
  v_estado_previo VARCHAR(30);
BEGIN
  -- Only check when trying to set a paso to 'En proceso' or 'Completado'
  IF NEW.estado_paso NOT IN ('En proceso', 'Completado') THEN
    RETURN NEW;
  END IF;

  -- Get ordinal position of this paso within the solicitud
  SELECT COUNT(*) INTO v_num_paso
  FROM   Paso_Actividad
  WHERE  id_solicitud = NEW.id_solicitud
    AND  fecha_inicio < NEW.fecha_inicio;

  -- If it's the first paso (v_num_paso = 0), always allow
  IF v_num_paso = 0 THEN RETURN NEW; END IF;

  -- Get the previous paso status
  SELECT estado_paso INTO v_estado_previo
  FROM   Paso_Actividad
  WHERE  id_solicitud = NEW.id_solicitud
    AND  fecha_inicio < NEW.fecha_inicio
  ORDER  BY fecha_inicio DESC
  LIMIT  1;

  IF v_estado_previo <> 'Completado' THEN
    RAISE EXCEPTION
      'El paso anterior debe estar completado antes de avanzar';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_validar_orden_pasos
BEFORE UPDATE ON Paso_Actividad
FOR EACH ROW EXECUTE FUNCTION fn_validar_orden_pasos();