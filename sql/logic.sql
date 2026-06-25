-- INDICES

-- Vinculaciones activas
CREATE INDEX IF NOT EXISTS idx_pv_cedula_fin
  ON Periodo_Vinculacion(Cedula, Fecha_Fin);

-- Pagos por factura
CREATE INDEX IF NOT EXISTS idx_pago_factura
  ON Pago(ID_Factura);

-- Solicitudes por miembro
CREATE INDEX IF NOT EXISTS idx_solicitud_cedula
  ON Solicitud_Servicio(Cedula);

-- Pasos por solicitud
CREATE INDEX IF NOT EXISTS idx_paso_solicitud
  ON Paso_Actividad(ID_Solicitud);

-- Sesiones por miembro
CREATE INDEX IF NOT EXISTS idx_sesion_cedula
  ON Sesion(Cedula);

-- Reservas por espacio y fecha
CREATE INDEX IF NOT EXISTS idx_reserva_espacio_fecha
  ON Reserva(ID_Sede, Nombre_Edificacion, Numero_Espacio, Fecha_Uso);

-- Ítems por folio
CREATE INDEX IF NOT EXISTS idx_item_folio
  ON Item_Consumo(ID_Folio);

-- Facturas por folio
CREATE INDEX IF NOT EXISTS idx_factura_folio
  ON Factura(ID_Folio);

-- Facturas por estado
CREATE INDEX IF NOT EXISTS idx_factura_estado
  ON Factura(Estado);

-- Postulaciones por vacante
CREATE INDEX IF NOT EXISTS idx_postula_vacante
  ON Postula(ID_Vacante);

-- VISTAS

-- Miembros con su vinculación activa y rol actual
CREATE OR REPLACE VIEW v_vinculaciones_activas AS
SELECT
  mc.Cedula,
  p.Primer_Nombre || ' ' || p.Primer_Apellido AS Nombre,
  pv.Fecha_Inicio,
  CASE
    WHEN EXISTS (SELECT 1 FROM Egresado            eg WHERE eg.Cedula = pv.Cedula AND eg.Fecha_Inicio = pv.Fecha_Inicio) THEN 'Egresado'
    WHEN EXISTS (SELECT 1 FROM Profesor            pr WHERE pr.Cedula = pv.Cedula AND pr.Fecha_Inicio = pv.Fecha_Inicio) THEN 'Profesor'
    WHEN EXISTS (SELECT 1 FROM Personal_Administrativo pa WHERE pa.Cedula = pv.Cedula AND pa.Fecha_Inicio = pv.Fecha_Inicio) THEN 'Personal_Administrativo'
    WHEN EXISTS (SELECT 1 FROM Estudiante          es WHERE es.Cedula = pv.Cedula AND es.Fecha_Inicio = pv.Fecha_Inicio) THEN 'Estudiante'
    ELSE 'Sin Rol'
  END AS Rol,
  mc.Estado_de_Cuenta,
  mc.ID_Sede
FROM Periodo_Vinculacion pv
JOIN Miembro_Comunidad mc ON mc.Cedula = pv.Cedula
JOIN Persona           p  ON p.Cedula  = pv.Cedula
WHERE pv.Fecha_Fin IS NULL;

-- Solicitudes en curso con conteo de pasos
CREATE OR REPLACE VIEW v_solicitudes_activas AS
SELECT
  ss.ID_Solicitud,
  ss.Cedula,
  ss.ID_Servicio,
  sv.Nombre_Entidad,
  ss.Estado,
  ss.Fecha_Apertura,
  COUNT(pa.ID_Paso)                                               AS Total_Pasos,
  COUNT(CASE WHEN pa.Estado_Paso = 'Completado' THEN 1 END)      AS Pasos_Completados,
  COUNT(CASE WHEN pa.Estado_Paso = 'Pendiente'  THEN 1 END)      AS Pasos_Pendientes
FROM Solicitud_Servicio ss
JOIN Servicio sv ON sv.ID_Servicio = ss.ID_Servicio
LEFT JOIN Paso_Actividad pa ON pa.ID_Solicitud = ss.ID_Solicitud
WHERE ss.Estado NOT IN ('Completada', 'Cancelada')
GROUP BY ss.ID_Solicitud, ss.Cedula, ss.ID_Servicio, sv.Nombre_Entidad, ss.Estado, ss.Fecha_Apertura;

-- Facturas con saldo pendiente
CREATE OR REPLACE VIEW v_facturas_pendientes AS
SELECT
  f.ID_Factura,
  f.Emisión,
  f.Monto,
  f.Saldo,
  f.Estado,
  ss.Cedula,
  sv.Nombre_Entidad,
  cs.Categoria
FROM Factura f
JOIN Folio_Consumo      fc ON fc.ID_Folio    = f.ID_Folio
JOIN Solicitud_Servicio ss ON ss.ID_Solicitud = fc.ID_Solicitud
JOIN Servicio           sv ON sv.ID_Servicio  = ss.ID_Servicio
JOIN Categoria_Servicio cs ON cs.ID_Categoria = sv.ID_Categoria
WHERE f.Estado IN ('Pendiente', 'Parcial');

-- Espacios físicos disponibles
CREATE OR REPLACE VIEW v_espacios_disponibles AS
SELECT
  ef.ID_Sede,
  s.Nombre AS Sede,
  ef.Nombre_Edificacion,
  ef.Numero_Espacio,
  ef.Tipo_Espacio,
  ef.Capacidad_Max,
  ef.Tipo_Mobiliario,
  ef.Estado AS Estado_Mantenimiento
FROM Espacio_Fisico ef
JOIN Sede s ON s.ID_Sede = ef.ID_Sede
WHERE ef.Disponibilidad = 'Disponible'
  AND ef.Estado NOT ILIKE '%mantenimiento%';

-- Reporte de cuellos de botella en pasos de actividad
CREATE OR REPLACE VIEW v_reporte_cuellos_botella AS
SELECT
  pa.Responsable,
  sv.ID_Servicio,
  sv.Nombre_Entidad,
  COUNT(*)                                                                     AS Total_Pasos,
  COUNT(CASE WHEN pa.Estado_Paso = 'Completado' THEN 1 END)                   AS Completados,
  COUNT(CASE WHEN pa.Estado_Paso = 'Pendiente'  THEN 1 END)                   AS Pendientes,
  ROUND(AVG(
    CASE WHEN pa.Fecha_Completada IS NOT NULL
    THEN EXTRACT(EPOCH FROM (pa.Fecha_Completada - pa.Fecha_Inicio)) / 3600.0
    END
  )::NUMERIC, 2)                                                               AS Promedio_Horas,
  ROUND(MAX(
    CASE WHEN pa.Fecha_Completada IS NOT NULL
    THEN EXTRACT(EPOCH FROM (pa.Fecha_Completada - pa.Fecha_Inicio)) / 3600.0
    END
  )::NUMERIC, 2)                                                               AS Max_Horas
FROM Paso_Actividad pa
JOIN Solicitud_Servicio ss ON ss.ID_Solicitud = pa.ID_Solicitud
JOIN Servicio           sv ON sv.ID_Servicio  = ss.ID_Servicio
GROUP BY pa.Responsable, sv.ID_Servicio, sv.Nombre_Entidad
ORDER BY Promedio_Horas DESC NULLS LAST;

-- Tasa de ocupación de espacios por sede
CREATE OR REPLACE VIEW v_reporte_ocupacion_espacios AS
SELECT
  ef.ID_Sede,
  se.Nombre AS Sede,
  ef.Nombre_Edificacion,
  ef.Numero_Espacio,
  ef.Tipo_Espacio,
  ef.Capacidad_Max,
  ef.Disponibilidad,
  COUNT(r.Bloque_Horario) AS Total_Reservas
FROM Espacio_Fisico ef
JOIN Sede se ON se.ID_Sede = ef.ID_Sede
LEFT JOIN Reserva r
  ON  r.ID_Sede            = ef.ID_Sede
  AND r.Nombre_Edificacion  = ef.Nombre_Edificacion
  AND r.Numero_Espacio      = ef.Numero_Espacio
GROUP BY ef.ID_Sede, se.Nombre, ef.Nombre_Edificacion,
         ef.Numero_Espacio, ef.Tipo_Espacio, ef.Capacidad_Max, ef.Disponibilidad
ORDER BY Total_Reservas DESC;

-- Beneficiarios próximos a cumplir mayoría de edad
CREATE OR REPLACE VIEW v_beneficiarios_mayoria_prox AS
SELECT
  b.Cedula,
  p.Primer_Nombre || ' ' || p.Primer_Apellido AS Nombre,
  p.Fecha_Nacimiento,
  DATE_PART('year', AGE(CURRENT_DATE, p.Fecha_Nacimiento)) AS Edad_Actual,
  b.Cedula_Miembro,
  b.Parentesco,
  CASE WHEN DATE_PART('year', AGE(CURRENT_DATE, p.Fecha_Nacimiento)) >= 18
       THEN 'Requiere Transición'
       ELSE 'Próximo (< 1 año)'
  END AS Alerta
FROM Carga_Menor cm
JOIN Beneficiario b ON b.Cedula = cm.Cedula
JOIN Persona      p ON p.Cedula = cm.Cedula
WHERE DATE_PART('year', AGE(CURRENT_DATE, p.Fecha_Nacimiento)) >= 17;

-- FUNCIONES

-- Cuenta dias habiles entre dos timestamps (excluye sab y dom)
CREATE OR REPLACE FUNCTION fn_dias_habiles(
  p_inicio TIMESTAMP,
  p_fin    TIMESTAMP
) RETURNS NUMERIC AS $$
DECLARE
  v_dias   NUMERIC := 0;
  v_actual DATE    := p_inicio::DATE;
BEGIN
  IF p_fin IS NULL OR p_fin <= p_inicio THEN
    RETURN 0;
  END IF;
  WHILE v_actual <= p_fin::DATE LOOP
    IF EXTRACT(DOW FROM v_actual) NOT IN (0, 6) THEN  -- 0=domingo, 6=sabado
      v_dias := v_dias + 1;
    END IF;
    v_actual := v_actual + INTERVAL '1 day';
  END LOOP;
  RETURN v_dias;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Tiempo de resolucion de una solicitud en horas habiles
-- Resta apertura-cierre descontando fines de semana
CREATE OR REPLACE FUNCTION fn_tiempo_resolucion(p_id_solicitud VARCHAR)
RETURNS TABLE(
  id_solicitud      VARCHAR,
  fecha_apertura    DATE,
  fecha_cierre      TIMESTAMP,
  dias_habiles      NUMERIC,
  horas_totales     NUMERIC,
  estado_solicitud  VARCHAR
) AS $$
DECLARE
  v_apertura DATE;
  v_cierre   TIMESTAMP;
  v_estado   VARCHAR;
BEGIN
  SELECT ss.Fecha_Apertura, ss.Estado
  INTO   v_apertura, v_estado
  FROM   Solicitud_Servicio ss
  WHERE  ss.ID_Solicitud = p_id_solicitud;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud % no encontrada', p_id_solicitud;
  END IF;

  SELECT MAX(pa.Fecha_Completada)
  INTO   v_cierre
  FROM   Paso_Actividad pa
  WHERE  pa.ID_Solicitud = p_id_solicitud
    AND  pa.Fecha_Completada IS NOT NULL;

  RETURN QUERY SELECT
    p_id_solicitud,
    v_apertura,
    v_cierre,
    fn_dias_habiles(v_apertura::TIMESTAMP, v_cierre),
    ROUND(
      EXTRACT(EPOCH FROM (v_cierre - v_apertura::TIMESTAMP)) / 3600.0
    , 2),
    v_estado;
END;
$$ LANGUAGE plpgsql;


-- Indice de recurrencia de un miembro
-- Score = (servicios_completados × 3) + (pagos_puntuales × 2) + (reservas × 1)
-- Clasificación: Nuevo < 3 ≤ Regular < 10 ≤ Frecuente < 20 ≤ Preferencial
CREATE OR REPLACE FUNCTION fn_indice_recurrencia(p_cedula VARCHAR)
RETURNS TABLE(
  cedula                VARCHAR,
  servicios_completados INT,
  pagos_puntuales       INT,
  total_reservas        INT,
  score                 NUMERIC,
  clasificacion         VARCHAR
) AS $$
DECLARE
  v_svc    INT;
  v_pagos  INT;
  v_res    INT;
  v_score  NUMERIC;
  v_clasif VARCHAR;
BEGIN
  SELECT COUNT(*) INTO v_svc
  FROM Solicitud_Servicio
  WHERE Cedula = p_cedula AND Estado = 'Completada';

  SELECT COUNT(*) INTO v_pagos
  FROM Pago pg
  JOIN Factura f ON f.ID_Factura = pg.ID_Factura
  JOIN Folio_Consumo fc ON fc.ID_Folio = f.ID_Folio
  JOIN Solicitud_Servicio ss ON ss.ID_Solicitud = fc.ID_Solicitud
  WHERE ss.Cedula = p_cedula
    AND pg.Fecha_Pago <= f.Emisión + INTERVAL '7 days';

  SELECT COUNT(*) INTO v_res
  FROM Reserva r
  JOIN Paso_Actividad   pa ON pa.ID_Paso      = r.ID_Paso
  JOIN Solicitud_Servicio ss ON ss.ID_Solicitud = pa.ID_Solicitud
  WHERE ss.Cedula = p_cedula;

  v_score  := (v_svc * 3) + (v_pagos * 2) + (v_res * 1);

  v_clasif := CASE
    WHEN v_score >= 20 THEN 'Preferencial'
    WHEN v_score >= 10 THEN 'Frecuente'
    WHEN v_score >= 3  THEN 'Regular'
    ELSE 'Nuevo'
  END;

  RETURN QUERY SELECT p_cedula, v_svc, v_pagos, v_res, v_score, v_clasif;
END;
$$ LANGUAGE plpgsql;


-- Costo final de un servicio aplicando perfil y recurrencia del miembro
-- Público externo paga +20 %; Frecuente -5 %; Preferencial -10 %
CREATE OR REPLACE FUNCTION fn_costo_final_servicio(
  p_id_servicio VARCHAR,
  p_cedula      VARCHAR
) RETURNS TABLE(
  id_servicio   VARCHAR,
  precio_base   REAL,
  perfil        VARCHAR,
  clasificacion VARCHAR,
  descuento_pct NUMERIC,
  precio_final  REAL
) AS $$
DECLARE
  v_precio   REAL;
  v_perfil   VARCHAR;
  v_clasif   VARCHAR;
  v_desc     NUMERIC;
  v_final    REAL;
BEGIN
  -- Precio base: promedio del item #1 en folios cerrados de este servicio
  SELECT COALESCE(AVG(ic.Precio), 0) INTO v_precio
  FROM Item_Consumo ic
  JOIN Folio_Consumo      fc ON fc.ID_Folio    = ic.ID_Folio
  JOIN Solicitud_Servicio ss ON ss.ID_Solicitud = fc.ID_Solicitud
  WHERE ss.ID_Servicio = p_id_servicio
    AND ic.Numero = 1
    AND fc.Estado = 'Cerrado';

  -- Perfil del miembro
  v_perfil := CASE
    WHEN EXISTS (
      SELECT 1 FROM Periodo_Vinculacion WHERE Cedula = p_cedula AND Fecha_Fin IS NULL
    ) THEN 'Miembro Activo'
    WHEN EXISTS (
      SELECT 1 FROM Periodo_Vinculacion pv
      JOIN Egresado e ON e.Cedula = pv.Cedula AND e.Fecha_Inicio = pv.Fecha_Inicio
      WHERE pv.Cedula = p_cedula
    ) THEN 'Egresado'
    ELSE 'Público Externo'
  END;

  IF v_perfil = 'Público Externo' THEN
    v_precio := v_precio * 1.20;
  END IF;

  SELECT clasificacion INTO v_clasif FROM fn_indice_recurrencia(p_cedula);

  v_desc := CASE v_clasif
    WHEN 'Preferencial' THEN 10.0
    WHEN 'Frecuente'    THEN 5.0
    ELSE 0.0
  END;

  v_final := v_precio * (1.0 - v_desc / 100.0);

  RETURN QUERY SELECT p_id_servicio, v_precio, v_perfil, v_clasif, v_desc, v_final::REAL;
END;
$$ LANGUAGE plpgsql;


-- TRIGGERS

-- Inicializar Saldo y Estado de nueva Factura
CREATE OR REPLACE FUNCTION trg_fn_init_factura()
RETURNS TRIGGER AS $$
BEGIN
  NEW.Saldo  := NEW.Monto;
  NEW.Estado := 'Pendiente';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_init_factura ON Factura;
CREATE TRIGGER trg_init_factura
  BEFORE INSERT ON Factura
  FOR EACH ROW EXECUTE FUNCTION trg_fn_init_factura();


-- Recalcular Saldo y Estado al registrar un Pago 
CREATE OR REPLACE FUNCTION trg_fn_actualizar_saldo_factura()
RETURNS TRIGGER AS $$
DECLARE
  v_pagado REAL;
  v_monto  REAL;
BEGIN
  SELECT Monto INTO v_monto FROM Factura WHERE ID_Factura = NEW.ID_Factura;

  SELECT COALESCE(SUM(Monto), 0) INTO v_pagado
  FROM Pago WHERE ID_Factura = NEW.ID_Factura;

  UPDATE Factura
  SET
    Saldo  = GREATEST(v_monto - v_pagado, 0),
    Estado = CASE
               WHEN v_pagado >= v_monto THEN 'Pagada'
               WHEN v_pagado  > 0       THEN 'Parcial'
               ELSE 'Pendiente'
             END
  WHERE ID_Factura = NEW.ID_Factura;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_saldo_factura ON Pago;
CREATE TRIGGER trg_actualizar_saldo_factura
  AFTER INSERT ON Pago
  FOR EACH ROW EXECUTE FUNCTION trg_fn_actualizar_saldo_factura();


-- Suspender cuenta cuando se cierra la última vinculación activa 
CREATE OR REPLACE FUNCTION trg_fn_suspender_sin_vinculacion()
RETURNS TRIGGER AS $$
DECLARE
  v_activas INT;
BEGIN
  IF NEW.Fecha_Fin IS NOT NULL AND OLD.Fecha_Fin IS NULL THEN
    SELECT COUNT(*) INTO v_activas
    FROM Periodo_Vinculacion
    WHERE Cedula = NEW.Cedula AND Fecha_Fin IS NULL;

    IF v_activas = 0 THEN
      UPDATE Miembro_Comunidad
      SET Estado_de_Cuenta = 'Suspendida'
      WHERE Cedula = NEW.Cedula AND Estado_de_Cuenta = 'Activa';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suspender_sin_vinculacion ON Periodo_Vinculacion;
CREATE TRIGGER trg_suspender_sin_vinculacion
  AFTER UPDATE ON Periodo_Vinculacion
  FOR EACH ROW EXECUTE FUNCTION trg_fn_suspender_sin_vinculacion();


-- Reactivar cuenta al abrir una nueva vinculación 
CREATE OR REPLACE FUNCTION trg_fn_reactivar_cuenta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE Miembro_Comunidad
  SET Estado_de_Cuenta = 'Activa'
  WHERE Cedula = NEW.Cedula AND Estado_de_Cuenta = 'Suspendida';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reactivar_cuenta ON Periodo_Vinculacion;
CREATE TRIGGER trg_reactivar_cuenta
  AFTER INSERT ON Periodo_Vinculacion
  FOR EACH ROW EXECUTE FUNCTION trg_fn_reactivar_cuenta();


-- Marcar Espacio_Fisico como No Disponible al crear una Reserva
CREATE OR REPLACE FUNCTION trg_fn_bloquear_espacio()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE Espacio_Fisico
  SET Disponibilidad = 'No Disponible'
  WHERE ID_Sede            = NEW.ID_Sede
    AND Nombre_Edificacion  = NEW.Nombre_Edificacion
    AND Numero_Espacio      = NEW.Numero_Espacio;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_espacio ON Reserva;
CREATE TRIGGER trg_bloquear_espacio
  AFTER INSERT ON Reserva
  FOR EACH ROW EXECUTE FUNCTION trg_fn_bloquear_espacio();


-- Liberar Espacio_Fisico si ya no quedan reservas futuras
CREATE OR REPLACE FUNCTION trg_fn_liberar_espacio()
RETURNS TRIGGER AS $$
DECLARE
  v_futuras INT;
BEGIN
  SELECT COUNT(*) INTO v_futuras
  FROM Reserva
  WHERE ID_Sede            = OLD.ID_Sede
    AND Nombre_Edificacion  = OLD.Nombre_Edificacion
    AND Numero_Espacio      = OLD.Numero_Espacio
    AND Fecha_Uso          >= CURRENT_DATE;

  IF v_futuras = 0 THEN
    UPDATE Espacio_Fisico
    SET Disponibilidad = 'Disponible'
    WHERE ID_Sede            = OLD.ID_Sede
      AND Nombre_Edificacion  = OLD.Nombre_Edificacion
      AND Numero_Espacio      = OLD.Numero_Espacio;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_liberar_espacio ON Reserva;
CREATE TRIGGER trg_liberar_espacio
  AFTER DELETE ON Reserva
  FOR EACH ROW EXECUTE FUNCTION trg_fn_liberar_espacio();


-- Auto-grabar Fecha_Completada al marcar un paso como Completado
-- También impide alterar manualmente el timestamp una vez grabado.
CREATE OR REPLACE FUNCTION trg_fn_timestamp_paso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.Estado_Paso = 'Completado' AND OLD.Estado_Paso <> 'Completado' THEN
    NEW.Fecha_Completada := NOW();
  END IF;

  IF OLD.Estado_Paso = 'Completado'
     AND NEW.Fecha_Completada IS DISTINCT FROM OLD.Fecha_Completada THEN
    NEW.Fecha_Completada := OLD.Fecha_Completada;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_timestamp_paso ON Paso_Actividad;
CREATE TRIGGER trg_timestamp_paso
  BEFORE UPDATE ON Paso_Actividad
  FOR EACH ROW EXECUTE FUNCTION trg_fn_timestamp_paso();


-- Auto-completar Solicitud cuando todos sus pasos están completados
CREATE OR REPLACE FUNCTION trg_fn_completar_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  v_total INT;
  v_ok    INT;
BEGIN
  IF NEW.Estado_Paso = 'Completado' THEN
    SELECT
      COUNT(*),
      COUNT(CASE WHEN Estado_Paso = 'Completado' THEN 1 END)
    INTO v_total, v_ok
    FROM Paso_Actividad
    WHERE ID_Solicitud = NEW.ID_Solicitud;

    IF v_total > 0 AND v_total = v_ok THEN
      UPDATE Solicitud_Servicio
      SET Estado = 'Completada'
      WHERE ID_Solicitud = NEW.ID_Solicitud
        AND Estado <> 'Completada';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_completar_solicitud ON Paso_Actividad;
CREATE TRIGGER trg_completar_solicitud
  AFTER UPDATE ON Paso_Actividad
  FOR EACH ROW EXECUTE FUNCTION trg_fn_completar_solicitud();


-- Cerrar Folio automáticamente al emitir una Factura
CREATE OR REPLACE FUNCTION trg_fn_cerrar_folio()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE Folio_Consumo
  SET Estado = 'Cerrado'
  WHERE ID_Folio = NEW.ID_Folio AND Estado = 'Abierto';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cerrar_folio ON Factura;
CREATE TRIGGER trg_cerrar_folio
  AFTER INSERT ON Factura
  FOR EACH ROW EXECUTE FUNCTION trg_fn_cerrar_folio();


-- Bloquear inserción de ítems en Folios ya cerrados
CREATE OR REPLACE FUNCTION trg_fn_bloquear_folio_cerrado()
RETURNS TRIGGER AS $$
DECLARE
  v_estado VARCHAR;
BEGIN
  SELECT Estado INTO v_estado FROM Folio_Consumo WHERE ID_Folio = NEW.ID_Folio;
  IF v_estado = 'Cerrado' THEN
    RAISE EXCEPTION 'No se pueden agregar ítems al Folio % porque está Cerrado', NEW.ID_Folio;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_folio_cerrado ON Item_Consumo;
CREATE TRIGGER trg_bloquear_folio_cerrado
  BEFORE INSERT ON Item_Consumo
  FOR EACH ROW EXECUTE FUNCTION trg_fn_bloquear_folio_cerrado();


-- Validar precio del ítem base (Numero=1) contra límites de Regula
-- Los suplementos (Numero>1) no se restringen para permitir cargos menores.
CREATE OR REPLACE FUNCTION trg_fn_validar_precio_regula()
RETURNS TRIGGER AS $$
DECLARE
  v_sede_id   INT;
  v_cat_id    VARCHAR;
  v_costo_min REAL;
  v_costo_max REAL;
BEGIN
  IF NEW.Numero <> 1 THEN
    RETURN NEW;
  END IF;

  SELECT mc.ID_Sede, cs.ID_Categoria
  INTO   v_sede_id, v_cat_id
  FROM   Folio_Consumo      fc
  JOIN   Solicitud_Servicio ss ON ss.ID_Solicitud = fc.ID_Solicitud
  JOIN   Miembro_Comunidad  mc ON mc.Cedula       = ss.Cedula
  JOIN   Servicio           sv ON sv.ID_Servicio  = ss.ID_Servicio
  JOIN   Categoria_Servicio cs ON cs.ID_Categoria = sv.ID_Categoria
  WHERE  fc.ID_Folio = NEW.ID_Folio;

  IF v_sede_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- El estacionamiento es un servicio MEDIDO POR TIEMPO (tarifa variable),
  -- no una tarifa fija de catálogo: se exime del rango [min,max] de Regula.
  -- En /entrada el item base entra con precio 0 y en /salida se recalcula
  -- segun las horas, pudiendo superar el maximo. Por eso queda exento.
  IF v_cat_id = 'CAT-ESTAC' THEN
    RETURN NEW;
  END IF;

  SELECT Costo_Min, Costo_Max
  INTO   v_costo_min, v_costo_max
  FROM   Regula
  WHERE  ID_Sede = v_sede_id AND ID_Categoria = v_cat_id;

  IF v_costo_min IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.Precio < v_costo_min OR NEW.Precio > v_costo_max THEN
    RAISE EXCEPTION
      'Precio base % fuera del rango permitido [%, %] para la categoria % en sede %',
      ROUND(NEW.Precio::numeric,2), ROUND(v_costo_min::numeric,2),
      ROUND(v_costo_max::numeric,2), v_cat_id, v_sede_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_precio_regula ON Item_Consumo;
CREATE TRIGGER trg_validar_precio_regula
  BEFORE INSERT OR UPDATE ON Item_Consumo
  FOR EACH ROW EXECUTE FUNCTION trg_fn_validar_precio_regula();


-- Actualizar estado del Puesto al registrar entrada/salida en estacionamiento
CREATE OR REPLACE FUNCTION trg_fn_actualizar_puesto_estatus()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.Estatus = 'Activo' THEN
    UPDATE Puesto SET Estado = 'Ocupado'
    WHERE ID_Zona = NEW.ID_Zona AND Numero_Puesto = NEW.Numero_Puesto;

  ELSIF TG_OP = 'UPDATE'
    AND NEW.Estatus = 'Finalizado'
    AND OLD.Estatus = 'Activo' THEN
    UPDATE Puesto SET Estado = 'Libre'
    WHERE ID_Zona = OLD.ID_Zona AND Numero_Puesto = OLD.Numero_Puesto;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_puesto_estatus ON Registro_Acceso;
CREATE TRIGGER trg_actualizar_puesto_estatus
  AFTER INSERT OR UPDATE ON Registro_Acceso
  FOR EACH ROW EXECUTE FUNCTION trg_fn_actualizar_puesto_estatus();


-- Auto-actualizar Fecha_Cambio_Clave cuando cambia la contraseña
CREATE OR REPLACE FUNCTION trg_fn_fecha_cambio_clave()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.Contrasena IS DISTINCT FROM OLD.Contrasena THEN
    NEW.Fecha_Cambio_Clave := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fecha_cambio_clave ON Miembro_Comunidad;
CREATE TRIGGER trg_fecha_cambio_clave
  BEFORE UPDATE OF Contrasena ON Miembro_Comunidad
  FOR EACH ROW EXECUTE FUNCTION trg_fn_fecha_cambio_clave();


-- Bloquear cuenta con 5 o más intentos fallidos de sesión
CREATE OR REPLACE FUNCTION trg_fn_bloquear_por_intentos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.Intentos_Fallidos >= 5 THEN
    UPDATE Miembro_Comunidad
    SET Estado_de_Cuenta = 'Bloqueada'
    WHERE Cedula = NEW.Cedula
      AND Estado_de_Cuenta NOT IN ('Bloqueada');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_por_intentos ON Sesion;
CREATE TRIGGER trg_bloquear_por_intentos
  AFTER INSERT OR UPDATE ON Sesion
  FOR EACH ROW EXECUTE FUNCTION trg_fn_bloquear_por_intentos();


-- Impedir solapamiento de reservas para el mismo espacio/fecha/bloque
CREATE OR REPLACE FUNCTION trg_fn_validar_solapamiento_reserva()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict INT;
BEGIN
  SELECT COUNT(*) INTO v_conflict
  FROM Reserva
  WHERE ID_Sede            = NEW.ID_Sede
    AND Nombre_Edificacion  = NEW.Nombre_Edificacion
    AND Numero_Espacio      = NEW.Numero_Espacio
    AND Fecha_Uso           = NEW.Fecha_Uso
    AND Bloque_Horario      = NEW.Bloque_Horario;

  IF v_conflict > 0 THEN
    RAISE EXCEPTION
      'El espacio % en % ya está reservado para el % en el bloque %',
      NEW.Numero_Espacio, NEW.Nombre_Edificacion, NEW.Fecha_Uso, NEW.Bloque_Horario;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_solapamiento_reserva ON Reserva;
CREATE TRIGGER trg_validar_solapamiento_reserva
  BEFORE INSERT ON Reserva
  FOR EACH ROW EXECUTE FUNCTION trg_fn_validar_solapamiento_reserva();


-- PROCEDIMIENTOS

-- Cierre masivo mensual de folios abiertos → facturas
CREATE OR REPLACE PROCEDURE proc_cierre_masivo_folios()
LANGUAGE plpgsql AS $$
DECLARE
  v_folio   RECORD;
  v_monto   REAL;
  v_id_fact VARCHAR;
  v_count   INT := 0;
BEGIN
  FOR v_folio IN
    SELECT fc.ID_Folio
    FROM   Folio_Consumo fc
    WHERE  fc.Estado = 'Abierto'
      AND  EXISTS (SELECT 1 FROM Item_Consumo ic WHERE ic.ID_Folio = fc.ID_Folio)
      AND  NOT EXISTS (SELECT 1 FROM Factura f WHERE f.ID_Folio = fc.ID_Folio)
  LOOP
    SELECT COALESCE(SUM(ic.Precio * ic.Cantidad * (1.0 + ic.Impuesto)), 0)
    INTO   v_monto
    FROM   Item_Consumo ic
    WHERE  ic.ID_Folio = v_folio.ID_Folio;

    v_id_fact := 'FAC-CIERRE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || v_folio.ID_Folio;

    INSERT INTO Factura (ID_Factura, Emisión, Monto, ID_Folio)
    VALUES (v_id_fact, CURRENT_DATE, v_monto, v_folio.ID_Folio);

    v_count := v_count + 1;
    RAISE NOTICE 'Factura % generada — Folio: %, Monto: %.2f', v_id_fact, v_folio.ID_Folio, v_monto;
  END LOOP;

  RAISE NOTICE 'proc_cierre_masivo_folios: % facturas generadas', v_count;
END;
$$;


-- Insertar o actualizar tasa de cambio del día
CREATE OR REPLACE PROCEDURE proc_actualizar_tasa(
  p_fecha DATE,
  p_usd   REAL,
  p_eur   REAL
) LANGUAGE plpgsql AS $$
BEGIN
  IF p_usd <= 0 OR p_eur <= 0 THEN
    RAISE EXCEPTION 'Las tasas USD y EUR deben ser positivas';
  END IF;

  INSERT INTO Tasa (Fecha_Tasa, USD, EUR)
  VALUES (p_fecha, p_usd, p_eur)
  ON CONFLICT (Fecha_Tasa) DO UPDATE
    SET USD = EXCLUDED.USD,
        EUR = EXCLUDED.EUR;

  RAISE NOTICE 'Tasa del % actualizada — USD: %, EUR: %', p_fecha, p_usd, p_eur;
END;
$$;


-- Archivar acompañantes y beneficiarios con vínculos expirados > 1 año
CREATE OR REPLACE PROCEDURE proc_archivar_expirados()
LANGUAGE plpgsql AS $$
DECLARE
  v_acomp INT;
  v_benef INT;
BEGIN
  DELETE FROM Acompanante
  WHERE ID_Solicitud IN (
    SELECT ID_Solicitud FROM Solicitud_Servicio
    WHERE Estado IN ('Completada', 'Cancelada')
      AND Fecha_Apertura < CURRENT_DATE - INTERVAL '1 year'
  );
  GET DIAGNOSTICS v_acomp = ROW_COUNT;

  DELETE FROM Beneficiario
  WHERE Cedula_Miembro IN (
    SELECT mc.Cedula
    FROM   Miembro_Comunidad mc
    WHERE  NOT EXISTS (
             SELECT 1 FROM Periodo_Vinculacion pv
             WHERE pv.Cedula = mc.Cedula AND pv.Fecha_Fin IS NULL
           )
      AND  EXISTS (
             SELECT 1 FROM Periodo_Vinculacion pv2
             WHERE pv2.Cedula   = mc.Cedula
               AND pv2.Fecha_Fin IS NOT NULL
               AND pv2.Fecha_Fin < CURRENT_DATE - INTERVAL '1 year'
           )
  );
  GET DIAGNOSTICS v_benef = ROW_COUNT;

  RAISE NOTICE 'proc_archivar_expirados: % acompañantes, % beneficiarios archivados',
    v_acomp, v_benef;
END;
$$;


-- Transición de Carga_Menor a Carga_Mayor al cumplir 18 años
CREATE OR REPLACE PROCEDURE proc_transicion_mayoria_edad()
LANGUAGE plpgsql AS $$
DECLARE
  v_menor RECORD;
  v_count INT := 0;
BEGIN
  FOR v_menor IN
    SELECT cm.Cedula
    FROM   Carga_Menor cm
    JOIN   Persona p ON p.Cedula = cm.Cedula
    WHERE  DATE_PART('year', AGE(CURRENT_DATE, p.Fecha_Nacimiento)) >= 18
  LOOP
    DELETE FROM Carga_Menor WHERE Cedula = v_menor.Cedula;

    INSERT INTO Carga_Mayor (Cedula, Constancia_Estudio_Universitario, Soltero)
    VALUES (v_menor.Cedula, 'PENDIENTE DE ENTREGA', 'S')
    ON CONFLICT (Cedula) DO NOTHING;

    v_count := v_count + 1;
    RAISE NOTICE 'Beneficiario % transicionado a Carga_Mayor', v_menor.Cedula;
  END LOOP;

  RAISE NOTICE 'proc_transicion_mayoria_edad: % beneficiarios transicionados', v_count;
END;
$$;


-- Reporte de conciliación financiera en un rango de fechas
CREATE OR REPLACE PROCEDURE proc_conciliacion_financiera(
  p_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_fin    DATE DEFAULT CURRENT_DATE
) LANGUAGE plpgsql AS $$
DECLARE
  v_fact  RECORD;
  v_pago  RECORD;
  v_total_fact REAL := 0;
  v_total_pago REAL := 0;
BEGIN
  RAISE NOTICE '=== CONCILIACIÓN FINANCIERA: % → % ===', p_inicio, p_fin;

  RAISE NOTICE '--- Facturas emitidas ---';
  FOR v_fact IN
    SELECT ID_Factura, Emisión, Monto, Estado, Saldo
    FROM   Factura
    WHERE  Emisión BETWEEN p_inicio AND p_fin
    ORDER  BY Emisión
  LOOP
    v_total_fact := v_total_fact + v_fact.Monto;
    RAISE NOTICE '  % | % | Monto: % | Estado: % | Saldo: %',
      v_fact.ID_Factura, v_fact.Emisión, v_fact.Monto, v_fact.Estado, v_fact.Saldo;
  END LOOP;
  RAISE NOTICE '  TOTAL FACTURADO: %', v_total_fact;

  RAISE NOTICE '--- Pagos registrados ---';
  FOR v_pago IN
    SELECT p.ID_Pago, p.Fecha_Pago, p.Monto, p.ID_Factura
    FROM   Pago p
    WHERE  p.Fecha_Pago BETWEEN p_inicio AND p_fin
    ORDER  BY p.Fecha_Pago
  LOOP
    v_total_pago := v_total_pago + v_pago.Monto;
    RAISE NOTICE '  % | % | Monto: % | Factura: %',
      v_pago.ID_Pago, v_pago.Fecha_Pago, v_pago.Monto, v_pago.ID_Factura;
  END LOOP;
  RAISE NOTICE '  TOTAL COBRADO: %', v_total_pago;
  RAISE NOTICE '  DIFERENCIA:    %', v_total_fact - v_total_pago;
END;
$$;
