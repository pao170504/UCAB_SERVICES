-- =====================================================================
--  inserts.sql — Datos iniciales de UCAB-Services (orden: create -> inserts -> logic -> security)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SEDE
-- ---------------------------------------------------------------------
INSERT INTO Sede VALUES (1, 'Montalbán') ON CONFLICT DO NOTHING;
INSERT INTO Sede VALUES (2, 'Guayana')   ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. PERSONA
-- ---------------------------------------------------------------------
INSERT INTO Persona VALUES ('30411315', 'F', '2004-09-15', 'Paola',  'Valentina', 'De Sousa',  'García')    ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('27890123', 'F', '2001-06-14', 'Ana',    'Gabriela',  'Martínez',  'Torres')    ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('14567890', 'M', '1980-02-18', 'Carlos', 'Antonio',   'Rodríguez', 'Méndez')   ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('17890234', 'M', '1980-05-12', 'Luis',   'Alberto',   'Herrera',   'González') ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('30445698', 'F', '2001-09-17', 'Daniela','Valentina', 'Castaldo',  'Martinez') ON CONFLICT DO NOTHING;
-- Personal administrativo por oficina (para probar aprobación de pasos por departamento)
INSERT INTO Persona VALUES ('20123456', 'F', '1985-03-22', 'Rosa',    'Elena',   'Blanco',  'Pérez')    ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('21234567', 'M', '1982-11-05', 'Miguel',  'Ángel',   'Suárez',  'Ramírez')  ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('22345678', 'F', '1978-07-19', 'Beatriz', 'Elena',   'Salas',   'Fernández')ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('23456789', 'M', '1983-01-30', 'Jorge',   'Luis',    'Peña',    'Ibarra')   ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('24567890', 'M', '1975-09-08', 'Fernando','José',    'Ríos',    'Delgado')  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. MIEMBRO DE LA COMUNIDAD
-- ---------------------------------------------------------------------
INSERT INTO Miembro_Comunidad VALUES ('30411315', 'pvdesousa.23@ucab.edu.ve',  1, '30411315', 'Activa', '2026-01-10', 'Caracas', 'Distrito Capital', 'Av. Páez, El Paraíso')          ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('27890123', 'agmartinez.19@ucab.edu.ve', 1, '27890123', 'Activa', '2024-08-01', 'Caracas', 'Distrito Capital', 'Urb. Los Chorros, Calle 3')     ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('14567890', 'crodriguez@ucab.edu.ve',    1, '14567890', 'Activa', '2025-12-01', 'Caracas', 'Distrito Capital', 'Av. Vollmer, San Bernardino')    ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('17890234', 'lherrera@ucab.edu.ve',      1, '17890234', 'Activa', '2025-10-20', 'Caracas', 'Distrito Capital', 'Av. Principal de Chuao')        ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('30445698', 'dcastaldo.21@ucab.edu.ve',  1, '30445698', 'Activa', '2024-08-01', 'Caracas', 'Distrito Capital', 'Urb. La Boyera, El Hatillo')    ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('20123456', 'reblanco@ucab.edu.ve',      1, '20123456', 'Activa', '2020-02-01', 'Caracas', 'Distrito Capital', 'Av. Baralt, Caja Central')       ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('21234567', 'masuarez@ucab.edu.ve',      1, '21234567', 'Activa', '2019-05-15', 'Caracas', 'Distrito Capital', 'Res. Secretaría, Montalbán')    ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('22345678', 'besalas@ucab.edu.ve',       1, '22345678', 'Activa', '2017-09-01', 'Caracas', 'Distrito Capital', 'Edificio Rectorado, Piso 2')     ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('23456789', 'jlpena@ucab.edu.ve',        1, '23456789', 'Activa', '2020-01-20', 'Caracas', 'Distrito Capital', 'Control de Estudios, Montalbán') ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('24567890', 'fjrios@ucab.edu.ve',        1, '24567890', 'Activa', '2016-03-10', 'Caracas', 'Distrito Capital', 'Dir. Planta Física, Montalbán')  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. TELÉFONO
-- ---------------------------------------------------------------------
INSERT INTO Telefono VALUES ('30411315', '0414-555-1315')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('27890123', '0424-555-0123')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('14567890', '0212-555-7890')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('17890234', '0212-555-0234')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('30445698', '0414-555-45698') ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('20123456', '0212-555-1001')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('21234567', '0212-555-1002')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('22345678', '0212-555-1003')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('23456789', '0212-555-1004')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('24567890', '0212-555-1005')  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. PERIODO DE VINCULACIÓN
-- ---------------------------------------------------------------------
INSERT INTO Periodo_Vinculacion VALUES ('30411315', '2023-01-16', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('27890123', '2019-01-14', '2024-07-30') ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('14567890', '2018-03-01', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('17890234', '2015-06-01', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('30445698', '2024-07-30', '2024-08-10') ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('20123456', '2020-02-01', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('21234567', '2019-05-15', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('22345678', '2017-09-01', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('23456789', '2020-01-20', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('24567890', '2016-03-10', NULL)         ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. ROLES DE VINCULACIÓN (Becario/Preparador dependen de Estudiante)
-- ---------------------------------------------------------------------
INSERT INTO Estudiante              VALUES ('30411315', '2023-01-16', 'Ingeniería en Informática', 162, 18.45, 'Ingeniería', 8) ON CONFLICT DO NOTHING;
INSERT INTO Becario                 VALUES ('30411315', '2023-01-16', 'Excelencia', 'Activa', 18.45)                           ON CONFLICT DO NOTHING;
INSERT INTO Preparador              VALUES ('30411315', '2023-01-16', 'Sistemas Digitales I', 60)                               ON CONFLICT DO NOTHING;

INSERT INTO Egresado                VALUES ('27890123', '2019-01-14', 'Ingeniero en Informática', 16.80, 2024) ON CONFLICT DO NOTHING;
INSERT INTO Egresado                VALUES ('30445698', '2024-07-30', 'Comunicador Social',       18.80, 2024) ON CONFLICT DO NOTHING;

INSERT INTO Profesor                VALUES ('14567890', '2018-03-01', 'Asistente', 18, 'INV-2019-047')                              ON CONFLICT DO NOTHING;
INSERT INTO Personal_Administrativo VALUES ('17890234', '2015-06-01', 'Coordinador Académico', 40, 'Dirección Académica')           ON CONFLICT DO NOTHING;

-- Un empleado por oficina, con Unidad_Adscripcion = Responsable de Plantilla_Paso,
-- para poder probar la aprobación de pasos por departamento.
INSERT INTO Personal_Administrativo VALUES ('20123456', '2020-02-01', 'Cajera Principal',              40, 'Unidad de Caja')        ON CONFLICT DO NOTHING;
INSERT INTO Personal_Administrativo VALUES ('21234567', '2019-05-15', 'Secretario Académico',          40, 'Secretaría Académica')  ON CONFLICT DO NOTHING;
INSERT INTO Personal_Administrativo VALUES ('22345678', '2017-09-01', 'Asistente de Rectorado',        40, 'Rectorado')             ON CONFLICT DO NOTHING;
INSERT INTO Personal_Administrativo VALUES ('23456789', '2020-01-20', 'Analista de Control de Estudios', 40, 'Control de Estudios') ON CONFLICT DO NOTHING;
INSERT INTO Personal_Administrativo VALUES ('24567890', '2016-03-10', 'Supervisor de Planta Física',   40, 'Dir. Planta Física')    ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 6b. BENEFICIARIOS (vínculo familiar permanente: Carga_Menor / Carga_Mayor)
--     Solo Profesor o Personal_Administrativo pueden tener beneficiarios.
-- ---------------------------------------------------------------------
INSERT INTO Persona VALUES ('30777001', 'F', '2016-03-10', 'Valentina', NULL, 'Rodríguez', 'Pérez') ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('30777002', 'M', '2005-05-20', 'Andrés',    NULL, 'Herrera',   'Pérez') ON CONFLICT DO NOTHING;
INSERT INTO Persona VALUES ('30777003', 'F', '1998-01-15', 'Camila',    NULL, 'Blanco',    'Torres') ON CONFLICT DO NOTHING;

-- Carga Menor: hija de Carlos (profesor, 14567890), cobertura activa, con vacunas
INSERT INTO Beneficiario VALUES ('30777001', 'Hija', '14567890', '2020-01-10', NULL) ON CONFLICT DO NOTHING;
INSERT INTO Carga_Menor  VALUES ('30777001', 'Preescolar Los Arrayanes') ON CONFLICT DO NOTHING;
INSERT INTO Vacunacion   VALUES ('30777001', 'BCG')       ON CONFLICT DO NOTHING;
INSERT INTO Vacunacion   VALUES ('30777001', 'Pentavalente') ON CONFLICT DO NOTHING;

-- Carga Mayor: hijo de Luis (administrativo, 17890234), 21 años, sigue estudiando, cobertura activa
INSERT INTO Beneficiario VALUES ('30777002', 'Hijo', '17890234', '2023-06-01', NULL) ON CONFLICT DO NOTHING;
INSERT INTO Carga_Mayor  VALUES ('30777002', 'Constancia UCV — Ingeniería Civil, 6to semestre', 'S') ON CONFLICT DO NOTHING;

-- Carga Mayor: hija de Rosa (Unidad de Caja, 20123456), 28 años, nunca entregó constancia →
-- vínculo roto por vencimiento de edad límite sin estudios (demuestra el registro histórico)
INSERT INTO Beneficiario VALUES ('30777003', 'Hija', '20123456', '2018-02-01', '2026-01-15') ON CONFLICT DO NOTHING;
INSERT INTO Carga_Mayor  VALUES ('30777003', 'PENDIENTE DE ENTREGA', 'S') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 7. ENTIDAD PRESTADORA
--    (tabla padre de Entidad_Interna y Entidad_Externa)
-- ---------------------------------------------------------------------
INSERT INTO Entidad_Prestadora VALUES ('Dirección de Salud UCAB')               ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('Decanato de Investigación y Desarrollo') ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('Centro Cultural UCAB')                   ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('Dirección de Deportes UCAB')             ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('UCAB - Estacionamiento')                 ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('UCAB - Infraestructura')                 ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('Secretaría General UCAB')                ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('TechNova Solutions')                     ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('Creative Pulse Agency')                  ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('BBVA Provincial')                        ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('Mercantil Servicios Financieros')        ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Prestadora VALUES ('Movistar Venezuela')                     ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 8. ENTIDAD INTERNA
-- ---------------------------------------------------------------------
INSERT INTO Entidad_Interna VALUES ('PRES-SAL-001',  'Dra. Mariela Fernández', 'Dirección de Salud UCAB')               ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Interna VALUES ('PRES-INV-002',  'Dr. Andrés Montoya',     'Decanato de Investigación y Desarrollo') ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Interna VALUES ('PRES-CUL-003',  'Lic. Gabriela Ortiz',    'Centro Cultural UCAB')                   ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Interna VALUES ('PRES-DEP-004',  'Prof. Ricardo Salazar',  'Dirección de Deportes UCAB')             ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Interna VALUES ('PRES-ESTAC-001','Dir. Planta Física',     'UCAB - Estacionamiento')                 ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Interna VALUES ('PRES-INFRA-001','Dir. Planta Física',     'UCAB - Infraestructura')                 ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Interna VALUES ('SEC-UCAB-001',  'Secretaria General',     'Secretaría General UCAB')                ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 9. ENTIDAD EXTERNA
-- ---------------------------------------------------------------------
INSERT INTO Entidad_Externa VALUES ('J-123456789',   'TechNova Solutions',              '2027-12-31', 'Carlos Méndez',  'rrhh@technova.com',              'TechNova Solutions')              ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Externa VALUES ('J-456789012',   'Creative Pulse Agency',           '2027-06-30', 'María López',    'jobs@creativepulse.com',          'Creative Pulse Agency')           ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Externa VALUES ('J-00456789-0',  'BBVA Provincial',                 '2027-12-31', 'Mariela Torres', 'rrhh@bbvaprovincial.com.ve',      'BBVA Provincial')                 ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Externa VALUES ('J-00123456-0',  'Mercantil Servicios Financieros', '2027-06-30', 'Roberto Díaz',   'empleo@mercantil.com',            'Mercantil Servicios Financieros') ON CONFLICT DO NOTHING;
INSERT INTO Entidad_Externa VALUES ('J-00987654-0',  'Movistar Venezuela',              '2026-12-31', 'Laura Gómez',    'talentos@movistar.com.ve',        'Movistar Venezuela')              ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 10. VACANTE LABORAL
-- ---------------------------------------------------------------------
INSERT INTO Vacante_Laboral VALUES (
  'JOB-001', '2026-06-01', 'Desarrollador Junior Full-Stack', 'Disponible',
  'Desarrollo de plataformas web para clientes del sector financiero.',
  'Ingeniero en Informática, 0-2 años de experiencia, promedio mayor a 14',
  'Seguro médico, trabajo híbrido, capacitación continua',
  'J-123456789'
) ON CONFLICT DO NOTHING;

INSERT INTO Vacante_Laboral VALUES (
  'JOB-002', '2026-06-10', 'Estratega de Contenido Digital', 'Disponible',
  'Planificación de campañas multicanal, gestión de marca y análisis de métricas digitales.',
  'Comunicación Social o afines, manejo de redes sociales, promedio mayor a 13',
  'Seguro médico, trabajo 100% remoto, bonificación por resultados trimestrales',
  'J-456789012'
) ON CONFLICT DO NOTHING;

INSERT INTO Vacante_Laboral VALUES (
  'VAC-001', CURRENT_DATE, 'Analista de Sistemas', 'Disponible',
  'Análisis y desarrollo de sistemas empresariales. Soporte a usuarios internos.',
  'Licenciado o Ingeniero en Informática. Promedio mínimo 14. Manejo de bases de datos.',
  'Seguro médico HCM, bono de transporte, seguro de vida',
  'J-00456789-0'
) ON CONFLICT DO NOTHING;

INSERT INTO Vacante_Laboral VALUES (
  'VAC-002', CURRENT_DATE, 'Contador Junior', 'Disponible',
  'Elaboración y revisión de estados financieros. Conciliaciones bancarias.',
  'Licenciado en Contaduría Pública. Promedio superior a 13. Dominio de Excel.',
  'Seguro médico HCM, almuerzo subsidiado, caja de ahorro',
  'J-00123456-0'
) ON CONFLICT DO NOTHING;

INSERT INTO Vacante_Laboral VALUES (
  'VAC-003', CURRENT_DATE - INTERVAL '5 days', 'Técnico en Telecomunicaciones', 'Disponible',
  'Instalación y mantenimiento de redes. Soporte técnico a clientes corporativos.',
  'Ingeniero en Telecomunicaciones o Electrónica. Experiencia en redes LAN/WAN.',
  'Seguro médico, vehículo de empresa, comisiones',
  'J-00987654-0'
) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 11. ZONA DE ESTACIONAMIENTO y PUESTOS
-- ---------------------------------------------------------------------
INSERT INTO Zona_Estacionamiento VALUES ('ZONA-SAMB',  'Sambilito', 60, 1) ON CONFLICT DO NOTHING;
INSERT INTO Zona_Estacionamiento VALUES ('ZONA-PLAYA', 'Playa',     40, 1) ON CONFLICT DO NOTHING;
INSERT INTO Zona_Estacionamiento VALUES ('ZONA-PADEL', 'Padel',     30, 1) ON CONFLICT DO NOTHING;
INSERT INTO Zona_Estacionamiento VALUES ('ZONA-ESEQ',  'Esequibo',  40, 1) ON CONFLICT DO NOTHING;
INSERT INTO Zona_Estacionamiento VALUES ('ZONA-SOLA',  'Solarium',  30, 1) ON CONFLICT DO NOTHING;
INSERT INTO Zona_Estacionamiento VALUES ('ZONA-MODU',  'Modulos',   80, 1) ON CONFLICT DO NOTHING;

-- Sambilito
INSERT INTO Puesto VALUES ('ZONA-SAMB',  1, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  2, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  3, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  4, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  5, 'Carro',        'Reservado')      ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  6, 'Carro',        'Mantenimiento')  ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  7, 'Moto',         'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  8, 'Moto',         'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB',  9, 'Moto',         'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 10, 'Carga',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 11, 'Carga',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 12, 'Preferencial', 'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 13, 'Preferencial', 'Reservado')      ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 14, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 15, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 16, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 17, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SAMB', 18, 'Carro',        'Mantenimiento')  ON CONFLICT DO NOTHING;

-- Playa
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  1, 'Carro',        'Libre')         ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  2, 'Carro',        'Ocupado')       ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  3, 'Carro',        'Libre')         ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  4, 'Moto',         'Libre')         ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  5, 'Moto',         'Ocupado')       ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  6, 'Carro',        'Reservado')     ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  7, 'Preferencial', 'Libre')         ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  8, 'Carro',        'Libre')         ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA',  9, 'Carro',        'Mantenimiento') ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA', 10, 'Carro',        'Libre')         ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA', 11, 'Carro',        'Ocupado')       ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PLAYA', 12, 'Carga',        'Libre')         ON CONFLICT DO NOTHING;

-- Padel
INSERT INTO Puesto VALUES ('ZONA-PADEL', 1, 'Carro', 'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PADEL', 2, 'Carro', 'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PADEL', 3, 'Moto',  'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PADEL', 4, 'Carro', 'Reservado')      ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PADEL', 5, 'Carro', 'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PADEL', 6, 'Carro', 'Mantenimiento')  ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PADEL', 7, 'Carro', 'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-PADEL', 8, 'Carro', 'Ocupado')        ON CONFLICT DO NOTHING;

-- Esequibo
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  1, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  2, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  3, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  4, 'Preferencial', 'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  5, 'Moto',         'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  6, 'Carro',        'Reservado')      ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  7, 'Carro',        'Mantenimiento')  ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  8, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ',  9, 'Carga',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-ESEQ', 10, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;

-- Solarium
INSERT INTO Puesto VALUES ('ZONA-SOLA', 1, 'Carro', 'Libre')     ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SOLA', 2, 'Carro', 'Ocupado')   ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SOLA', 3, 'Moto',  'Libre')     ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SOLA', 4, 'Carro', 'Libre')     ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SOLA', 5, 'Carro', 'Reservado') ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-SOLA', 6, 'Carro', 'Libre')     ON CONFLICT DO NOTHING;

-- Módulos
INSERT INTO Puesto VALUES ('ZONA-MODU',  1, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  2, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  3, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  4, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  5, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  6, 'Carro',        'Reservado')      ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  7, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  8, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU',  9, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 10, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 11, 'Moto',         'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 12, 'Moto',         'Ocupado')        ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 13, 'Moto',         'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 14, 'Carga',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 15, 'Carga',        'Mantenimiento')  ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 16, 'Preferencial', 'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 17, 'Preferencial', 'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 18, 'Carro',        'Reservado')      ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 19, 'Carro',        'Libre')          ON CONFLICT DO NOTHING;
INSERT INTO Puesto VALUES ('ZONA-MODU', 20, 'Carro',        'Ocupado')        ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 12. REGISTRO DE ACCESO (vehículos activos y finalizados)
-- ---------------------------------------------------------------------
-- Sambilito — activos
INSERT INTO Registro_Acceso VALUES ('ACC-S001', 'ZONA-SAMB',  2, 'LAB-341', '2026-06-20 07:15:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-S002', 'ZONA-SAMB',  3, 'MAF-892', '2026-06-20 07:30:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-S003', 'ZONA-SAMB',  8, 'DAC-217', '2026-06-20 08:00:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-S004', 'ZONA-SAMB', 11, 'KBE-554', '2026-06-20 08:45:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-S005', 'ZONA-SAMB', 16, 'PGH-103', '2026-06-20 09:10:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
-- Playa — activos
INSERT INTO Registro_Acceso VALUES ('ACC-P001', 'ZONA-PLAYA',  2, 'TAM-678', '2026-06-20 07:20:00', NULL,                  'Activo',    NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-P002', 'ZONA-PLAYA',  5, 'RNB-445', '2026-06-20 08:10:00', NULL,                  'Activo',    NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-P003', 'ZONA-PLAYA', 11, 'CDF-229', '2026-06-20 09:00:00', NULL,                  'Activo',    NULL, NULL) ON CONFLICT DO NOTHING;
-- Padel — activos
INSERT INTO Registro_Acceso VALUES ('ACC-D001', 'ZONA-PADEL', 2, 'VHK-781', '2026-06-20 07:45:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-D002', 'ZONA-PADEL', 8, 'MJL-336', '2026-06-20 08:30:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
-- Esequibo — activos
INSERT INTO Registro_Acceso VALUES ('ACC-E001', 'ZONA-ESEQ',  2, 'BPR-512', '2026-06-20 07:00:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-E002', 'ZONA-ESEQ', 10, 'GTC-867', '2026-06-20 09:15:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
-- Solarium — activos
INSERT INTO Registro_Acceso VALUES ('ACC-L001', 'ZONA-SOLA',  2, 'NKW-294', '2026-06-20 08:20:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
-- Módulos — activos
INSERT INTO Registro_Acceso VALUES ('ACC-M001', 'ZONA-MODU',  3, 'FSD-143', '2026-06-20 07:10:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-M002', 'ZONA-MODU',  4, 'QLP-756', '2026-06-20 07:25:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-M003', 'ZONA-MODU',  8, 'WBN-389', '2026-06-20 08:05:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-M004', 'ZONA-MODU', 12, 'HGE-621', '2026-06-20 08:50:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-M005', 'ZONA-MODU', 20, 'JRV-478', '2026-06-20 09:05:00', NULL,                  'Activo',     NULL, NULL) ON CONFLICT DO NOTHING;
-- Historial finalizado
INSERT INTO Registro_Acceso VALUES ('ACC-H001', 'ZONA-SAMB',  1, 'ABF-234', '2026-06-19 08:00:00', '2026-06-19 12:30:00', 'Finalizado', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-H002', 'ZONA-PLAYA', 3, 'CDC-901', '2026-06-19 09:15:00', '2026-06-19 14:00:00', 'Finalizado', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO Registro_Acceso VALUES ('ACC-H003', 'ZONA-MODU',  5, 'TRP-567', '2026-06-19 07:30:00', '2026-06-19 11:45:00', 'Finalizado', NULL, NULL) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 13. CATEGORÍA DE SERVICIO
-- ---------------------------------------------------------------------
INSERT INTO Categoria_Servicio VALUES ('CAT-SAL',  'Salud',    'Servicios de Salud')    ON CONFLICT DO NOTHING;
INSERT INTO Categoria_Servicio VALUES ('CAT-EDU',  'Educacion','Educación Continua')     ON CONFLICT DO NOTHING;
INSERT INTO Categoria_Servicio VALUES ('CAT-CUL',  'Cultura',  'Arte y Cultura')         ON CONFLICT DO NOTHING;
INSERT INTO Categoria_Servicio VALUES ('CAT-DEP',  'Deporte',  'Servicios Deportivos')   ON CONFLICT DO NOTHING;
INSERT INTO Categoria_Servicio VALUES ('CAT-ESTAC','Deporte',  'Estacionamiento')        ON CONFLICT DO NOTHING;
INSERT INTO Categoria_Servicio VALUES ('CAT-TRAM', 'Educacion','Trámites Académicos')    ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 14. REGULA (Sede × Categoría)
-- ---------------------------------------------------------------------
-- Montalbán
INSERT INTO Regula VALUES (1, 'CAT-SAL',  80.00,  5.00,   'Edificio de Salud, Montalbán')       ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (1, 'CAT-EDU',  250.00, 10.00,  'Edificios Académicos, Montalbán')     ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (1, 'CAT-CUL',  120.00, 5.00,   'Centro Cultural, Montalbán')          ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (1, 'CAT-DEP',  40.00,  3.00,   'Complejo Deportivo, Montalbán')       ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (1, 'CAT-ESTAC',500.00, 1.00,   'Estacionamientos, Montalbán')         ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (1, 'CAT-TRAM', 500.00, 5.00,   'Secretaría, Montalbán')               ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
-- Guayana
INSERT INTO Regula VALUES (2, 'CAT-SAL',  60.00,  3.00,   'Unidad de Salud, Guayana')            ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (2, 'CAT-EDU',  180.00, 8.00,   'Edificios Académicos, Guayana')        ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (2, 'CAT-CUL',  80.00,  4.00,   'Auditorio, Guayana')                  ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;
INSERT INTO Regula VALUES (2, 'CAT-DEP',  25.00,  2.00,   'Canchas, Guayana')                    ON CONFLICT (ID_Sede, ID_Categoria) DO UPDATE SET Costo_Max = EXCLUDED.Costo_Max, Costo_Min = EXCLUDED.Costo_Min;

-- ---------------------------------------------------------------------
-- 15. SERVICIO
-- ---------------------------------------------------------------------
-- Salud
INSERT INTO Servicio VALUES ('SVC-SAL-001', 'Consulta Médica General',          'Dirección de Salud UCAB',               'CAT-SAL')  ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-SAL-002', 'Atención Odontológica',            'Dirección de Salud UCAB',               'CAT-SAL')  ON CONFLICT DO NOTHING;
-- Educación
INSERT INTO Servicio VALUES ('SVC-EDU-001', 'Taller de Programación en Python', 'Decanato de Investigación y Desarrollo', 'CAT-EDU') ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-EDU-002', 'Laboratorio de Idiomas',           'Decanato de Investigación y Desarrollo', 'CAT-EDU') ON CONFLICT DO NOTHING;
-- Cultura
INSERT INTO Servicio VALUES ('SVC-CUL-001', 'Reserva del Aula Magna',           'Centro Cultural UCAB',                  'CAT-CUL')  ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-CUL-002', 'Sala de Conferencias 202',         'Centro Cultural UCAB',                  'CAT-CUL')  ON CONFLICT DO NOTHING;
-- Deporte
INSERT INTO Servicio VALUES ('SVC-DEP-001', 'Cancha de Tenis',                  'Dirección de Deportes UCAB',            'CAT-DEP')  ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-DEP-002', 'Piscina Olímpica',                 'Dirección de Deportes UCAB',            'CAT-DEP')  ON CONFLICT DO NOTHING;
-- Estacionamiento
INSERT INTO Servicio VALUES ('SERV-ESTAC',  'Servicio de estacionamiento vehicular UCAB Montalbán', 'UCAB - Estacionamiento', 'CAT-ESTAC') ON CONFLICT DO NOTHING;
-- Infraestructura
INSERT INTO Servicio VALUES ('SERV-AUDIT',  'Alquiler de Auditorio',             'UCAB - Infraestructura', 'CAT-CUL')  ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SERV-SALON',  'Alquiler de Salón de Clases',       'UCAB - Infraestructura', 'CAT-EDU')  ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SERV-LAB',    'Uso de Laboratorio de Computación', 'UCAB - Infraestructura', 'CAT-EDU')  ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SERV-CANCHA', 'Uso de Cancha Deportiva',           'UCAB - Infraestructura', 'CAT-DEP')  ON CONFLICT DO NOTHING;
-- Trámites académicos
INSERT INTO Servicio VALUES ('SVC-TITULO',          'Solicitud de Título de Grado',    'Secretaría General UCAB', 'CAT-TRAM') ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-CONSTANCIA-EST',  'Constancia de Estudios',          'Secretaría General UCAB', 'CAT-TRAM') ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-RECORD-NOTAS',    'Record de Notas Certificado',     'Secretaría General UCAB', 'CAT-TRAM') ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-INSCRIPCION',     'Inscripción Semestral',           'Secretaría General UCAB', 'CAT-TRAM') ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-RETIRO-MATERIA',  'Retiro de Materias',              'Secretaría General UCAB', 'CAT-TRAM') ON CONFLICT DO NOTHING;
INSERT INTO Servicio VALUES ('SVC-RETIRO-SEMESTRE', 'Retiro de Semestre',              'Secretaría General UCAB', 'CAT-TRAM') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 15b. TARIFA (historial de precios; Egresado = Miembro*1.20, Externo = Miembro*1.60)
-- ---------------------------------------------------------------------
INSERT INTO Tarifa VALUES ('SVC-SAL-001',        '2025-01-01', 15.00,  18.00,  24.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-SAL-002',        '2025-01-01', 25.00,  30.00,  40.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-EDU-001',        '2025-01-01', 30.00,  36.00,  48.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-EDU-002',        '2025-01-01', 40.00,  48.00,  64.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-CUL-001',        '2025-01-01', 50.00,  60.00,  80.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-CUL-002',        '2025-01-01', 20.00,  24.00,  32.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-DEP-001',        '2025-01-01', 10.00,  12.00,  16.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-DEP-002',        '2025-01-01', 15.00,  18.00,  24.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SERV-ESTAC',         '2025-01-01', 20.00,  24.00,  32.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SERV-AUDIT',         '2025-01-01', 60.00,  72.00,  96.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SERV-SALON',         '2025-01-01', 25.00,  30.00,  40.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SERV-LAB',           '2025-01-01', 35.00,  42.00,  56.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SERV-CANCHA',        '2025-01-01', 12.00,  14.40,  19.20)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-TITULO',         '2025-01-01', 150.00, 180.00, 240.00) ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-CONSTANCIA-EST', '2025-01-01', 20.00,  24.00,  32.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-RECORD-NOTAS',   '2025-01-01', 40.00,  48.00,  64.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-INSCRIPCION',    '2025-01-01', 100.00, 120.00, 160.00) ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-RETIRO-MATERIA', '2025-01-01', 15.00,  18.00,  24.00)  ON CONFLICT DO NOTHING;
INSERT INTO Tarifa VALUES ('SVC-RETIRO-SEMESTRE','2025-01-01', 15.00,  18.00,  24.00)  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 16. REQUISITOS DE ACCESO
-- ---------------------------------------------------------------------
INSERT INTO Requisitos_Acceso VALUES ('SVC-SAL-001', 'Cédula de identidad vigente')                         ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-SAL-002', 'Cédula de identidad vigente')                         ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-SAL-002', 'Historial médico previo si aplica')                   ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-CUL-001', 'Solicitud formal con 72 horas de anticipación')       ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-CUL-001', 'Carta aval de la unidad solicitante')                 ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-DEP-002', 'No padecer enfermedades cardiovasculares')            ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-DEP-002', 'Saber nadar')                                        ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-TITULO',  'Haber completado todas las UC del pensum')            ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-TITULO',  'No poseer deudas financieras con la universidad')     ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-TITULO',  'Carta de trabajo social aprobada')                    ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-CONSTANCIA-EST', 'Cédula de identidad vigente')                  ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-RECORD-NOTAS',   'Cédula de identidad vigente')                  ON CONFLICT DO NOTHING;
INSERT INTO Requisitos_Acceso VALUES ('SVC-RECORD-NOTAS',   'Solvencia financiera activa')                  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 17. ACREDITACIÓN
-- ---------------------------------------------------------------------
INSERT INTO Acreditacion VALUES ('ACRED-001', 'Solvencia',       'Constancia emitida por Caja que certifica no tener deudas pendientes con la universidad') ON CONFLICT DO NOTHING;
INSERT INTO Acreditacion VALUES ('ACRED-002', 'Identificacion',  'Carnet universitario activo del período académico en curso')                               ON CONFLICT DO NOTHING;
INSERT INTO Acreditacion VALUES ('ACRED-003', 'Salud',           'Certificado emitido por médico colegiado con vigencia de 12 meses')                        ON CONFLICT DO NOTHING;
INSERT INTO Acreditacion VALUES ('ACRED-004', 'Seguro',          'Póliza de seguro estudiantil en vigor')                                                    ON CONFLICT DO NOTHING;
INSERT INTO Acreditacion VALUES ('ACRED-005', 'Idioma',          'Certificación en Idioma Inglés (nivel intermedio o superior)')                              ON CONFLICT DO NOTHING;
INSERT INTO Acreditacion VALUES ('ACRED-006', 'Posgrado',        'Diplomado o Especialización en área relacionada')                                           ON CONFLICT DO NOTHING;
INSERT INTO Acreditacion VALUES ('ACRED-007', 'Formación',       'Curso de Actualización Docente')                                                            ON CONFLICT DO NOTHING;
INSERT INTO Acreditacion VALUES ('ACRED-008', 'Certificación',   'Certificado en Gestión de Proyectos (PMP o PRINCE2)')                                       ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 18. REQUIERE (Acreditación ↔ Servicio)
-- ---------------------------------------------------------------------
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-SAL-002')  ON CONFLICT DO NOTHING;  -- Odontología exige carnet
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-EDU-002')  ON CONFLICT DO NOTHING;  -- Lab. Idiomas exige carnet
INSERT INTO Requiere VALUES ('ACRED-001', 'SVC-CUL-001')  ON CONFLICT DO NOTHING;  -- Aula Magna exige solvencia
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-CUL-001')  ON CONFLICT DO NOTHING;  -- Aula Magna exige carnet
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-CUL-002')  ON CONFLICT DO NOTHING;  -- Sala 202 exige carnet
INSERT INTO Requiere VALUES ('ACRED-003', 'SVC-DEP-002')  ON CONFLICT DO NOTHING;  -- Piscina exige cert. médico
INSERT INTO Requiere VALUES ('ACRED-001', 'SVC-TITULO')   ON CONFLICT DO NOTHING;  -- Título exige solvencia
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-TITULO')   ON CONFLICT DO NOTHING;  -- Título exige carnet

-- ---------------------------------------------------------------------
-- 18b. PLANTILLA_PASO (secuencia de oficinas responsables por servicio)
-- ---------------------------------------------------------------------
-- Trámites académicos (flujo multi-oficina)
INSERT INTO Plantilla_Paso VALUES ('SVC-TITULO', 1, 'Verificación de solvencia y pago de aranceles', 'Unidad de Caja')                    ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-TITULO', 2, 'Validación de créditos y requisitos de graduación', 'Secretaría Académica')          ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-TITULO', 3, 'Emisión y firma del documento oficial', 'Rectorado')                                 ON CONFLICT DO NOTHING;

INSERT INTO Plantilla_Paso VALUES ('SVC-CONSTANCIA-EST', 1, 'Emisión de constancia de estudios', 'Secretaría Académica')                  ON CONFLICT DO NOTHING;

INSERT INTO Plantilla_Paso VALUES ('SVC-RECORD-NOTAS', 1, 'Verificación de solvencia', 'Unidad de Caja')                                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-RECORD-NOTAS', 2, 'Generación y certificación del record', 'Secretaría Académica')                ON CONFLICT DO NOTHING;

INSERT INTO Plantilla_Paso VALUES ('SVC-INSCRIPCION', 1, 'Pago de arancel de inscripción', 'Unidad de Caja')                              ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-INSCRIPCION', 2, 'Procesamiento de inscripción semestral', 'Control de Estudios')                 ON CONFLICT DO NOTHING;

INSERT INTO Plantilla_Paso VALUES ('SVC-RETIRO-MATERIA', 1, 'Procesamiento del retiro de materia', 'Control de Estudios')                 ON CONFLICT DO NOTHING;

INSERT INTO Plantilla_Paso VALUES ('SVC-RETIRO-SEMESTRE', 1, 'Aprobación del retiro de semestre', 'Control de Estudios')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-RETIRO-SEMESTRE', 2, 'Registro oficial del retiro', 'Secretaría Académica')                       ON CONFLICT DO NOTHING;

-- Salud, Educación, Cultura, Deporte (flujo de un solo paso: caja confirma el pago)
INSERT INTO Plantilla_Paso VALUES ('SVC-SAL-001', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-SAL-002', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-EDU-001', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-EDU-002', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-CUL-001', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-CUL-002', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-DEP-001', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;
INSERT INTO Plantilla_Paso VALUES ('SVC-DEP-002', 1, 'Confirmación de pago y validación de solvencia', 'Unidad de Caja')                  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 19. CUMPLE (acreditaciones de cada miembro; Ana tiene una vencida)
-- ---------------------------------------------------------------------
INSERT INTO Cumple VALUES ('30411315', 'ACRED-002', '2027-01-16', '2026-01-16', 'Vigente') ON CONFLICT DO NOTHING;

INSERT INTO Cumple VALUES ('14567890', 'ACRED-001', '2027-03-01', '2026-03-01', 'Vigente') ON CONFLICT DO NOTHING;
INSERT INTO Cumple VALUES ('14567890', 'ACRED-002', '2027-03-01', '2026-03-01', 'Vigente') ON CONFLICT DO NOTHING;
INSERT INTO Cumple VALUES ('14567890', 'ACRED-003', '2027-01-15', '2026-01-15', 'Vigente') ON CONFLICT DO NOTHING;

INSERT INTO Cumple VALUES ('17890234', 'ACRED-001', '2027-06-01', '2026-06-01', 'Vigente') ON CONFLICT DO NOTHING;
INSERT INTO Cumple VALUES ('17890234', 'ACRED-002', '2027-06-01', '2026-06-01', 'Vigente') ON CONFLICT DO NOTHING;
INSERT INTO Cumple VALUES ('17890234', 'ACRED-003', '2027-06-01', '2026-06-01', 'Vigente') ON CONFLICT DO NOTHING;

INSERT INTO Cumple VALUES ('27890123', 'ACRED-002', '2025-07-30', '2024-07-30', 'Vencida') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 20. TASA DE CAMBIO BCV
-- ---------------------------------------------------------------------
INSERT INTO Tasa VALUES ('2026-06-22', 46.20, 42.50) ON CONFLICT (Fecha_Tasa) DO UPDATE SET EUR = EXCLUDED.EUR, USD = EXCLUDED.USD;
INSERT INTO Tasa VALUES ('2026-06-23', 46.50, 42.80) ON CONFLICT (Fecha_Tasa) DO UPDATE SET EUR = EXCLUDED.EUR, USD = EXCLUDED.USD;
INSERT INTO Tasa (Fecha_Tasa, EUR, USD)
  VALUES (CURRENT_DATE - INTERVAL '1 day', 52.10, 47.95)
  ON CONFLICT (Fecha_Tasa) DO UPDATE SET EUR = EXCLUDED.EUR, USD = EXCLUDED.USD;
INSERT INTO Tasa (Fecha_Tasa, EUR, USD)
  VALUES (CURRENT_DATE, 52.50, 48.20)
  ON CONFLICT (Fecha_Tasa) DO UPDATE SET EUR = EXCLUDED.EUR, USD = EXCLUDED.USD;

-- ---------------------------------------------------------------------
-- 21. SOLICITUDES DE SERVICIO (distintos estados: Pendiente/En Proceso/Completada)
-- ---------------------------------------------------------------------
INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-001', NULL,                  'Pendiente',  '2026-06-18', '30411315', 'SVC-DEP-001') ON CONFLICT DO NOTHING;
INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-002', NULL,                  'En Proceso', '2026-06-10', '14567890', 'SVC-CUL-001') ON CONFLICT DO NOTHING;
INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-003', 'Atención completada', 'Completada', '2026-06-05', '30411315', 'SVC-SAL-002') ON CONFLICT DO NOTHING;
INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-004', NULL,                  'Pendiente',  '2026-06-19', '17890234', 'SVC-EDU-001') ON CONFLICT DO NOTHING;
INSERT INTO Solicitud_Servicio VALUES ('SOL-INFRA-001', NULL, 'En Proceso', '2026-06-22', '30411315', 'SERV-AUDIT')  ON CONFLICT DO NOTHING;
INSERT INTO Solicitud_Servicio VALUES ('SOL-INFRA-002', NULL, 'En Proceso', '2026-06-22', '14567890', 'SERV-LAB')    ON CONFLICT DO NOTHING;
INSERT INTO Solicitud_Servicio VALUES ('SOL-INFRA-003', NULL, 'Completada', '2026-06-20', '17890234', 'SERV-SALON')  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 22. PASO DE ACTIVIDAD
-- ---------------------------------------------------------------------
INSERT INTO Paso_Actividad VALUES ('PASO-T001-01', '2026-06-18 09:00:00', 'Dirección de Deportes UCAB',             NULL,                  'Pendiente',  'SOL-TEST-001', 1) ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T002-01', '2026-06-10 10:00:00', 'Centro Cultural UCAB',                    '2026-06-12 14:30:00', 'Completado', 'SOL-TEST-002', 1) ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T002-02', '2026-06-12 14:30:00', 'Coordinación Académica',                  NULL,                  'Pendiente',  'SOL-TEST-002', 2) ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T003-01', '2026-06-05 08:00:00', 'Dirección de Salud UCAB',                 '2026-06-05 09:45:00', 'Completado', 'SOL-TEST-003', 1) ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T004-01', '2026-06-19 11:00:00', 'Decanato de Investigación y Desarrollo',  NULL,                  'Pendiente',  'SOL-TEST-004', 1) ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-I001',    '2026-06-22 08:00:00', 'Dir. Planta Física',                      NULL,                  'En Proceso', 'SOL-INFRA-001', 1) ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-I002',    '2026-06-22 09:00:00', 'Dir. Planta Física',                      NULL,                  'En Proceso', 'SOL-INFRA-002', 1) ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-I003',    '2026-06-20 08:00:00', 'Dir. Planta Física',                      '2026-06-20 09:00:00', 'Completado', 'SOL-INFRA-003', 1) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 23. ACOMPAÑANTE
-- ---------------------------------------------------------------------
INSERT INTO Acompanante VALUES ('SOL-TEST-002', '22334455', 'María Elena Rodríguez') ON CONFLICT DO NOTHING;
INSERT INTO Acompanante VALUES ('SOL-TEST-002', '11223344', 'Pedro José Gómez')       ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 24. EDIFICACIÓN y ESPACIO FÍSICO
-- ---------------------------------------------------------------------
INSERT INTO Edificacion VALUES (1, 'Edificio Cincuentenario',  'Campus Montalbán, Área Central') ON CONFLICT DO NOTHING;
INSERT INTO Edificacion VALUES (1, 'Edificio de Laboratorios', 'Campus Montalbán, Zona Norte')   ON CONFLICT DO NOTHING;
INSERT INTO Edificacion VALUES (1, 'Edificio de Postgrado',    'Campus Montalbán, Área Este')    ON CONFLICT DO NOTHING;
INSERT INTO Edificacion VALUES (1, 'Módulo Deportivo',         'Campus Montalbán, Área Oeste')   ON CONFLICT DO NOTHING;

INSERT INTO Espacio_Fisico VALUES (1, 'Edificio Cincuentenario',  1, 'Auditorio',  240, 'Ergonómico Premium', 'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio Cincuentenario',  2, 'Salón',       40, 'Estándar',           'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio Cincuentenario',  3, 'Salón',       35, 'Estándar',           'No disponible', 'Mantenimiento') ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio de Laboratorios', 1, 'Laboratorio', 30, 'Computadoras HP',   'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio de Laboratorios', 2, 'Laboratorio', 25, 'Computadoras Dell', 'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio de Laboratorios', 3, 'Salón',       40, 'Estándar',          'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio de Postgrado',    1, 'Salón',       30, 'Ejecutivo',          'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio de Postgrado',    2, 'Auditorio',  120, 'Ergonómico',         'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Edificio de Postgrado',    3, 'Salón',       25, 'Estándar',           'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Módulo Deportivo',         1, 'Cancha',      50, 'Deportivo',          'Disponible',    'Activo')       ON CONFLICT DO NOTHING;
INSERT INTO Espacio_Fisico VALUES (1, 'Módulo Deportivo',         2, 'Cancha',      30, 'Deportivo',          'Disponible',    'Activo')       ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 25. RESERVA
-- ---------------------------------------------------------------------
INSERT INTO Reserva VALUES (1, 'Edificio Cincuentenario',  1, '08:00-10:00', '08:00', '10:00', '2026-06-23', 'PASO-I001', 'SOL-INFRA-001') ON CONFLICT DO NOTHING;
INSERT INTO Reserva VALUES (1, 'Edificio de Laboratorios', 1, '11:00-13:00', '11:00', '13:00', '2026-06-24', 'PASO-I002', 'SOL-INFRA-002') ON CONFLICT DO NOTHING;
INSERT INTO Reserva VALUES (1, 'Edificio Cincuentenario',  2, '14:00-16:00', '14:00', '16:00', '2026-06-25', 'PASO-I003', 'SOL-INFRA-003') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 26. TERCERO CORPORATIVO (para la factura corporativa de ejemplo)
-- ---------------------------------------------------------------------
INSERT INTO Tercero_Corporativo VALUES ('J-99988877-6', 'Constructora Andina C.A.') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 27. FOLIO DE CONSUMO (uno por solicitud; Estado lo cierra
--     automáticamente trg_cerrar_folio al emitirse la Factura)
-- ---------------------------------------------------------------------
INSERT INTO Folio_Consumo VALUES ('FOL-T001', 'Abierto', 'SOL-TEST-001')  ON CONFLICT DO NOTHING;
INSERT INTO Folio_Consumo VALUES ('FOL-T002', 'Abierto', 'SOL-TEST-002')  ON CONFLICT DO NOTHING;
INSERT INTO Folio_Consumo VALUES ('FOL-T003', 'Abierto', 'SOL-TEST-003')  ON CONFLICT DO NOTHING;
INSERT INTO Folio_Consumo VALUES ('FOL-T004', 'Abierto', 'SOL-TEST-004')  ON CONFLICT DO NOTHING;
INSERT INTO Folio_Consumo VALUES ('FOL-I001', 'Abierto', 'SOL-INFRA-001') ON CONFLICT DO NOTHING;
INSERT INTO Folio_Consumo VALUES ('FOL-I002', 'Abierto', 'SOL-INFRA-002') ON CONFLICT DO NOTHING;
INSERT INTO Folio_Consumo VALUES ('FOL-I003', 'Abierto', 'SOL-INFRA-003') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 28. ÍTEM DE CONSUMO (precio validado por trg_validar_precio_item
--     contra el rango de Regula para la categoría del servicio)
-- ---------------------------------------------------------------------
INSERT INTO Item_Consumo VALUES ('FOL-T001', 1, 0.16, 1, 'Alquiler de cancha de tenis',              10.00) ON CONFLICT DO NOTHING;
INSERT INTO Item_Consumo VALUES ('FOL-T002', 1, 0.16, 1, 'Alquiler Aula Magna',                       50.00) ON CONFLICT DO NOTHING;
INSERT INTO Item_Consumo VALUES ('FOL-T002', 2, 0.16, 1, 'Soporte técnico para evento',               15.00) ON CONFLICT DO NOTHING;
INSERT INTO Item_Consumo VALUES ('FOL-T003', 1, 0.16, 1, 'Consulta odontológica',                     25.00) ON CONFLICT DO NOTHING;
INSERT INTO Item_Consumo VALUES ('FOL-T004', 1, 0.16, 1, 'Taller de Programación en Python',          30.00) ON CONFLICT DO NOTHING;
INSERT INTO Item_Consumo VALUES ('FOL-I001', 1, 0.16, 1, 'Alquiler de auditorio (evento corporativo)',60.00) ON CONFLICT DO NOTHING;
INSERT INTO Item_Consumo VALUES ('FOL-I002', 1, 0.16, 1, 'Uso de laboratorio de computación',         35.00) ON CONFLICT DO NOTHING;
INSERT INTO Item_Consumo VALUES ('FOL-I003', 1, 0.16, 1, 'Alquiler de salón de clases',               25.00) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 29. FACTURA (FAC-I001 se factura al tercero corporativo)
-- ---------------------------------------------------------------------
INSERT INTO Factura VALUES ('FAC-T001', '2026-06-18', 11.60, 0, 'Pendiente', 'FOL-T001', NULL)          ON CONFLICT DO NOTHING;
INSERT INTO Factura VALUES ('FAC-T002', '2026-06-11', 75.40, 0, 'Pendiente', 'FOL-T002', NULL)          ON CONFLICT DO NOTHING;
INSERT INTO Factura VALUES ('FAC-T003', '2026-06-05', 29.00, 0, 'Pendiente', 'FOL-T003', NULL)          ON CONFLICT DO NOTHING;
INSERT INTO Factura VALUES ('FAC-T004', '2026-06-19', 34.80, 0, 'Pendiente', 'FOL-T004', NULL)          ON CONFLICT DO NOTHING;
INSERT INTO Factura VALUES ('FAC-I001', '2026-06-22', 69.60, 0, 'Pendiente', 'FOL-I001', 'J-99988877-6') ON CONFLICT DO NOTHING;
INSERT INTO Factura VALUES ('FAC-I002', '2026-06-22', 40.60, 0, 'Pendiente', 'FOL-I002', NULL)          ON CONFLICT DO NOTHING;
INSERT INTO Factura VALUES ('FAC-I003', '2026-06-20', 29.00, 0, 'Pendiente', 'FOL-I003', NULL)          ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 30. PAGO y sus 6 subtipos (FAC-I001 queda sin pago, en estado Pendiente)
-- ---------------------------------------------------------------------
INSERT INTO Pago VALUES ('PAGO-001', 11.60, '2026-06-18', 'FAC-T001', 'USD', NULL) ON CONFLICT DO NOTHING;
INSERT INTO Pago_Movil VALUES ('PAGO-001', '0414-555-1315', '000123456789', 'Banco Mercantil') ON CONFLICT DO NOTHING;

INSERT INTO Pago VALUES ('PAGO-002', 40.00, '2026-06-11', 'FAC-T002', 'USD', NULL) ON CONFLICT DO NOTHING;
INSERT INTO Efectivo VALUES ('PAGO-002', 'USD', 40.00) ON CONFLICT DO NOTHING;

INSERT INTO Pago VALUES ('PAGO-003', 29.00, '2026-06-05', 'FAC-T003', 'USD', NULL) ON CONFLICT DO NOTHING;
INSERT INTO TAI VALUES ('PAGO-003', '04A3B2C1D5E6F7', 'POS-CAJA-01', 'NFC') ON CONFLICT DO NOTHING;

INSERT INTO Pago VALUES ('PAGO-004', 34.80, '2026-06-19', 'FAC-T004', 'USD', NULL) ON CONFLICT DO NOTHING;
INSERT INTO Zelle VALUES ('PAGO-004', 'Luis Alberto Herrera', 'lherrera.pagos@gmail.com', 'ZELLE-CONF-88291') ON CONFLICT DO NOTHING;

INSERT INTO Pago VALUES ('PAGO-005', 40.60, '2026-06-22', 'FAC-I002', 'USD', NULL) ON CONFLICT DO NOTHING;
INSERT INTO Cripto VALUES ('PAGO-005', '0xa1b2c3d4e5f60718293a4b5c6d7e8f9', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', 'TRC20', 'USDT') ON CONFLICT DO NOTHING;

INSERT INTO Pago VALUES ('PAGO-006', 29.00, '2026-06-20', 'FAC-I003', 'USD', NULL) ON CONFLICT DO NOTHING;
INSERT INTO Tarjeta VALUES ('PAGO-006', '4000123456781234', 'Nacional', 'Banesco') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 31. TELÉFONO DE CONTACTO EXTERNO (uno por Entidad_Externa)
-- ---------------------------------------------------------------------
INSERT INTO Telefono_Contacto_Externo VALUES ('J-123456789',  '0212-555-0101') ON CONFLICT DO NOTHING;
INSERT INTO Telefono_Contacto_Externo VALUES ('J-456789012',  '0212-555-0202') ON CONFLICT DO NOTHING;
INSERT INTO Telefono_Contacto_Externo VALUES ('J-00456789-0', '0212-555-0303') ON CONFLICT DO NOTHING;
INSERT INTO Telefono_Contacto_Externo VALUES ('J-00123456-0', '0212-555-0404') ON CONFLICT DO NOTHING;
INSERT INTO Telefono_Contacto_Externo VALUES ('J-00987654-0', '0212-555-0505') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 32. POSTULA (postulaciones con distintos estatus del ciclo de vida)
-- ---------------------------------------------------------------------
INSERT INTO Postula VALUES ('27890123', '2019-01-14', 'JOB-001', '2026-06-15', 'Entrevistado', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Postula VALUES ('27890123', '2019-01-14', 'VAC-001', '2026-06-20', 'Rechazado',    NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Postula VALUES ('27890123', '2019-01-14', 'JOB-002', '2026-07-10', 'En Revisión',  NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Postula VALUES ('30445698', '2024-07-30', 'JOB-002', '2026-06-22', 'Contratado',   '2026-07-05') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 33. SESIÓN (historial de accesos de prueba)
-- ---------------------------------------------------------------------
INSERT INTO Sesion VALUES ('30411315', 'a1b2c3d4-0001-4000-8000-000000000001', '2026-07-10 08:15:00', '190.202.1.45',  0, 10.4880, -66.8792, TRUE)  ON CONFLICT DO NOTHING;
INSERT INTO Sesion VALUES ('14567890', 'a1b2c3d4-0002-4000-8000-000000000002', '2026-07-11 09:30:00', '190.202.1.87',  0, 10.4880, -66.8792, TRUE)  ON CONFLICT DO NOTHING;
INSERT INTO Sesion VALUES ('17890234', 'a1b2c3d4-0003-4000-8000-000000000003', '2026-07-12 07:50:00', '190.202.1.12',  1, 10.4880, -66.8792, TRUE)  ON CONFLICT DO NOTHING;
INSERT INTO Sesion VALUES ('27890123', 'a1b2c3d4-0004-4000-8000-000000000004', '2026-07-13 14:20:00', '186.88.12.203', 0, 10.4880, -66.8792, FALSE) ON CONFLICT DO NOTHING;