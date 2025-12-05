-- Base de datos para Sistema de Gestión de Horarios Académicos
DROP DATABASE IF EXISTS railway;
CREATE DATABASE IF NOT EXISTS railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railway;

-- Tabla de docentes
CREATE TABLE IF NOT EXISTS docente
(
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(150)        NOT NULL,
    apellido       VARCHAR(150)        NOT NULL,
    isAccount      BOOLEAN DEFAULT FALSE,
    telefono       VARCHAR(20),
    rfc            VARCHAR(13) UNIQUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo         BOOLEAN   DEFAULT TRUE,
    turno ENUM('medio', 'completo') DEFAULT 'medio',
    horas_min_semana INT NOT NULL DEFAULT 18,
    horas_max_semana INT NOT NULL DEFAULT 20,
    INDEX idx_rfc (rfc)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabla de Usuarios (Docentes, Administrativos)
CREATE TABLE IF NOT EXISTS usuarios
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(150)       NOT NULL,
    password        VARCHAR(150)       NOT NULL,
    rol             VARCHAR(150)       NOT NULL,
    activo          BOOLEAN   DEFAULT TRUE,
    fecha_creacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    docente_id      INT,
    FOREIGN KEY (docente_id) REFERENCES docente (id) ON DELETE CASCADE,
    INDEX idx_docente (docente_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabla de carreras
CREATE TABLE IF NOT EXISTS carreras
(
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(150)       NOT NULL,
    codigo             VARCHAR(20) UNIQUE NOT NULL,
    descripcion        TEXT,
    duracion_semestres INT                NOT NULL,
    activo             BOOLEAN   DEFAULT TRUE,
    fecha_creacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabla de materias/asignaturas
CREATE TABLE IF NOT EXISTS materias
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150)       NOT NULL,
    codigo          VARCHAR(20) UNIQUE NOT NULL,
    carrera_id      INT                NOT NULL,
    semestre        INT                NOT NULL,
    creditos        INT                NOT NULL,
    descripcion     TEXT,
    activo          BOOLEAN   DEFAULT TRUE,
    alumnos_inscriptos      BOOLEAN   DEFAULT FALSE,
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrera_id) REFERENCES carreras (id) ON DELETE CASCADE,
    INDEX idx_carrera (carrera_id),
    INDEX idx_semestre (semestre)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabla de aulas
CREATE TABLE IF NOT EXISTS aulas
(
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    edificio       VARCHAR(100),
    capacidad      INT          NOT NULL,
    tipo           ENUM(
        'teorica',
        'laboratorio',
        'auditorio',
        'taller',
        'computacion',
        'software'
        ) DEFAULT 'teorica',
    activo         BOOLEAN                                                DEFAULT TRUE,
    fecha_creacion TIMESTAMP                                              DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabla de grupos
CREATE TABLE IF NOT EXISTS grupos
(
    id                INT AUTO_INCREMENT PRIMARY KEY,
    materia_id        INT         NOT NULL,
    profesor_id       INT         NULL,
    nombre            VARCHAR(50) NOT NULL,
    cupo_maximo       INT         NOT NULL,
    alumnos_inscriptos INT         NOT NULL,
    semestre_actual   VARCHAR(20) NOT NULL,
    periodo_academico VARCHAR(50) NOT NULL,
    activo            BOOLEAN   DEFAULT TRUE,
    fecha_creacion    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE,
    FOREIGN KEY (profesor_id) REFERENCES docente (id) ON DELETE SET NULL,
    INDEX idx_materia (materia_id),
    INDEX idx_profesor (profesor_id),
    INDEX idx_periodo (periodo_academico)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabla de horarios
CREATE TABLE IF NOT EXISTS horarios
(
    id             INT AUTO_INCREMENT PRIMARY KEY,
    grupo_id       INT                                                                  NOT NULL,
    aula_id        INT                                                                  NOT NULL,
    dia_semana     ENUM ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')           NOT NULL,
    hora_inicio    TIME                                                                 NOT NULL,
    hora_fin       TIME                                                                 NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos (id) ON DELETE CASCADE,
    FOREIGN KEY (aula_id) REFERENCES aulas (id) ON DELETE CASCADE,
    INDEX idx_grupo (grupo_id),
    INDEX idx_aula (aula_id),
    INDEX idx_dia (dia_semana)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


--  Tabla intermedia para asignar materias a docentes
CREATE TABLE IF NOT EXISTS docente_materias
(
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    docente_id         INT NOT NULL,
    materia_id         INT NOT NULL,
    fecha_asignacion   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_docente_materia (docente_id, materia_id),
    FOREIGN KEY (docente_id) REFERENCES docente (id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE,
    INDEX idx_dm_docente (docente_id),
    INDEX idx_dm_materia (materia_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Insertar datos de ejemplo
INSERT INTO carreras (nombre, codigo, descripcion, duracion_semestres)
VALUES
    ('Ingeniería en Sistemas Computacionales', 'ISC', 'Carrera enfocada en el desarrollo de software y sistemas', 9);

INSERT INTO docente (nombre, apellido, rfc, telefono, turno, horas_min_semana, horas_max_semana)
VALUES ('Juan',  'Pérez García',     'PEGJ850101ABC', '7471234567', 'completo', 20, 22),
       ('María', 'López Hernández',  'LOHM860202XYZ', '7471234568', 'medio',    18, 20),
       ('Carlos','González Ruiz',    'GORC870303DEF', '7471234569', 'medio',    18, 20),
       ('Ana',   'Martínez Sánchez', 'MASA880404GHI', '7471234570', 'completo', 20, 22);

INSERT INTO materias (nombre, codigo, carrera_id, semestre, creditos, descripcion)
VALUES ('Programación Orientada a Objetos', 'POO-101', 1, 3, 5,  'Fundamentos de POO con Java'),
       ('Bases de Datos', 'BD-201', 1, 4, 5,  'Diseño y gestión de bases de datos'),
       ('Estructuras de Datos', 'ED-102', 1, 3, 4,  'Algoritmos y estructuras de datos'),
       ('Desarrollo Web', 'DW-301', 1, 5, 5,  'Desarrollo de aplicaciones web');

INSERT INTO aulas (nombre, edificio, capacidad, tipo)
VALUES ('R1-01', 'R1', 30, 'computacion'),
       ('R1-02', 'R1', 30, 'computacion'),
       ('R1-03', 'R1', 30, 'teorica'),
       ('R1-04', 'R1', 30, 'computacion'),
       ('R1-05', 'R1', 30, 'software');

INSERT INTO aulas (nombre, edificio, capacidad, tipo)
VALUES ('R2-01', 'R2', 30, 'teorica'),
       ('R2-02', 'R2', 30, 'computacion'),
       ('R2-03', 'R2', 30, 'laboratorio'),
       ('R2-04', 'R2', 30, 'computacion'),
       ('R2-05', 'R2', 30, 'taller');

INSERT INTO aulas (nombre, edificio, capacidad, tipo)
VALUES ('E-01', 'E', 30, 'laboratorio'),
       ('E-02', 'E', 30, 'taller'),
       ('E-03', 'E', 30, 'auditorio'),
       ('E-04', 'E', 30, 'teorica'),
       ('E-05', 'E', 30, 'taller');

INSERT INTO aulas (nombre, edificio, capacidad, tipo)
VALUES ('P-01', 'P', 30, 'taller'),
       ('P-02', 'P', 30, 'software'),
       ('P-03', 'P', 30, 'laboratorio'),
       ('P-04', 'P', 30, 'taller'),
       ('P-05', 'P', 30, 'taller');

INSERT INTO grupos (materia_id, profesor_id, nombre, cupo_maximo,alumnos_inscriptos, semestre_actual, periodo_academico)
VALUES (1, 1, 'POO-A', 30,30, '3', 'Agosto-Diciembre 2025'),
       (2, 2, 'BD-A', 30,30, '4', 'Agosto-Diciembre 2025'),
       (3, 3, 'ED-A', 30, 30,'3', 'Agosto-Diciembre 2025');

INSERT INTO horarios (grupo_id, aula_id, dia_semana, hora_inicio, hora_fin)
VALUES (1, 1, 'Lunes', '07:00:00', '08:00:00'),
       (2, 2, 'Martes', '09:00:00', '10:00:00'),
       (2, 2, 'Jueves', '09:00:00', '10:00:00'),
       (1, 1, 'Viernes', '07:00:00', '08:00:00');


INSERT INTO docente_materias (docente_id, materia_id)
VALUES (1, 1),
       (1, 4),
       (2, 2),
       (3, 3),
       (4, 4)
ON DUPLICATE KEY UPDATE fecha_asignacion = VALUES(fecha_asignacion);

select * from grupos;
select * from materias;
select * from docente_materias;
select * from docente;
select * from usuarios;



CREATE OR REPLACE VIEW vista_horarios_completos AS
SELECT
    h.id,
    h.dia_semana,
    h.hora_inicio,
    h.hora_fin,
    g.nombre as grupo_nombre,
    g.cupo_maximo,
    g.alumnos_inscriptos,
    m.nombre as materia_nombre,
    m.codigo as materia_codigo,
    m.creditos,
    m.semestre,
    c.nombre as carrera_nombre,
    CONCAT(d.nombre, ' ', d.apellido) as profesor_nombre,
    d.turno as profesor_turno,
    d.horas_min_semana,
    d.horas_max_semana,
    a.nombre as aula_nombre,
    a.edificio as aula_edificio,
    a.tipo as aula_tipo,
    a.capacidad as aula_capacidad
FROM horarios h
         JOIN grupos g ON h.grupo_id = g.id
         JOIN materias m ON g.materia_id = m.id
         JOIN carreras c ON m.carrera_id = c.id
         LEFT JOIN docente d ON g.profesor_id = d.id
         JOIN aulas a ON h.aula_id = a.id
ORDER BY
    h.dia_semana,
    h.hora_inicio;

SELECT * FROM vista_horarios_completos;



DELIMITER $$

DROP FUNCTION IF EXISTS calcular_horas_profesor$$

CREATE FUNCTION calcular_horas_profesor(p_profesor_id INT)
    RETURNS DECIMAL(10,2)
    DETERMINISTIC
    READS SQL DATA
BEGIN
    DECLARE total_horas DECIMAL(10,2);

    SELECT COALESCE(SUM(
                            TIME_TO_SEC(TIMEDIFF(h.hora_fin, h.hora_inicio)) / 3600
                    ), 0)
    INTO total_horas
    FROM horarios h
             JOIN grupos g ON h.grupo_id = g.id
    WHERE g.profesor_id = p_profesor_id;

    RETURN total_horas;
END$$

DELIMITER ;



-- skjasajsjaskjakjskajsaks


DELIMITER $$

DROP PROCEDURE IF EXISTS verificar_conflictos_horario$$

CREATE PROCEDURE verificar_conflictos_horario(
    IN p_grupo_id INT,
    IN p_aula_id INT,
    IN p_dia_semana ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'),
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME
)
BEGIN
    -- Verificar conflicto de aula
    SELECT
        'CONFLICTO_AULA' as tipo,
        h.id,
        g.nombre as grupo,
        m.nombre as materia,
        h.hora_inicio,
        h.hora_fin
    FROM horarios h
             JOIN grupos g ON h.grupo_id = g.id
             JOIN materias m ON g.materia_id = m.id
    WHERE h.aula_id = p_aula_id
      AND h.dia_semana = p_dia_semana
      AND (
        (h.hora_inicio < p_hora_fin AND h.hora_fin > p_hora_inicio) OR
        (h.hora_inicio < p_hora_fin AND h.hora_fin > p_hora_fin) OR
        (h.hora_inicio >= p_hora_inicio AND h.hora_fin <= p_hora_fin)
        )

    UNION ALL

    -- Verificar conflicto de profesor
    SELECT
        'CONFLICTO_PROFESOR' as tipo,
        h.id,
        g.nombre as grupo,
        m.nombre as materia,
        h.hora_inicio,
        h.hora_fin
    FROM horarios h
             JOIN grupos g ON h.grupo_id = g.id
             JOIN materias m ON g.materia_id = m.id
    WHERE g.profesor_id = (SELECT profesor_id FROM grupos WHERE id = p_grupo_id)
      AND h.dia_semana = p_dia_semana
      AND h.grupo_id != p_grupo_id
      AND (
        (h.hora_inicio < p_hora_fin AND h.hora_fin > p_hora_inicio) OR
        (h.hora_inicio < p_hora_fin AND h.hora_fin > p_hora_fin) OR
        (h.hora_inicio >= p_hora_inicio AND h.hora_fin <= p_hora_fin)
        );
END$$

DELIMITER ;

CALL verificar_conflictos_horario(1, 1, 'Lunes', '09:00:00', '11:00:00');

