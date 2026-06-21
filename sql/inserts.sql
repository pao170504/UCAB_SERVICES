--SEDES
INSERT INTO Sede VALUES (1, 'Montalbán');
INSERT INTO Sede VALUES (2, 'Guayana');

--PERSONAS
INSERT INTO Persona VALUES ('30411315', 'F', '2004-09-15', 'Paola',  'Valentina', 'De Sousa',  'García');
INSERT INTO Persona VALUES ('27890123', 'F', '2001-06-14', 'Ana',    'Gabriela',  'Martínez',  'Torres');
INSERT INTO Persona VALUES ('14567890', 'M', '1980-02-18', 'Carlos', 'Antonio',   'Rodríguez', 'Méndez');
INSERT INTO Persona VALUES ('17890234', 'M', '1980-05-12', 'Luis',   'Alberto',   'Herrera',   'González');
INSERT INTO Persona VALUES ('30445698', 'F', '2001-09-17', 'Daniela','Valentina', 'Castaldo',  'Martinez');

--MIEMBROS DE LA COMUNIDAD
INSERT INTO Miembro_Comunidad VALUES ('30411315', 'pvdesousa.23@ucab.edu.ve',  1, '30411315', 'Activa', '2026-01-10', 'Caracas', 'Distrito Capital', 'Av. Páez, El Paraíso');
INSERT INTO Miembro_Comunidad VALUES ('27890123', 'agmartinez.19@ucab.edu.ve', 1, '27890123', 'Activa', '2024-08-01', 'Caracas', 'Distrito Capital', 'Urb. Los Chorros, Calle 3');
INSERT INTO Miembro_Comunidad VALUES ('14567890', 'crodriguez@ucab.edu.ve',    1, '14567890', 'Activa', '2025-12-01', 'Caracas', 'Distrito Capital', 'Av. Vollmer, San Bernardino');
INSERT INTO Miembro_Comunidad VALUES ('17890234', 'lherrera@ucab.edu.ve',      1, '17890234', 'Activa', '2025-10-20', 'Caracas', 'Distrito Capital', 'Av. Principal de Chuao');
INSERT INTO Miembro_Comunidad VALUES ('30445698', 'dcastaldo.21@ucab.edu.ve',  1, '30445698', 'Activa', '2024-08-01', 'Caracas', 'Distrito Capital', 'Urb. La Boyera, El Hatillo');

--TELEFONO
INSERT INTO Telefono VALUES ('30411315', '0414-555-1315');
INSERT INTO Telefono VALUES ('27890123', '0424-555-0123');
INSERT INTO Telefono VALUES ('14567890', '0212-555-7890');
INSERT INTO Telefono VALUES ('17890234', '0212-555-0234');
INSERT INTO Telefono VALUES ('30445698', '0414-555-45698');

--PERIODOS DE VINCULACION
INSERT INTO Periodo_Vinculacion VALUES ('30411315', '2023-01-16', NULL);
INSERT INTO Periodo_Vinculacion VALUES ('27890123', '2019-01-14', '2024-07-30');
INSERT INTO Periodo_Vinculacion VALUES ('14567890', '2018-03-01', NULL);
INSERT INTO Periodo_Vinculacion VALUES ('17890234', '2015-06-01', NULL);
INSERT INTO Periodo_Vinculacion VALUES ('30445698', '2024-07-30', '2024-08-10');

--ROL
INSERT INTO Estudiante    VALUES ('30411315', '2023-01-16', 'Ingeniería en Informática', 162, 18.45, 'Ingeniería', 8);
INSERT INTO Becario       VALUES ('30411315', '2023-01-16', 'Excelencia', 'Activa', 18.45);
INSERT INTO Preparador    VALUES ('30411315', '2023-01-16', 'Sistemas Digitales I', 60);
INSERT INTO Egresado      VALUES ('27890123', '2019-01-14', 'Ingeniero en Informática', 16.80, 2024);
INSERT INTO Egresado VALUES ('30445698', '2024-07-30', 'Comunicador Social', 18.80, 2024);
INSERT INTO Profesor      VALUES ('14567890', '2018-03-01', 'Asistente', 18, 'INV-2019-047');
INSERT INTO Personal_Administrativo VALUES ('17890234', '2015-06-01', 'Coordinador Académico', 40, 'Dirección Académica');

--ENTIDAD PRESTADORA
INSERT INTO Entidad_Prestadora VALUES ('TechNova Solutions');
INSERT INTO Entidad_Prestadora VALUES ('Creative Pulse Agency');

--ENTIDAD EXTERNA
INSERT INTO Entidad_Externa VALUES (
  'J-123456789',
  'TechNova Solutions',
  '2027-12-31',
  'Carlos Méndez',
  'rrhh@technova.com',
  'TechNova Solutions'
);
INSERT INTO Entidad_Externa VALUES (
  'J-456789012',
  'Creative Pulse Agency',
  '2027-06-30',
  'María López',
  'jobs@creativepulse.com',
  'Creative Pulse Agency'
);

--VACANTE LABORAL
INSERT INTO Vacante_Laboral VALUES (
  'JOB-001',
  '2026-06-01',
  'Desarrollador Junior Full-Stack',
  'Disponible',
  'Desarrollo de plataformas web para clientes del sector financiero.',
  'Ingeniero en Informática, 0-2 años de experiencia, promedio mayor a 14',
  'Seguro médico, trabajo híbrido, capacitación continua',
  'J-123456789'
);
INSERT INTO Vacante_Laboral VALUES (
  'JOB-002',
  '2026-06-10',
  'Estratega de Contenido Digital',
  'Disponible',
  'Planificación de campañas multicanal, gestión de marca y análisis de métricas digitales para clientes del sector tecnológico.',
  'Comunicación Social, Publicidad o carreras afines, manejo de redes sociales y herramientas de analítica, promedio mayor a 13',
  'Seguro médico, trabajo 100% remoto, bonificación por resultados trimestrales',
  'J-456789012'
);

-- ENTIDAD PRESTADORA
INSERT INTO Entidad_Prestadora VALUES ('Dirección de Salud UCAB');
INSERT INTO Entidad_Prestadora VALUES ('Decanato de Investigación y Desarrollo');
INSERT INTO Entidad_Prestadora VALUES ('Centro Cultural UCAB');
INSERT INTO Entidad_Prestadora VALUES ('Dirección de Deportes UCAB');

INSERT INTO Entidad_Interna VALUES ('PRES-SAL-001', 'Dra. Mariela Fernández',   'Dirección de Salud UCAB');
INSERT INTO Entidad_Interna VALUES ('PRES-INV-002', 'Dr. Andrés Montoya',       'Decanato de Investigación y Desarrollo');
INSERT INTO Entidad_Interna VALUES ('PRES-CUL-003', 'Lic. Gabriela Ortiz',      'Centro Cultural UCAB');
INSERT INTO Entidad_Interna VALUES ('PRES-DEP-004', 'Prof. Ricardo Salazar',    'Dirección de Deportes UCAB');

-- CATEGORIA SERVICIO
INSERT INTO Categoria_Servicio VALUES ('CAT-SAL', 'Salud',      'Servicios de Salud');
INSERT INTO Categoria_Servicio VALUES ('CAT-EDU', 'Educacion',  'Educación Continua');
INSERT INTO Categoria_Servicio VALUES ('CAT-CUL', 'Cultura',    'Arte y Cultura');
INSERT INTO Categoria_Servicio VALUES ('CAT-DEP', 'Deporte',    'Servicios Deportivos');

-- REGULA
-- Montalbán (sede 1)
INSERT INTO Regula VALUES (1, 'CAT-SAL', 80.00,  5.00,  'Edificio de Salud, Montalbán');
INSERT INTO Regula VALUES (1, 'CAT-EDU', 250.00, 10.00, 'Edificios Académicos, Montalbán');
INSERT INTO Regula VALUES (1, 'CAT-CUL', 120.00, 5.00,  'Centro Cultural, Montalbán');
INSERT INTO Regula VALUES (1, 'CAT-DEP', 40.00,  3.00,  'Complejo Deportivo, Montalbán');

-- Guayana (sede 2)
INSERT INTO Regula VALUES (2, 'CAT-SAL', 60.00,  3.00,  'Unidad de Salud, Guayana');
INSERT INTO Regula VALUES (2, 'CAT-EDU', 180.00, 8.00,  'Edificios Académicos, Guayana');
INSERT INTO Regula VALUES (2, 'CAT-CUL', 80.00,  4.00,  'Auditorio, Guayana');
INSERT INTO Regula VALUES (2, 'CAT-DEP', 25.00,  2.00,  'Canchas, Guayana');


-- SERVICIO
-- Salud (sin acreditaciones requeridas — cualquiera puede solicitar)
INSERT INTO Servicio VALUES ('SVC-SAL-001', 'Consulta Médica General',          'Dirección de Salud UCAB',              'CAT-SAL');
-- Salud (requiere carnet UCAB)
INSERT INTO Servicio VALUES ('SVC-SAL-002', 'Atención Odontológica',            'Dirección de Salud UCAB',              'CAT-SAL');

-- Educación (sin acreditaciones)
INSERT INTO Servicio VALUES ('SVC-EDU-001', 'Taller de Programación en Python', 'Decanato de Investigación y Desarrollo', 'CAT-EDU');
-- Educación (requiere carnet)
INSERT INTO Servicio VALUES ('SVC-EDU-002', 'Laboratorio de Idiomas',           'Decanato de Investigación y Desarrollo', 'CAT-EDU');

-- Cultura (requiere solvencia + carnet)
INSERT INTO Servicio VALUES ('SVC-CUL-001', 'Reserva del Aula Magna',           'Centro Cultural UCAB',                 'CAT-CUL');
-- Cultura (requiere solo carnet)
INSERT INTO Servicio VALUES ('SVC-CUL-002', 'Sala de Conferencias 202',         'Centro Cultural UCAB',                 'CAT-CUL');

-- Deporte (sin acreditaciones)
INSERT INTO Servicio VALUES ('SVC-DEP-001', 'Cancha de Tenis',                  'Dirección de Deportes UCAB',           'CAT-DEP');
-- Deporte (requiere certificado médico)
INSERT INTO Servicio VALUES ('SVC-DEP-002', 'Piscina Olímpica',                 'Dirección de Deportes UCAB',           'CAT-DEP');


-- REQUISITOS ACCESO
INSERT INTO Requisitos_Acceso VALUES ('SVC-SAL-001', 'Cédula de identidad vigente');
INSERT INTO Requisitos_Acceso VALUES ('SVC-SAL-002', 'Cédula de identidad vigente');
INSERT INTO Requisitos_Acceso VALUES ('SVC-SAL-002', 'Historial médico previo si aplica');
INSERT INTO Requisitos_Acceso VALUES ('SVC-CUL-001', 'Solicitud formal con 72 horas de anticipación');
INSERT INTO Requisitos_Acceso VALUES ('SVC-CUL-001', 'Carta aval de la unidad solicitante');
INSERT INTO Requisitos_Acceso VALUES ('SVC-DEP-002', 'No padecer enfermedades cardiovasculares');
INSERT INTO Requisitos_Acceso VALUES ('SVC-DEP-002', 'Saber nadar');


-- ACREDITACIONES
INSERT INTO Acreditacion VALUES ('ACRED-001', 'Solvencia Financiera',     'Constancia emitida por Caja que certifica no tener deudas pendientes con la universidad');
INSERT INTO Acreditacion VALUES ('ACRED-002', 'Carnet UCAB Vigente',       'Carnet universitario activo del período académico en curso');
INSERT INTO Acreditacion VALUES ('ACRED-003', 'Certificado Médico Anual', 'Certificado emitido por médico colegiado con vigencia de 12 meses');
INSERT INTO Acreditacion VALUES ('ACRED-004', 'Seguro Estudiantil Activo','Póliza de seguro estudiantil en vigor');

-- REQUIERE
-- SVC-SAL-002 (Odontología) exige carnet UCAB
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-SAL-002');

-- SVC-EDU-002 (Lab. Idiomas) exige carnet UCAB
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-EDU-002');

-- SVC-CUL-001 (Aula Magna) exige solvencia Y carnet
INSERT INTO Requiere VALUES ('ACRED-001', 'SVC-CUL-001');
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-CUL-001');

-- SVC-CUL-002 (Sala 202) exige carnet UCAB
INSERT INTO Requiere VALUES ('ACRED-002', 'SVC-CUL-002');

-- SVC-DEP-002 (Piscina) exige certificado médico
INSERT INTO Requiere VALUES ('ACRED-003', 'SVC-DEP-002');

-- ============================================================
-- CUMPLE: acreditaciones que posee cada miembro
-- Escenarios de prueba:
--   Paola (30411315)  → tiene ACRED-002 → puede solicitar SVC-SAL-002, SVC-EDU-002, SVC-CUL-002
--                        NO tiene ACRED-001 → no puede solicitar SVC-CUL-001
--                        NO tiene ACRED-003 → no puede solicitar SVC-DEP-002
--   Carlos (14567890) → tiene ACRED-001 + ACRED-002 + ACRED-003 → puede solicitar todo
--   Luis (17890234)   → tiene ACRED-001 + ACRED-002 → no puede solicitar SVC-DEP-002
--   Ana (27890123)    → tiene ACRED-002 → igual que Paola
-- ============================================================

-- Paola: solo carnet UCAB
INSERT INTO Cumple VALUES ('30411315', 'ACRED-002', '2027-01-16', '2026-01-16', 'Vigente');

-- Carlos (profesor): solvencia + carnet + certificado médico
INSERT INTO Cumple VALUES ('14567890', 'ACRED-001', '2027-03-01', '2026-03-01', 'Vigente');
INSERT INTO Cumple VALUES ('14567890', 'ACRED-002', '2027-03-01', '2026-03-01', 'Vigente');
INSERT INTO Cumple VALUES ('14567890', 'ACRED-003', '2027-01-15', '2026-01-15', 'Vigente');

-- Luis (admin): solvencia + carnet
INSERT INTO Cumple VALUES ('17890234', 'ACRED-001', '2027-06-01', '2026-06-01', 'Vigente');
INSERT INTO Cumple VALUES ('17890234', 'ACRED-002', '2027-06-01', '2026-06-01', 'Vigente');

-- Ana (egresada): carnet (ya vencido — prueba de acreditación expirada)
INSERT INTO Cumple VALUES ('27890123', 'ACRED-002', '2025-07-30', '2024-07-30', 'Vencida');

-- ============================================================
-- SOLICITUDES DE SERVICIO
-- SOL-TEST-001: Paola pide Cancha de Tenis (sin req.) → Pendiente
-- SOL-TEST-002: Carlos pide Aula Magna (tiene todas) → En Proceso (1 paso completado, 1 pendiente)
-- SOL-TEST-003: Paola pide Odontología (tiene carné) → Completada
-- SOL-TEST-004: Luis pide Taller Python (sin req.)  → Pendiente
-- ============================================================

INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-001', NULL,                  'Pendiente',   '2026-06-18', '30411315', 'SVC-DEP-001');
INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-002', NULL,                  'En Proceso',  '2026-06-10', '14567890', 'SVC-CUL-001');
INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-003', 'Atención completada', 'Completada',  '2026-06-05', '30411315', 'SVC-SAL-002');
INSERT INTO Solicitud_Servicio VALUES ('SOL-TEST-004', NULL,                  'Pendiente',   '2026-06-19', '17890234', 'SVC-EDU-001');

-- PASO ACTIVIDAD

-- SOL-TEST-001: un paso pendiente
INSERT INTO Paso_Actividad VALUES (
  'PASO-T001-01', '2026-06-18 09:00:00', 'Dirección de Deportes UCAB',
  NULL, 'Pendiente', 'SOL-TEST-001'
);

-- SOL-TEST-002: primer paso completado, segundo pendiente
INSERT INTO Paso_Actividad VALUES (
  'PASO-T002-01', '2026-06-10 10:00:00', 'Centro Cultural UCAB',
  '2026-06-12 14:30:00', 'Completado', 'SOL-TEST-002'
);
INSERT INTO Paso_Actividad VALUES (
  'PASO-T002-02', '2026-06-12 14:30:00', 'Coordinación Académica',
  NULL, 'Pendiente', 'SOL-TEST-002'
);

-- SOL-TEST-003: paso único completado
INSERT INTO Paso_Actividad VALUES (
  'PASO-T003-01', '2026-06-05 08:00:00', 'Dirección de Salud UCAB',
  '2026-06-05 09:45:00', 'Completado', 'SOL-TEST-003'
);

-- SOL-TEST-004: un paso pendiente
INSERT INTO Paso_Actividad VALUES (
  'PASO-T004-01', '2026-06-19 11:00:00', 'Decanato de Investigación y Desarrollo',
  NULL, 'Pendiente', 'SOL-TEST-004'
);


-- ACOMPAÑANTE
INSERT INTO Acompanante VALUES ('SOL-TEST-002', '22334455', 'María Elena Rodríguez');
INSERT INTO Acompanante VALUES ('SOL-TEST-002', '11223344', 'Pedro José Gómez');