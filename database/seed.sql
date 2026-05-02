-- ============================================================
--  EDUHUB PLATFORM — Seed de datos de prueba
--  Contraseña de todos los usuarios: Test1234!
--  Hash bcrypt(cost=10) generado con bcryptjs
-- ============================================================

USE eduhub;

-- Limpiar datos previos (orden inverso por FK)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE evaluaciones;
TRUNCATE TABLE tareas;
TRUNCATE TABLE proyecto_estudiantes;
TRUNCATE TABLE proyectos;
TRUNCATE TABLE reportes;
TRUNCATE TABLE perfiles;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USUARIOS  (contraseña para todos: Test1234!)
-- ============================================================
INSERT INTO usuarios (id_usuario, nombre, apellido, email, documento, password, rol) VALUES
(1, 'Admin',    'Sistema',   'admin@eduhub.edu.co',     '1000000001', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'admin'),
(2, 'María',    'García',    'mgarcia@eduhub.edu.co',   '1000000002', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'docente'),
(3, 'Carlos',   'Ruiz',      'cruiz@eduhub.edu.co',     '1000000003', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'docente'),
(4, 'Ana',      'López',     'alopez@eduhub.edu.co',    '1000000004', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(5, 'Juan',     'Martínez',  'jmartinez@eduhub.edu.co', '1000000005', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(6, 'Sofía',    'Torres',    'storres@eduhub.edu.co',   '1000000006', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(7, 'Pedro',    'Sánchez',   'psanchez@eduhub.edu.co',  '1000000007', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante'),
(8, 'Laura',    'Vega',      'lvega@eduhub.edu.co',     '1000000008', '$2a$10$UaAZ3uKpkgLjhlIbxrdAceSWVO2oIuo4bfS/1fWSeHzXLwIsk..Iq', 'estudiante');

-- ============================================================
-- PROYECTOS
-- ============================================================
INSERT INTO proyectos (id_proyecto, id_docente, titulo, descripcion, fecha_inicio, fecha_limite, estado) VALUES
(1, 2, 'Análisis de Algoritmos',   'Complejidad computacional y estructuras de datos.',  '2026-02-01', '2026-06-15', 'activo'),
(2, 2, 'Diseño de BD Relacional',  'Modelado ER, normalización y consultas avanzadas.',  '2026-02-10', '2026-06-20', 'activo'),
(3, 3, 'App Móvil React Native',   'Aplicación móvil multiplataforma con Expo.',         '2026-02-15', '2026-07-01', 'pausado'),
(4, 3, 'API REST con Node.js',     'Backend con autenticación JWT y documentación.',     '2026-01-10', '2026-03-10', 'finalizado');

-- ============================================================
-- PROYECTO_ESTUDIANTES
-- ============================================================
INSERT INTO proyecto_estudiantes (id_proyecto, id_estudiante, fecha_ingreso) VALUES
(1, 4, '2026-02-01'), (1, 5, '2026-02-01'),
(2, 4, '2026-02-10'), (2, 6, '2026-02-10'), (2, 7, '2026-02-10'),
(3, 5, '2026-02-15'), (3, 6, '2026-02-15'), (3, 7, '2026-02-15'), (3, 8, '2026-02-15'),
(4, 4, '2026-01-10'), (4, 8, '2026-01-10');

-- ============================================================
-- TAREAS
-- ============================================================
INSERT INTO tareas (id_proyecto, id_estudiante, titulo, prioridad, completada, fecha_limite) VALUES
(1, 4, 'Análisis de complejidad Big-O',   'alta',  FALSE, '2026-05-05'),
(1, 5, 'Implementar QuickSort en Java',   'alta',  FALSE, '2026-05-08'),
(2, 4, 'Modelado Entidad-Relación',       'alta',  TRUE,  '2026-04-25'),
(2, 6, 'Normalización hasta 3FN',         'media', FALSE, '2026-05-10'),
(2, 7, 'Conexión a MongoDB Atlas',        'baja',  FALSE, '2026-05-18'),
(3, 5, 'Diseño de pantallas en Figma',    'media', FALSE, '2026-06-01'),
(4, 4, 'Endpoints de autenticación JWT',  'alta',  TRUE,  '2026-02-28'),
(4, 8, 'Documentación con Swagger',       'media', TRUE,  '2026-03-01');

-- ============================================================
-- EVALUACIONES
-- ============================================================
INSERT INTO evaluaciones (id_proyecto, id_estudiante, id_docente, tipo, titulo, calificacion, comentarios) VALUES
(4, 4, 3, 'parcial', 'Parcial 1 - Endpoints JWT',   8.50, 'Buena implementación. Mejorar documentación.'),
(4, 8, 3, 'parcial', 'Parcial 1 - Documentación',   9.00, 'Documentación completa y clara.'),
(1, 4, 2, 'parcial', 'Parcial 1 - Complejidad',      7.50, 'Buen análisis, falta profundidad en casos borde.');

-- ============================================================
-- REPORTES
-- ============================================================
INSERT INTO reportes (descripcion, fecha, id_usuario) VALUES
('Reporte de rendimiento académico semestral', CURDATE(), 1),
('Reporte de avance de proyectos activos',      CURDATE(), 1),
('Reporte de tareas vencidas',                  CURDATE(), 1);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'usuarios'            AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL SELECT 'proyectos',          COUNT(*) FROM proyectos
UNION ALL SELECT 'proyecto_estudiantes', COUNT(*) FROM proyecto_estudiantes
UNION ALL SELECT 'tareas',             COUNT(*) FROM tareas
UNION ALL SELECT 'evaluaciones',       COUNT(*) FROM evaluaciones
UNION ALL SELECT 'reportes',           COUNT(*) FROM reportes;
