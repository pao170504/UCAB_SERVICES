CREATE TABLE Persona (
  Cedula VARCHAR(20) PRIMARY KEY,
  Sexo CHAR(1) NOT NULL CHECK (Sexo IN ('M', 'F')),
  Fecha_Nacimiento DATE NOT NULL,
  Primer_Nombre VARCHAR(50) NOT NULL,
  Segundo_Nombre VARCHAR(50),
  Primer_Apellido VARCHAR(50) NOT NULL,
  Segundo_Apellido VARCHAR(50) NOT NULL
);

CREATE TABLE Miembro_Comunidad (
  Cedula VARCHAR(20) PRIMARY KEY,
  Correo_Institucional VARCHAR(100) NOT NULL CHECK (Correo_Institucional LIKE '%@ucab%'),
  Estado_de_Cuenta VARCHAR(20) NOT NULL CHECK (Estado_de_Cuenta IN ('Activa', 'Suspendida', 'Bloqueada')),
  Fecha_Cambio_Clave DATE NOT NULL,
  Ciudad VARCHAR(50),
  Estado VARCHAR(50),
  Calle VARCHAR(100),
  FOREIGN KEY (Cedula) REFERENCES Persona(Cedula) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Telefono (
  Cedula VARCHAR(20),
  NumeroTelefono VARCHAR(20),
  PRIMARY KEY (Cedula, NumeroTelefono),
  FOREIGN KEY (Cedula) REFERENCES Persona(Cedula) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Beneficiario (
  Cedula VARCHAR(20) PRIMARY KEY,
  Parentesco VARCHAR(50) NOT NULL,
  Cedula_Miembro VARCHAR(20) NOT NULL,
  FOREIGN KEY (Cedula) REFERENCES Persona(Cedula) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (Cedula_Miembro) REFERENCES Miembro_Comunidad(Cedula) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Carga_Mayor (
  Cedula VARCHAR(20) PRIMARY KEY,
  Constancia_Estudio_Universitario VARCHAR(255) NOT NULL,
  Soltero CHAR(1) NOT NULL CHECK (Soltero IN ('S', 'N')),
  FOREIGN KEY (Cedula) REFERENCES Beneficiario(Cedula) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Carga_Menor (
  Cedula VARCHAR(20) PRIMARY KEY,
  Centro_Educacion_Inicial VARCHAR(100),
  FOREIGN KEY (Cedula) REFERENCES Beneficiario(Cedula) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Vacunacion (
  Cedula VARCHAR(20),
  Vacuna VARCHAR(100),
  PRIMARY KEY (Cedula, Vacuna),
  FOREIGN KEY (Cedula) REFERENCES Beneficiario(Cedula) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Sesion (
  Cedula VARCHAR(20),
  UUID VARCHAR(36),
  Fecha_Hora_Acceso TIMESTAMP,
  Direccion_IP VARCHAR(45) NOT NULL,
  Intentos_Fallidos INT NOT NULL CHECK (Intentos_Fallidos >= 0),
  Latitud REAL CHECK (Latitud >= -90.0 AND Latitud <= 90.0),
  Longitud REAL CHECK (Longitud >= -180.0 AND Longitud <= 180.0),
  PRIMARY KEY (Cedula, UUID, Fecha_Hora_Acceso),
  FOREIGN KEY (Cedula) REFERENCES Miembro_Comunidad(Cedula) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Periodo_Vinculacion (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  Fecha_Fin DATE,
  PRIMARY KEY (Cedula, Fecha_Inicio),
  FOREIGN KEY (Cedula) REFERENCES Miembro_Comunidad(Cedula) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (Fecha_Fin IS NULL OR Fecha_Fin > Fecha_Inicio)
);

CREATE TABLE Estudiante (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  Escuela VARCHAR(100) NOT NULL,
  UC_Aprobadas INT NOT NULL CHECK (UC_Aprobadas >= 0),
  Promedio REAL NOT NULL CHECK (Promedio >= 0.0 AND Promedio <= 20.0),
  Facultad VARCHAR(100) NOT NULL,
  Semestre INT NOT NULL CHECK (Semestre >= 1),
  PRIMARY KEY (Cedula, Fecha_Inicio),
  FOREIGN KEY (Cedula, Fecha_Inicio) REFERENCES Periodo_Vinculacion(Cedula, Fecha_Inicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Becario (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  Tipo_Beca VARCHAR(30) NOT NULL CHECK (Tipo_Beca IN ('Ayuda Economica', 'Excelencia', 'Comedor')),
  Estatus VARCHAR(20) NOT NULL,
  Indice REAL NOT NULL CHECK (Indice >= 0.0 AND Indice <= 20.0),
  PRIMARY KEY (Cedula, Fecha_Inicio),
  FOREIGN KEY (Cedula, Fecha_Inicio) REFERENCES Estudiante(Cedula, Fecha_Inicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Preparador (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  Asignatura VARCHAR(100) NOT NULL,
  Horas INT NOT NULL CHECK (Horas > 0),
  PRIMARY KEY (Cedula, Fecha_Inicio),
  FOREIGN KEY (Cedula, Fecha_Inicio) REFERENCES Estudiante(Cedula, Fecha_Inicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Personal_Administrativo (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  Cargo VARCHAR(100) NOT NULL,
  Horas_Semanales INT NOT NULL CHECK (Horas_Semanales > 0),
  Unidad_Adscripcion VARCHAR(100) NOT NULL,
  PRIMARY KEY (Cedula, Fecha_Inicio),
  FOREIGN KEY (Cedula, Fecha_Inicio) REFERENCES Periodo_Vinculacion(Cedula, Fecha_Inicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Profesor (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  Escalafon VARCHAR(50) NOT NULL,
  Carga_Horaria INT NOT NULL CHECK (Carga_Horaria >= 0),
  Codigo_Investigador VARCHAR(50),
  PRIMARY KEY (Cedula, Fecha_Inicio),
  FOREIGN KEY (Cedula, Fecha_Inicio) REFERENCES Periodo_Vinculacion(Cedula, Fecha_Inicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Egresado (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  Titulo VARCHAR(100) NOT NULL,
  Indice_Academico REAL NOT NULL CHECK (Indice_Academico >= 0.0 AND Indice_Academico <= 20.0),
  Ano_Graduacion INT NOT NULL CHECK (Ano_Graduacion >= 1950),
  PRIMARY KEY (Cedula, Fecha_Inicio),
  FOREIGN KEY (Cedula, Fecha_Inicio) REFERENCES Periodo_Vinculacion(Cedula, Fecha_Inicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Entidad_Prestadora (
  Nombre_Entidad VARCHAR(100) PRIMARY KEY
);

CREATE TABLE Entidad_Interna (
  Codigo_Presupuestario VARCHAR(50) PRIMARY KEY,
  Director VARCHAR(100) NOT NULL,
  Nombre_Entidad VARCHAR(100) NOT NULL,
  FOREIGN KEY (Nombre_Entidad) REFERENCES Entidad_Prestadora(Nombre_Entidad) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Entidad_Externa (
  RIF VARCHAR(20) PRIMARY KEY,
  Razon_Social VARCHAR(100) NOT NULL,
  Fecha_Fin_Contrato DATE NOT NULL,
  Contacto_Nombre VARCHAR(100) NOT NULL,
  Contacto_Correo VARCHAR(100) NOT NULL,
  Nombre_Entidad VARCHAR(100) NOT NULL,
  FOREIGN KEY (Nombre_Entidad) REFERENCES Entidad_Prestadora(Nombre_Entidad) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Telefono_Contacto_Externo (
  RIF VARCHAR(20),
  Telefono VARCHAR(20),
  PRIMARY KEY (RIF, Telefono),
  FOREIGN KEY (RIF) REFERENCES Entidad_Externa(RIF) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Vacante_Laboral (
  ID_Vacante VARCHAR(50) PRIMARY KEY,
  Fecha_Oferta DATE NOT NULL,
  Cargo VARCHAR(100) NOT NULL,
  Estatus VARCHAR(20) NOT NULL CHECK (Estatus IN ('Disponible', 'Finalizada')),
  Responsabilidades VARCHAR(500) NOT NULL,
  Perfil_Buscado VARCHAR(500) NOT NULL,
  Beneficios VARCHAR(500),
  RIF VARCHAR(20) NOT NULL,
  FOREIGN KEY (RIF) REFERENCES Entidad_Externa(RIF) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Postula (
  Cedula VARCHAR(20),
  Fecha_Inicio DATE,
  ID_Vacante VARCHAR(50),
  Fecha_Postulacion DATE NOT NULL,
  Estatus VARCHAR(20) NOT NULL,
  PRIMARY KEY (Cedula, Fecha_Inicio, ID_Vacante),
  FOREIGN KEY (Cedula, Fecha_Inicio) REFERENCES Egresado(Cedula, Fecha_Inicio) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Vacante) REFERENCES Vacante_Laboral(ID_Vacante) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Acreditacion (
  ID_Acreditacion VARCHAR(50) PRIMARY KEY,
  Tipo VARCHAR(50) NOT NULL,
  Descripcion VARCHAR(255)
);

CREATE TABLE Cumple (
  Cedula VARCHAR(20),
  ID_Acreditacion VARCHAR(50),
  Fecha_Vencimiento DATE,
  Obtencion DATE NOT NULL,
  Estado VARCHAR(20) NOT NULL,
  PRIMARY KEY (Cedula, ID_Acreditacion),
  FOREIGN KEY (Cedula) REFERENCES Miembro_Comunidad(Cedula) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Acreditacion) REFERENCES Acreditacion(ID_Acreditacion) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (Fecha_Vencimiento IS NULL OR Fecha_Vencimiento > Obtencion)
);

CREATE TABLE Categoria_Servicio (
  ID_Categoria VARCHAR(50) PRIMARY KEY,
  Categoria VARCHAR(50) NOT NULL,
  Nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Servicio (
  ID_Servicio VARCHAR(50) PRIMARY KEY,
  Descripcion VARCHAR(255) NOT NULL,
  Nombre_Entidad VARCHAR(100) NOT NULL,
  ID_Categoria VARCHAR(50) NOT NULL,
  FOREIGN KEY (Nombre_Entidad) REFERENCES Entidad_Prestadora(Nombre_Entidad) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Categoria) REFERENCES Categoria_Servicio(ID_Categoria) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Requisitos_Acceso (
  ID_Servicio VARCHAR(50),
  Requisito VARCHAR(255),
  PRIMARY KEY (ID_Servicio, Requisito),
  FOREIGN KEY (ID_Servicio) REFERENCES Servicio(ID_Servicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Requiere (
  ID_Acreditacion VARCHAR(50),
  ID_Servicio VARCHAR(50),
  PRIMARY KEY (ID_Acreditacion, ID_Servicio),
  FOREIGN KEY (ID_Acreditacion) REFERENCES Acreditacion(ID_Acreditacion) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Servicio) REFERENCES Servicio(ID_Servicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Solicitud_Servicio (
  ID_Solicitud VARCHAR(50) PRIMARY KEY,
  Resolucion VARCHAR(255),
  Estado VARCHAR(30) NOT NULL,
  Fecha_Apertura DATE NOT NULL,
  Cedula VARCHAR(20) NOT NULL,
  ID_Servicio VARCHAR(50) NOT NULL,
  FOREIGN KEY (Cedula) REFERENCES Miembro_Comunidad(Cedula) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Servicio) REFERENCES Servicio(ID_Servicio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Acompañante (
  ID_Solicitud VARCHAR(50),
  Documento VARCHAR(20),
  Nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (ID_Solicitud, Documento),
  FOREIGN KEY (ID_Solicitud) REFERENCES Solicitud_Servicio(ID_Solicitud) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Folio_Consumo (
  ID_Folio VARCHAR(50) PRIMARY KEY,
  Estado VARCHAR(20) NOT NULL CHECK (Estado IN ('Abierto', 'Cerrado')),
  ID_Solicitud VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Solicitud) REFERENCES Solicitud_Servicio(ID_Solicitud) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Item_Consumo (
  ID_Folio VARCHAR(50),
  Numero INT,
  Impuesto REAL NOT NULL CHECK (Impuesto >= 0.0),
  Cantidad INT NOT NULL CHECK (Cantidad > 0),
  Concepto VARCHAR(100) NOT NULL,
  Precio REAL NOT NULL CHECK (Precio >= 0.0),
  PRIMARY KEY (ID_Folio, Numero),
  FOREIGN KEY (ID_Folio) REFERENCES Folio_Consumo(ID_Folio) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Sede (
  ID_Sede INT PRIMARY KEY,
  Nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Regula (
  ID_Sede INT,
  ID_Categoria VARCHAR(50),
  Costo_Max REAL NOT NULL CHECK (Costo_Max >= 0.0),
  Costo_Min REAL NOT NULL CHECK (Costo_Min >= 0.0),
  Ubicación VARCHAR(100) NOT NULL,
  PRIMARY KEY (ID_Sede, ID_Categoria),
  FOREIGN KEY (ID_Sede) REFERENCES Sede(ID_Sede) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Categoria) REFERENCES Categoria_Servicio(ID_Categoria) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (Costo_Max >= Costo_Min)
);

CREATE TABLE Edificacion (
  ID_Sede INT,
  Nombre_Edificacion VARCHAR(100),
  Direccion VARCHAR(255) NOT NULL,
  PRIMARY KEY (ID_Sede, Nombre_Edificacion),
  FOREIGN KEY (ID_Sede) REFERENCES Sede(ID_Sede) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Espacio_Fisico (
  ID_Sede INT,
  Nombre_Edificacion VARCHAR(100),
  Numero_Espacio INT,
  Tipo_Espacio VARCHAR(50) NOT NULL,
  Capacidad_Max INT NOT NULL CHECK (Capacidad_Max > 0),
  Tipo_Mobiliario VARCHAR(100),
  Disponibilidad VARCHAR(20) NOT NULL,
  Estado VARCHAR(30) NOT NULL,
  PRIMARY KEY (ID_Sede, Nombre_Edificacion, Numero_Espacio),
  FOREIGN KEY (ID_Sede, Nombre_Edificacion) REFERENCES Edificacion(ID_Sede, Nombre_Edificacion) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Paso_Actividad (
  ID_Paso VARCHAR(50) PRIMARY KEY,
  Fecha_Inicio TIMESTAMP NOT NULL,
  Responsable VARCHAR(100) NOT NULL,
  Fecha_Completada TIMESTAMP,
  Estado_Paso VARCHAR(30) NOT NULL,
  ID_Solicitud VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Solicitud) REFERENCES Solicitud_Servicio(ID_Solicitud) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (Fecha_Completada IS NULL OR Fecha_Completada >= Fecha_Inicio)
);

CREATE TABLE Reserva (
  ID_Sede INT,
  Nombre_Edificacion VARCHAR(100),
  Numero_Espacio INT,
  Bloque_Horario VARCHAR(50),
  Fecha_Uso DATE,
  ID_Paso VARCHAR(50) NOT NULL,
  ID_Solicitud VARCHAR(50) NOT NULL,
  PRIMARY KEY (ID_Sede, Nombre_Edificacion, Numero_Espacio, Fecha_Uso, Bloque_Horario),
  FOREIGN KEY (ID_Sede, Nombre_Edificacion, Numero_Espacio) REFERENCES Espacio_Fisico(ID_Sede, Nombre_Edificacion, Numero_Espacio) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Paso) REFERENCES Paso_Actividad(ID_Paso) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Solicitud) REFERENCES Solicitud_Servicio(ID_Solicitud) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Zona_Estacionamiento (
  ID_Zona VARCHAR(50) PRIMARY KEY,
  Nombre VARCHAR(100) NOT NULL,
  Capacidad INT NOT NULL CHECK (Capacidad >= 0),
  ID_Sede INT NOT NULL,
  FOREIGN KEY (ID_Sede) REFERENCES Sede(ID_Sede) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Puesto (
  ID_Zona VARCHAR(50),
  Numero_Puesto INT,
  Tipo_Vehiculo VARCHAR(30) NOT NULL CHECK (Tipo_Vehiculo IN ('Carro', 'Moto', 'Carga', 'Preferencial')),
  Estado VARCHAR(30) NOT NULL CHECK (Estado IN ('Libre', 'Ocupado', 'Reservado', 'Mantenimiento')),
  PRIMARY KEY (ID_Zona, Numero_Puesto),
  FOREIGN KEY (ID_Zona) REFERENCES Zona_Estacionamiento(ID_Zona) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Registro_Acceso (
  ID_Acceso VARCHAR(50) PRIMARY KEY,
  ID_Zona VARCHAR(50) NOT NULL,
  Numero_Puesto INT NOT NULL,
  Placa VARCHAR(15) NOT NULL,
  Fecha_Entrada TIMESTAMP NOT NULL,
  Fecha_Salida TIMESTAMP,
  Estatus VARCHAR(20) NOT NULL,
  ID_Folio VARCHAR(50),
  Numero INT,
  FOREIGN KEY (ID_Zona, Numero_Puesto) REFERENCES Puesto(ID_Zona, Numero_Puesto) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ID_Folio, Numero) REFERENCES Item_Consumo(ID_Folio, Numero) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Tercero_Corporativo (
  RIF VARCHAR(20) PRIMARY KEY,
  Razon_Social VARCHAR(100) NOT NULL
);

CREATE TABLE Factura (
  ID_Factura VARCHAR(50) PRIMARY KEY,
  Emisión DATE NOT NULL,
  Monto REAL NOT NULL CHECK (Monto >= 0.0),
  ID_Folio VARCHAR(50) NOT NULL,
  RIF VARCHAR(20),
  FOREIGN KEY (ID_Folio) REFERENCES Folio_Consumo(ID_Folio) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (RIF) REFERENCES Tercero_Corporativo(RIF) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Tasa (
  Fecha_Tasa DATE PRIMARY KEY,
  EUR REAL NOT NULL CHECK (EUR > 0.0),
  USD REAL NOT NULL CHECK (USD > 0.0)
);

CREATE TABLE Pago (
  ID_Pago VARCHAR(50) PRIMARY KEY,
  Monto REAL NOT NULL CHECK (Monto > 0.0),
  Fecha_Pago DATE NOT NULL,
  ID_Factura VARCHAR(50) NOT NULL,
  Fecha_Tasa DATE,
  FOREIGN KEY (ID_Factura) REFERENCES Factura(ID_Factura) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (Fecha_Tasa) REFERENCES Tasa(Fecha_Tasa) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE TAI (
  ID_Pago VARCHAR(50) PRIMARY KEY,
  UUID VARCHAR(36) NOT NULL,
  POS VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Pago) REFERENCES Pago(ID_Pago) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Efectivo (
  ID_Pago VARCHAR(50) PRIMARY KEY,
  Moneda VARCHAR(20) NOT NULL,
  Monto REAL NOT NULL CHECK (Monto > 0.0),
  FOREIGN KEY (ID_Pago) REFERENCES Pago(ID_Pago) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Pago_Movil (
  ID_Pago VARCHAR(50) PRIMARY KEY,
  Telefono VARCHAR(20) NOT NULL,
  Referencia VARCHAR(50) NOT NULL,
  Banco VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Pago) REFERENCES Pago(ID_Pago) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Tarjeta (
  ID_Pago VARCHAR(50) PRIMARY KEY,
  Número VARCHAR(20) NOT NULL,
  Tipo_Red VARCHAR(20) NOT NULL,
  Emisora VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Pago) REFERENCES Pago(ID_Pago) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Cripto (
  ID_Pago VARCHAR(50) PRIMARY KEY,
  TXID VARCHAR(100) NOT NULL,
  Billetera VARCHAR(100) NOT NULL,
  Red VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Pago) REFERENCES Pago(ID_Pago) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Zelle (
  ID_Pago VARCHAR(50) PRIMARY KEY,
  Nombre_Titular VARCHAR(100) NOT NULL,
  Correo VARCHAR(100) NOT NULL,
  Confirmación VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Pago) REFERENCES Pago(ID_Pago) ON DELETE CASCADE ON UPDATE CASCADE
);
