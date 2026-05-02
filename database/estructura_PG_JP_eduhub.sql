-- ============================================================
--  EDUHUB PLATFORM — Schema MySQL (ESTRUCTURA SOLO — SIN DATOS)
--  Prefijo de BD: PG_JP (Palma · Gallego)
--  Fundación Universitaria Konrad Lorenz · 2026-1
--  Materias: Bases de Datos II + Diseño de Interfaces + NTD
--  Autores: Jeisson Palma · Gustavo Gallego
-- ============================================================

DROP DATABASE IF EXISTS PG_JP_eduhub;
CREATE DATABASE PG_JP_eduhub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE PG_JP_eduhub;

-- ============================================================
-- TABLA: usuarios
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

-- ============================================================
-- TABLA: proyectos
-- ============================================================
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

-- ============================================================
-- TABLA: proyecto_estudiantes (tabla pivote)
-- ============================================================
CREATE TABLE proyecto_estudiantes (
    id_proyecto   INT  NOT NULL,
    id_estudiante INT  NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (id_proyecto, id_estudiante),
    CONSTRAINT fk_pe_proyecto   FOREIGN KEY (id_proyecto)   REFERENCES proyectos(id_proyecto) ON DELETE CASCADE,
    CONSTRAINT fk_pe_estudiante FOREIGN KEY (id_estudiante) REFERENCES usuarios(id_usuario)   ON DELETE CASCADE
);

-- ============================================================
-- TABLA: tareas
-- ============================================================
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

-- ============================================================
-- TABLA: evaluaciones
-- ============================================================
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

-- ============================================================
-- TABLA: reportes
-- ============================================================
CREATE TABLE reportes (
    id_reporte  INT           AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(200)  NOT NULL,
    fecha       DATE          NOT NULL DEFAULT (CURRENT_DATE),
    id_usuario  INT,
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: perfiles
-- ============================================================
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

-- ============================================================
-- TABLA: auditoria  (RF-Auditoría)
-- Almacena QUIÉN, CUÁNDO y QUÉ cambió en cualquier tabla
-- ============================================================
CREATE TABLE auditoria (
    id_auditoria     INT             AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada   VARCHAR(100)    NOT NULL   COMMENT 'Nombre de la tabla modificada',
    operacion        ENUM('INSERT','UPDATE','DELETE') NOT NULL COMMENT 'Tipo de DML ejecutado',
    id_registro      INT             NULL        COMMENT 'PK del registro afectado',
    usuario_db       VARCHAR(150)    NOT NULL DEFAULT 'sistema' COMMENT 'Usuario de BD o etiqueta de la aplicación',
    datos_anteriores JSON            NULL        COMMENT 'Snapshot anterior (solo UPDATE/DELETE)',
    datos_nuevos     JSON            NULL        COMMENT 'Snapshot nuevo (solo INSERT/UPDATE)',
    fecha_hora       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento exacto de la operación',
    INDEX idx_auditoria_tabla   (tabla_afectada),
    INDEX idx_auditoria_fecha   (fecha_hora),
    INDEX idx_auditoria_op      (operacion)
) COMMENT = 'Tabla de auditoría — registra todos los cambios DML sobre el modelo relacional';

-- ============================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================

DELIMITER $$

-- SP1: Registrar usuario con validación
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

-- SP2: Progreso de proyecto
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

-- SP3: Asignar estudiante a proyecto con validaciones
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

-- SP4: Promedio estudiante
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

-- SP5: Estadísticas globales
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
-- TRIGGERS DE AUDITORÍA (PL/SQL — solución automatizada)
-- Cada trigger registra automáticamente en la tabla auditoria
-- ============================================================

DELIMITER $$

-- ─── USUARIOS ────────────────────────────────────────────────

CREATE TRIGGER trg_usuarios_after_insert
AFTER INSERT ON usuarios FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES (
        'usuarios', 'INSERT', NEW.id_usuario, USER(),
        JSON_OBJECT(
            'nombre', NEW.nombre,
            'apellido', NEW.apellido,
            'email', NEW.email,
            'documento', NEW.documento,
            'rol', NEW.rol,
            'activo', NEW.activo
        )
    );
END$$

CREATE TRIGGER trg_usuarios_after_update
AFTER UPDATE ON usuarios FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES (
        'usuarios', 'UPDATE', NEW.id_usuario, USER(),
        JSON_OBJECT(
            'nombre', OLD.nombre,
            'apellido', OLD.apellido,
            'email', OLD.email,
            'rol', OLD.rol,
            'activo', OLD.activo
        ),
        JSON_OBJECT(
            'nombre', NEW.nombre,
            'apellido', NEW.apellido,
            'email', NEW.email,
            'rol', NEW.rol,
            'activo', NEW.activo
        )
    );
END$$

CREATE TRIGGER trg_usuarios_after_delete
AFTER DELETE ON usuarios FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES (
        'usuarios', 'DELETE', OLD.id_usuario, USER(),
        JSON_OBJECT(
            'nombre', OLD.nombre,
            'apellido', OLD.apellido,
            'email', OLD.email,
            'rol', OLD.rol
        )
    );
END$$

-- ─── PROYECTOS ───────────────────────────────────────────────

CREATE TRIGGER trg_proyectos_after_insert
AFTER INSERT ON proyectos FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES (
        'proyectos', 'INSERT', NEW.id_proyecto, USER(),
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'id_docente', NEW.id_docente,
            'estado', NEW.estado,
            'fecha_inicio', NEW.fecha_inicio,
            'fecha_limite', NEW.fecha_limite
        )
    );
END$$

CREATE TRIGGER trg_proyectos_after_update
AFTER UPDATE ON proyectos FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES (
        'proyectos', 'UPDATE', NEW.id_proyecto, USER(),
        JSON_OBJECT('titulo', OLD.titulo, 'estado', OLD.estado, 'fecha_limite', OLD.fecha_limite),
        JSON_OBJECT('titulo', NEW.titulo, 'estado', NEW.estado, 'fecha_limite', NEW.fecha_limite)
    );
END$$

CREATE TRIGGER trg_proyectos_after_delete
AFTER DELETE ON proyectos FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES (
        'proyectos', 'DELETE', OLD.id_proyecto, USER(),
        JSON_OBJECT('titulo', OLD.titulo, 'estado', OLD.estado)
    );
END$$

-- ─── TAREAS ──────────────────────────────────────────────────

CREATE TRIGGER trg_tareas_after_insert
AFTER INSERT ON tareas FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES (
        'tareas', 'INSERT', NEW.id_tarea, USER(),
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'prioridad', NEW.prioridad,
            'completada', NEW.completada,
            'id_proyecto', NEW.id_proyecto,
            'id_estudiante', NEW.id_estudiante,
            'fecha_limite', NEW.fecha_limite
        )
    );
END$$

CREATE TRIGGER trg_tareas_after_update
AFTER UPDATE ON tareas FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES (
        'tareas', 'UPDATE', NEW.id_tarea, USER(),
        JSON_OBJECT('titulo', OLD.titulo, 'completada', OLD.completada, 'prioridad', OLD.prioridad),
        JSON_OBJECT('titulo', NEW.titulo, 'completada', NEW.completada, 'prioridad', NEW.prioridad)
    );
END$$

CREATE TRIGGER trg_tareas_after_delete
AFTER DELETE ON tareas FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES (
        'tareas', 'DELETE', OLD.id_tarea, USER(),
        JSON_OBJECT('titulo', OLD.titulo, 'id_proyecto', OLD.id_proyecto)
    );
END$$

-- ─── EVALUACIONES ────────────────────────────────────────────

CREATE TRIGGER trg_evaluaciones_after_insert
AFTER INSERT ON evaluaciones FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_nuevos)
    VALUES (
        'evaluaciones', 'INSERT', NEW.id_evaluacion, USER(),
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'calificacion', NEW.calificacion,
            'tipo', NEW.tipo,
            'id_estudiante', NEW.id_estudiante,
            'id_proyecto', NEW.id_proyecto
        )
    );
END$$

CREATE TRIGGER trg_evaluaciones_after_update
AFTER UPDATE ON evaluaciones FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
    VALUES (
        'evaluaciones', 'UPDATE', NEW.id_evaluacion, USER(),
        JSON_OBJECT('calificacion', OLD.calificacion, 'comentarios', OLD.comentarios),
        JSON_OBJECT('calificacion', NEW.calificacion, 'comentarios', NEW.comentarios)
    );
END$$

CREATE TRIGGER trg_evaluaciones_after_delete
AFTER DELETE ON evaluaciones FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores)
    VALUES (
        'evaluaciones', 'DELETE', OLD.id_evaluacion, USER(),
        JSON_OBJECT('titulo', OLD.titulo, 'calificacion', OLD.calificacion)
    );
END$$

DELIMITER ;

-- ============================================================
-- BLOQUE ANÓNIMO DE CONSULTA A LA TABLA AUDITORIA
-- (equivalente en MySQL a un bloque PL/SQL de Oracle)
-- ============================================================

-- Consulta 1: Todos los registros de auditoría del día actual ordenados por hora
SELECT
    id_auditoria,
    tabla_afectada,
    operacion,
    id_registro,
    usuario_db,
    datos_anteriores,
    datos_nuevos,
    fecha_hora
FROM auditoria
WHERE DATE(fecha_hora) = CURDATE()
ORDER BY fecha_hora DESC;

-- Consulta 2: Resumen de operaciones por tabla y día (estadística)
SELECT
    DATE(fecha_hora)   AS fecha,
    tabla_afectada,
    operacion,
    COUNT(*)           AS total_operaciones
FROM auditoria
GROUP BY DATE(fecha_hora), tabla_afectada, operacion
ORDER BY fecha DESC, tabla_afectada;

-- Consulta 3: Últimas 50 modificaciones (UPDATE) con datos anteriores y nuevos
SELECT
    id_auditoria,
    tabla_afectada,
    id_registro,
    usuario_db,
    datos_anteriores,
    datos_nuevos,
    fecha_hora
FROM auditoria
WHERE operacion = 'UPDATE'
ORDER BY fecha_hora DESC
LIMIT 50;

-- Consulta 4: Registros eliminados en los últimos 7 días
SELECT
    tabla_afectada,
    id_registro,
    datos_anteriores,
    usuario_db,
    fecha_hora
FROM auditoria
WHERE operacion = 'DELETE'
  AND fecha_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY fecha_hora DESC;

-- Fin del script de estructura
