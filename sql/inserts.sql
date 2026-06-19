--SEDES
INSERT INTO Sede VALUES (1, 'Montalbán');

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