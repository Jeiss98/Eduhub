-- ============================================================
--  EDUHUB PLATFORM — Script de BACKUP COMPLETO (Estructura + Datos)
--  Base de Datos: PG_JP_eduhub
--  Prefijo: PG_JP (Palma · Gallego)
--  Fundación Universitaria Konrad Lorenz · 2026-1
--  Autores: Jeisson Palma · Gustavo Gallego
--  Contraseña de todos los usuarios de prueba: Test1234!
-- ============================================================

DROP DATABASE IF EXISTS PG_JP_eduhub;
CREATE DATABASE PG_JP_eduhub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE PG_JP_eduhub;

-- ============================================================
-- ESTRUCTURA
-- ============================================================

CREATE TABLE usuarios (
    id_usuario   INT           AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100)  NOT NULL,
    apellido     VARCHAR(100)  NOT NULL DEFAULT '',
    email        VARCHAR(150)  NOT NULL UNIQUE,
    documento    VARCHAR(20)   NOT NULL UNIQUE,
    password     VARCHAR(255)  NOT NULL,
    rol          ENUM('estudiante','docente','admin') NOT NULL DEFAULT 'estudiante',
    activo       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE proyectos (
    id_proyecto  INT           AUTO_INCREMENT PRIMARY KEY,
    id_docente   INT           NOT NULL,
    titulo       VARCHAR(200)  NOT NULL,
    descripcion  TEXT,
    fecha_inicio DATE          NOT NULL,
    fecha_limite DATE          NOT NULL,
    estado       ENUM('activo','pausado','finalizado') NOT NULL DEFAULT 'activo',
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_proyecto_docente
        FOREIGN KEY (id_docente) REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE proyecto_estudiantes (
    id_proyecto   INT  NOT NULL,
    id_estudiante INT  NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (id_proyecto, id_estudiante),
    CONSTRAINT fk_pe_proyecto   FOREIGN KEY (id_proyecto)   REFERENCES proyectos(id_proyecto) ON DELETE CASCADE,
    CONSTRAINT fk_pe_estudiante FOREIGN KEY (id_estudiante) REFERENCES usuarios(id_usuario)   ON DELETE CASCADE
);

CREATE TABLE tareas (
    id_tarea      INT           AUTO_INCREMENT PRIMARY KEY,
    id_proyecto   INT           NOT NULL,
    id_estudiante INT           NOT NULL,
    titulo        VARCHAR(200)  NOT NULL,
    descripcion   TEXT,
    prioridad     ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
    completada    BOOLEAN       NOT NULL DEFAULT FALSE,
    fecha_limite  DATE          NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tarea_proyecto   FOREIGN KEY (id_proyecto)   REFERENCES proyectos(id_proyecto) ON DELETE CASCADE,
    CONSTRAINT fk_tarea_estudiante FOREIGN KEY (id_estudiante) REFERENCES usuarios(id_usuario)   ON DELETE RESTRICT
);

CREATE TABLE evaluaciones (
    id_evaluacion INT            AUTO_INCREMENT PRIMARY KEY,
    id_proyecto   INT            NOT NULL,
    id_estudiante INT            NOT NULL,
    id_docente    INT            NOT NULL,
    tipo          VARCHAR(50)    NOT NULL DEFAULT 'parcial',
    titulo        VARCHAR(200)   NOT NULL,
    calificacion  DECIMAL(4,2)   CHECK (calificacion BETWEEN 0 AND 10),
    comentarios   TEXT,
    fecha         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_proyecto   FOREIGN KEY (id_proyecto)   REFERENCES proyectos(id_proyecto) ON DELETE CASCADE,
    CONSTRAINT fk_eval_estudiante FOREIGN KEY (id_estudiante) REFERENCES usuarios(id_usuario)  ON DELETE RESTRICT,
    CONSTRAINT fk_eval_docente    FOREIGN KEY (id_docente)    REFERENCES usuarios(id_usuario)   ON DELETE RESTRICT
);

CREATE TABLE reportes (
    id_reporte  INT           AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(200)  NOT NULL,
    fecha       DATE          NOT NULL DEFAULT (CURRENT_DATE),
    id_usuario  INT,
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE TABLE perfiles (
    id_perfil          INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario         INT          NOT NULL UNIQUE,
    fecha_nacimiento   DATE         NULL,
    ciudad             VARCHAR(100) NULL,
    telefono           VARCHAR(30)  NULL,
    semestre           VARCHAR(50)  NULL,
    programa           VARCHAR(150) NULL,
    es_menor           BOOLEAN      NOT NULL DEFAULT FALSE,
    contacto_nombre    VARCHAR(150) NULL,
    contacto_telefono  VARCHAR(30)  NULL,
    contacto_relacion  VARCHAR(50)  NULL,
    contacto_email     VARCHAR(150) NULL,
    avatar_url         LONGTEXT     NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE auditoria (
    id_auditoria     INT             AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada   VARCHAR(100)    NOT NULL,
    operacion        ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    id_registro      INT             NULL,
    usuario_db       VARCHAR(150)    NOT NULL DEFAULT 'sistema',
    datos_anteriores JSON            NULL,
    datos_nuevos     JSON            NULL,
    fecha_hora       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auditoria_tabla   (tabla_afectada),
    INDEX idx_auditoria_fecha   (fecha_hora),
    INDEX idx_auditoria_op      (operacion)
);

-- ============================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_registrar_usuario(
    IN  p_nombre    VARCHAR(100),
    IN  p_apellido  VARCHAR(100),
    IN  p_email     VARCHAR(150),
    IN  p_documento VARCHAR(20),
    IN  p_password  VARCHAR(255),
    IN  p_rol       VARCHAR(20),
    OUT p_resultado VARCHAR(200)
)
BEGIN
    DECLARE email_existe INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_resultado = 'ERROR: Fallo interno al registrar usuario.';
    END;
    SELECT COUNT(*) INTO email_existe FROM usuarios WHERE email = p_email;
    IF email_existe > 0 THEN
        SET p_resultado = 'ERROR: El correo ya está registrado.';
    ELSE
        INSERT INTO usuarios (nombre, apellido, email, documento, password, rol)
        VALUES (p_nombre, p_apellido, p_email, p_documento, p_password, p_rol);
        SET p_resultado = CONCAT('OK: Usuario creado con ID ', LAST_INSERT_ID());
    END IF;
END$$

CREATE PROCEDURE sp_progreso_proyecto(IN p_id_proyecto INT)
BEGIN
    DECLARE v_total       INT          DEFAULT 0;
    DECLARE v_completadas INT          DEFAULT 0;
    DECLARE v_pct         DECIMAL(5,2) DEFAULT 0.00;
    SELECT COUNT(*), IFNULL(SUM(completada),0)
    INTO v_total, v_completadas
    FROM tareas WHERE id_proyecto = p_id_proyecto;
    IF v_total > 0 THEN
        SET v_pct = ROUND((v_completadas / v_total) * 100, 2);
    END IF;
    SELECT p.titulo, p.estado, p.fecha_limite, u.nombre AS docente,
           v_total AS total_tareas, v_completadas AS completadas, v_pct AS avance_pct
    FROM proyectos p
    INNER JOIN usuarios u ON u.id_usuario = p.id_docente
    WHERE p.id_proyecto = p_id_proyecto;
END$$

CREATE PROCEDURE sp_asignar_estudiante(
    IN  p_id_proyecto INT,
    IN  p_id_usuario  INT,
    OUT p_resultado   VARCHAR(200)
)
BEGIN
    DECLARE v_es_est   INT DEFAULT 0;
    DECLARE v_activo   INT DEFAULT 0;
    DECLARE v_asignado INT DEFAULT 0;
    SELECT COUNT(*) INTO v_es_est   FROM usuarios   WHERE id_usuario = p_id_usuario AND rol = 'estudiante';
    SELECT COUNT(*) INTO v_activo   FROM proyectos  WHERE id_proyecto = p_id_proyecto AND estado = 'activo';
    SELECT COUNT(*) INTO v_asignado FROM proyecto_estudiantes WHERE id_proyecto = p_id_proyecto AND id_estudiante = p_id_usuario;
    IF v_es_est = 0 THEN
        SET p_resultado = 'ERROR: El usuario no existe o no es estudiante.';
    ELSEIF v_activo = 0 THEN
        SET p_resultado = 'ERROR: El proyecto no existe o no está activo.';
    ELSEIF v_asignado > 0 THEN
        SET p_resultado = 'ERROR: El estudiante ya está en este proyecto.';
    ELSE
        INSERT INTO proyecto_estudiantes (id_proyecto, id_estudiante) VALUES (p_id_proyecto, p_id_usuario);
        SET p_resultado = 'OK: Estudiante asignado correctamente.';
    END IF;
END$$

CREATE PROCEDURE sp_promedio_estudiante(
    IN  p_id_estudiante INT,
    OUT p_promedio      DECIMAL(5,2),
    OUT p_mensaje       VARCHAR(200)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_promedio = -1;
        SET p_mensaje = 'Error inesperado al calcular promedio.';
    END;
    SELECT COUNT(*) INTO v_existe FROM usuarios WHERE id_usuario = p_id_estudiante AND rol = 'estudiante';
    IF v_existe = 0 THEN
        SET p_promedio = -1;
        SET p_mensaje = 'Estudiante no encontrado.';
    ELSE
        SELECT COALESCE(ROUND(AVG(calificacion),2), 0) INTO p_promedio
        FROM evaluaciones WHERE id_estudiante = p_id_estudiante;
        SET p_mensaje = 'OK: Cálculo exitoso.';
    END IF;
END$$

CREATE PROCEDURE sp_estadisticas_plataforma()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN SELECT 'Error al generar estadísticas.' AS error; END;
    SELECT
        (SELECT COUNT(*) FROM usuarios)    AS total_usuarios,
        (SELECT COUNT(*) FROM proyectos)   AS total_proyectos,
        (SELECT COUNT(*) FROM tareas)      AS total_tareas,
        (SELECT COUNT(*) FROM tareas WHERE completada = TRUE) AS tareas_completadas,
        (SELECT ROUND(AVG(calificacion),2) FROM evaluaciones) AS promedio_general;
END$$

DELIMITER ;

-- ============================================================
-- FUNCIONES
-- ============================================================

DELIMITER $$

CREATE FUNCTION fn_avance_proyecto(p_id_proyecto INT)
RETURNS DECIMAL(5,2) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_comp  INT DEFAULT 0;
    SELECT COUNT(*), IFNULL(SUM(completada),0) INTO v_total, v_comp FROM tareas WHERE id_proyecto = p_id_proyecto;
    IF v_total = 0 THEN RETURN 0.00; END IF;
    RETURN ROUND((v_comp / v_total) * 100, 2);
END$$

CREATE FUNCTION fn_promedio_estudiante(p_id_estudiante INT)
RETURNS DECIMAL(4,2) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_prom DECIMAL(4,2) DEFAULT 0.00;
    SELECT ROUND(AVG(calificacion),2) INTO v_prom FROM evaluaciones WHERE id_estudiante = p_id_estudiante;
    RETURN IFNULL(v_prom, 0.00);
END$$

CREATE FUNCTION fn_promedio_proyecto(p_id_proyecto INT)
RETURNS DECIMAL(4,2) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_prom DECIMAL(4,2) DEFAULT 0.00;
    SELECT ROUND(AVG(calificacion),2) INTO v_prom FROM evaluaciones WHERE id_proyecto = p_id_proyecto;
    RETURN IFNULL(v_prom, 0.00);
END$$

CREATE FUNCTION fn_estado_tarea(p_id_tarea INT)
RETURNS VARCHAR(25) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_comp  BOOLEAN;
    DECLARE v_limit DATE;
    SELECT completada, fecha_limite INTO v_comp, v_limit FROM tareas WHERE id_tarea = p_id_tarea;
    IF v_comp = TRUE THEN RETURN 'Completada'; END IF;
    IF DATEDIFF(v_limit, CURRENT_DATE) < 0   THEN RETURN 'Vencida'; END IF;
    IF DATEDIFF(v_limit, CURRENT_DATE) <= 3  THEN RETURN 'Próxima a vencer'; END IF;
    RETURN 'En tiempo';
END$$

CREATE FUNCTION fn_tareas_pendientes(p_id_usuario INT)
RETURNS INT DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    SELECT COUNT(*) INTO v_cnt FROM tareas WHERE id_estudiante = p_id_usuario AND completada = FALSE;
    RETURN v_cnt;
END$$

CREATE FUNCTION fn_rol_usuario(p_id_usuario INT)
RETURNS VARCHAR(20) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_rol VARCHAR(20);
    SELECT rol INTO v_rol FROM usuarios WHERE id_usuario = p_id_usuario;
    RETURN IFNULL(v_rol, 'no_encontrado');
END$$

DELIMITER ;

-- ============================================================
-- TRIGGERS DE AUDITORÍA
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_usuarios_after_insert
AFTER INSERT ON usuarios FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES ('usuarios', 'INSERT', NEW.id_usuario, USER(),
        JSON_OBJECT('nombre',NEW.nombre,'apellido',NEW.apellido,'email',NEW.email,'rol',NEW.rol,'activo',NEW.activo));
END$$

CREATE TRIGGER trg_usuarios_after_update
AFTER UPDATE ON usuarios FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES ('usuarios', 'UPDATE', NEW.id_usuario, USER(),
        JSON_OBJECT('nombre',OLD.nombre,'email',OLD.email,'rol',OLD.rol,'activo',OLD.activo),
        JSON_OBJECT('nombre',NEW.nombre,'email',NEW.email,'rol',NEW.rol,'activo',NEW.activo));
END$$

CREATE TRIGGER trg_usuarios_after_delete
AFTER DELETE ON usuarios FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES ('usuarios', 'DELETE', OLD.id_usuario, USER(),
        JSON_OBJECT('nombre',OLD.nombre,'email',OLD.email,'rol',OLD.rol));
END$$

CREATE TRIGGER trg_proyectos_after_insert
AFTER INSERT ON proyectos FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES ('proyectos', 'INSERT', NEW.id_proyecto, USER(),
        JSON_OBJECT('titulo',NEW.titulo,'id_docente',NEW.id_docente,'estado',NEW.estado));
END$$

CREATE TRIGGER trg_proyectos_after_update
AFTER UPDATE ON proyectos FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES ('proyectos', 'UPDATE', NEW.id_proyecto, USER(),
        JSON_OBJECT('titulo',OLD.titulo,'estado',OLD.estado,'fecha_limite',OLD.fecha_limite),
        JSON_OBJECT('titulo',NEW.titulo,'estado',NEW.estado,'fecha_limite',NEW.fecha_limite));
END$$

CREATE TRIGGER trg_proyectos_after_delete
AFTER DELETE ON proyectos FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES ('proyectos', 'DELETE', OLD.id_proyecto, USER(),
        JSON_OBJECT('titulo',OLD.titulo,'estado',OLD.estado));
END$$

CREATE TRIGGER trg_tareas_after_insert
AFTER INSERT ON tareas FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES ('tareas', 'INSERT', NEW.id_tarea, USER(),
        JSON_OBJECT('titulo',NEW.titulo,'prioridad',NEW.prioridad,'completada',NEW.completada,'id_proyecto',NEW.id_proyecto));
END$$

CREATE TRIGGER trg_tareas_after_update
AFTER UPDATE ON tareas FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES ('tareas', 'UPDATE', NEW.id_tarea, USER(),
        JSON_OBJECT('titulo',OLD.titulo,'completada',OLD.completada,'prioridad',OLD.prioridad),
        JSON_OBJECT('titulo',NEW.titulo,'completada',NEW.completada,'prioridad',NEW.prioridad));
END$$

CREATE TRIGGER trg_tareas_after_delete
AFTER DELETE ON tareas FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES ('tareas', 'DELETE', OLD.id_tarea, USER(),
        JSON_OBJECT('titulo',OLD.titulo,'id_proyecto',OLD.id_proyecto));
END$$

CREATE TRIGGER trg_evaluaciones_after_insert
AFTER INSERT ON evaluaciones FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES ('evaluaciones', 'INSERT', NEW.id_evaluacion, USER(),
        JSON_OBJECT('titulo',NEW.titulo,'calificacion',NEW.calificacion,'id_estudiante',NEW.id_estudiante));
END$$

CREATE TRIGGER trg_evaluaciones_after_update
AFTER UPDATE ON evaluaciones FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES ('evaluaciones', 'UPDATE', NEW.id_evaluacion, USER(),
        JSON_OBJECT('calificacion',OLD.calificacion,'comentarios',OLD.comentarios),
        JSON_OBJECT('calificacion',NEW.calificacion,'comentarios',NEW.comentarios));
END$$

CREATE TRIGGER trg_evaluaciones_after_delete
AFTER DELETE ON evaluaciones FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES ('evaluaciones', 'DELETE', OLD.id_evaluacion, USER(),
        JSON_OBJECT('titulo',OLD.titulo,'calificacion',OLD.calificacion));
END$$

DELIMITER ;

-- ============================================================
-- DATOS DE PRUEBA  (contraseña: Test1234!)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE auditoria;
TRUNCATE TABLE evaluaciones;
TRUNCATE TABLE tareas;
TRUNCATE TABLE proyecto_estudiantes;
TRUNCATE TABLE proyectos;
TRUNCATE TABLE reportes;
TRUNCATE TABLE perfiles;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO usuarios (id_usuario, nombre, apellido, email, documento, password, rol) VALUES
(1, 'Admin',    'Sistema',   'admin@eduhub.edu.co',     '1000000001', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'admin'),
(2, 'María',    'García',    'mgarcia@eduhub.edu.co',   '1000000002', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'docente'),
(3, 'Carlos',   'Ruiz',      'cruiz@eduhub.edu.co',     '1000000003', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'docente'),
(4, 'Ana',      'López',     'alopez@eduhub.edu.co',    '1000000004', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(5, 'Juan',     'Martínez',  'jmartinez@eduhub.edu.co', '1000000005', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(6, 'Sofía',    'Torres',    'storres@eduhub.edu.co',   '1000000006', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(7, 'Pedro',    'Sánchez',   'psanchez@eduhub.edu.co',  '1000000007', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(8, 'Laura',    'Vega',      'lvega@eduhub.edu.co',     '1000000008', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante');

INSERT INTO proyectos (id_proyecto, id_docente, titulo, descripcion, fecha_inicio, fecha_limite, estado) VALUES
(1, 2, 'Análisis de Algoritmos',   'Complejidad computacional y estructuras de datos.',  '2026-02-01', '2026-06-15', 'activo'),
(2, 2, 'Diseño de BD Relacional',  'Modelado ER, normalización y consultas avanzadas.',  '2026-02-10', '2026-06-20', 'activo'),
(3, 3, 'App Móvil React Native',   'Aplicación móvil multiplataforma con Expo.',         '2026-02-15', '2026-07-01', 'pausado'),
(4, 3, 'API REST con Node.js',     'Backend con autenticación JWT y documentación.',     '2026-01-10', '2026-03-10', 'finalizado');

INSERT INTO proyecto_estudiantes (id_proyecto, id_estudiante, fecha_ingreso) VALUES
(1, 4, '2026-02-01'), (1, 5, '2026-02-01'),
(2, 4, '2026-02-10'), (2, 6, '2026-02-10'), (2, 7, '2026-02-10'),
(3, 5, '2026-02-15'), (3, 6, '2026-02-15'), (3, 7, '2026-02-15'), (3, 8, '2026-02-15'),
(4, 4, '2026-01-10'), (4, 8, '2026-01-10');

INSERT INTO tareas (id_proyecto, id_estudiante, titulo, prioridad, completada, fecha_limite) VALUES
(1, 4, 'Análisis de complejidad Big-O',   'alta',  FALSE, '2026-05-05'),
(1, 5, 'Implementar QuickSort en Java',   'alta',  FALSE, '2026-05-08'),
(2, 4, 'Modelado Entidad-Relación',       'alta',  TRUE,  '2026-04-25'),
(2, 6, 'Normalización hasta 3FN',         'media', FALSE, '2026-05-10'),
(2, 7, 'Conexión a MongoDB Atlas',        'baja',  FALSE, '2026-05-18'),
(3, 5, 'Diseño de pantallas en Figma',    'media', FALSE, '2026-06-01'),
(4, 4, 'Endpoints de autenticación JWT',  'alta',  TRUE,  '2026-02-28'),
(4, 8, 'Documentación con Swagger',       'media', TRUE,  '2026-03-01');

INSERT INTO evaluaciones (id_proyecto, id_estudiante, id_docente, tipo, titulo, calificacion, comentarios) VALUES
(4, 4, 3, 'parcial', 'Parcial 1 - Endpoints JWT',   8.50, 'Buena implementación. Mejorar documentación.'),
(4, 8, 3, 'parcial', 'Parcial 1 - Documentación',   9.00, 'Documentación completa y clara.'),
(1, 4, 2, 'parcial', 'Parcial 1 - Complejidad',      7.50, 'Buen análisis, falta profundidad en casos borde.');

INSERT INTO reportes (descripcion, fecha, id_usuario) VALUES
('Reporte de rendimiento académico semestral', CURDATE(), 1),
('Reporte de avance de proyectos activos',      CURDATE(), 1),
('Reporte de tareas vencidas',                  CURDATE(), 1);

-- Registros de auditoría de ejemplo para pruebas
INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos, fecha_hora) VALUES
('usuarios', 'INSERT', 1, 'root@localhost', '{"nombre":"Admin","rol":"admin","activo":true}', NOW() - INTERVAL 5 DAY),
('proyectos', 'INSERT', 1, 'root@localhost', '{"titulo":"Análisis de Algoritmos","estado":"activo"}', NOW() - INTERVAL 4 DAY),
('tareas', 'UPDATE', 3, 'root@localhost', '{"completada":true,"titulo":"Modelado Entidad-Relación"}', NOW() - INTERVAL 1 DAY),
('evaluaciones', 'INSERT', 1, 'root@localhost', '{"calificacion":8.50,"titulo":"Parcial 1 - Endpoints JWT"}', NOW() - INTERVAL 2 DAY);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'usuarios'             AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL SELECT 'proyectos',           COUNT(*) FROM proyectos
UNION ALL SELECT 'proyecto_estudiantes',COUNT(*) FROM proyecto_estudiantes
UNION ALL SELECT 'tareas',              COUNT(*) FROM tareas
UNION ALL SELECT 'evaluaciones',        COUNT(*) FROM evaluaciones
UNION ALL SELECT 'reportes',            COUNT(*) FROM reportes
UNION ALL SELECT 'auditoria',           COUNT(*) FROM auditoria;

-- Fin del script de backup completo
