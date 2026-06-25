-- =====================================================================
--  inserts.sql  —  Datos iniciales de UCAB-Services (PostgreSQL)
--  Orden respeta dependencias de clave foránea.
--  Todos los inserts usan ON CONFLICT para permitir re-ejecución.
--
--  Orden de ejecución recomendado:
--    create.sql  ->  inserts.sql  ->  logic.sql  ->  security.sql
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

-- ---------------------------------------------------------------------
-- 3. MIEMBRO DE LA COMUNIDAD
-- ---------------------------------------------------------------------
INSERT INTO Miembro_Comunidad VALUES ('30411315', 'pvdesousa.23@ucab.edu.ve',  1, '30411315', 'Activa', '2026-01-10', 'Caracas', 'Distrito Capital', 'Av. Páez, El Paraíso')          ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('27890123', 'agmartinez.19@ucab.edu.ve', 1, '27890123', 'Activa', '2024-08-01', 'Caracas', 'Distrito Capital', 'Urb. Los Chorros, Calle 3')     ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('14567890', 'crodriguez@ucab.edu.ve',    1, '14567890', 'Activa', '2025-12-01', 'Caracas', 'Distrito Capital', 'Av. Vollmer, San Bernardino')    ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('17890234', 'lherrera@ucab.edu.ve',      1, '17890234', 'Activa', '2025-10-20', 'Caracas', 'Distrito Capital', 'Av. Principal de Chuao')        ON CONFLICT DO NOTHING;
INSERT INTO Miembro_Comunidad VALUES ('30445698', 'dcastaldo.21@ucab.edu.ve',  1, '30445698', 'Activa', '2024-08-01', 'Caracas', 'Distrito Capital', 'Urb. La Boyera, El Hatillo')    ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. TELÉFONO
-- ---------------------------------------------------------------------
INSERT INTO Telefono VALUES ('30411315', '0414-555-1315')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('27890123', '0424-555-0123')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('14567890', '0212-555-7890')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('17890234', '0212-555-0234')  ON CONFLICT DO NOTHING;
INSERT INTO Telefono VALUES ('30445698', '0414-555-45698') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. PERIODO DE VINCULACIÓN
-- ---------------------------------------------------------------------
INSERT INTO Periodo_Vinculacion VALUES ('30411315', '2023-01-16', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('27890123', '2019-01-14', '2024-07-30') ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('14567890', '2018-03-01', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('17890234', '2015-06-01', NULL)         ON CONFLICT DO NOTHING;
INSERT INTO Periodo_Vinculacion VALUES ('30445698', '2024-07-30', '2024-08-10') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. ROLES DE VINCULACIÓN
--    Orden: Estudiante → Becario / Preparador (dependen de Estudiante)
--           Egresado, Profesor, Personal_Administrativo (dependen de Periodo_Vinculacion)
-- ---------------------------------------------------------------------
INSERT INTO Estudiante              VALUES ('30411315', '2023-01-16', 'Ingeniería en Informática', 162, 18.45, 'Ingeniería', 8) ON CONFLICT DO NOTHING;
INSERT INTO Becario                 VALUES ('30411315', '2023-01-16', 'Excelencia', 'Activa', 18.45)                           ON CONFLICT DO NOTHING;
INSERT INTO Preparador              VALUES ('30411315', '2023-01-16', 'Sistemas Digitales I', 60)                               ON CONFLICT DO NOTHING;

INSERT INTO Egresado                VALUES ('27890123', '2019-01-14', 'Ingeniero en Informática', 16.80, 2024) ON CONFLICT DO NOTHING;
INSERT INTO Egresado                VALUES ('30445698', '2024-07-30', 'Comunicador Social',       18.80, 2024) ON CONFLICT DO NOTHING;

INSERT INTO Profesor                VALUES ('14567890', '2018-03-01', 'Asistente', 18, 'INV-2019-047')                              ON CONFLICT DO NOTHING;
INSERT INTO Personal_Administrativo VALUES ('17890234', '2015-06-01', 'Coordinador Académico', 40, 'Dirección Académica')           ON CONFLICT DO NOTHING;

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
-- 19. CUMPLE (acreditaciones de cada miembro)
--
--   Paola  (30411315): ACRED-002 → SVC-SAL-002 ✓, SVC-EDU-002 ✓, SVC-CUL-002 ✓
--                      Sin ACRED-001 → SVC-CUL-001 ✗  |  Sin ACRED-003 → SVC-DEP-002 ✗
--   Carlos (14567890): ACRED-001+002+003 → puede solicitar todo
--   Luis   (17890234): ACRED-001+002+003 → puede solicitar todo
--   Ana    (27890123): ACRED-002 vencida → escenario de prueba de expiración
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
-- 21. SOLICITUDES DE SERVICIO
--
--   SOL-TEST-001: Paola pide Cancha de Tenis (sin req.) → Pendiente
--   SOL-TEST-002: Carlos pide Aula Magna (tiene todo)   → En Proceso
--   SOL-TEST-003: Paola pide Odontología (tiene carnet) → Completada
--   SOL-TEST-004: Luis pide Taller Python (sin req.)    → Pendiente
--   SOL-INFRA-00x: reservas de infraestructura
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
INSERT INTO Paso_Actividad VALUES ('PASO-T001-01', '2026-06-18 09:00:00', 'Dirección de Deportes UCAB',             NULL,                  'Pendiente',  'SOL-TEST-001') ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T002-01', '2026-06-10 10:00:00', 'Centro Cultural UCAB',                    '2026-06-12 14:30:00', 'Completado', 'SOL-TEST-002') ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T002-02', '2026-06-12 14:30:00', 'Coordinación Académica',                  NULL,                  'Pendiente',  'SOL-TEST-002') ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T003-01', '2026-06-05 08:00:00', 'Dirección de Salud UCAB',                 '2026-06-05 09:45:00', 'Completado', 'SOL-TEST-003') ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-T004-01', '2026-06-19 11:00:00', 'Decanato de Investigación y Desarrollo',  NULL,                  'Pendiente',  'SOL-TEST-004') ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-I001',    '2026-06-22 08:00:00', 'Dir. Planta Física',                      NULL,                  'En Proceso', 'SOL-INFRA-001') ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-I002',    '2026-06-22 09:00:00', 'Dir. Planta Física',                      NULL,                  'En Proceso', 'SOL-INFRA-002') ON CONFLICT DO NOTHING;
INSERT INTO Paso_Actividad VALUES ('PASO-I003',    '2026-06-20 08:00:00', 'Dir. Planta Física',                      '2026-06-20 09:00:00', 'Completado', 'SOL-INFRA-003') ON CONFLICT DO NOTHING;

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
INSERT INTO Reserva VALUES (1, 'Edificio Cincuentenario',  1, '08:00-10:00', '2026-06-23', 'PASO-I001', 'SOL-INFRA-001') ON CONFLICT DO NOTHING;
INSERT INTO Reserva VALUES (1, 'Edificio de Laboratorios', 1, '11:00-13:00', '2026-06-24', 'PASO-I002', 'SOL-INFRA-002') ON CONFLICT DO NOTHING;
INSERT INTO Reserva VALUES (1, 'Edificio Cincuentenario',  2, '14:00-16:00', '2026-06-25', 'PASO-I003', 'SOL-INFRA-003') ON CONFLICT DO NOTHING;