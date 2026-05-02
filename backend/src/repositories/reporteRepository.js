// repositories/reporteRepository.js
const { pool } = require('../config/mysql');

class ReporteRepository {
  async getDashboardStats() {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM usuarios WHERE activo = TRUE'),
      pool.query('SELECT COUNT(*) AS total FROM proyectos WHERE estado = "activo"'),
      pool.query('SELECT COUNT(*) AS total FROM tareas WHERE completada = FALSE'),
      pool.query('SELECT ROUND(AVG(calificacion),2) AS prom FROM evaluaciones WHERE calificacion IS NOT NULL'),
      pool.query(`
        SELECT p.titulo, fn_avance_proyecto(p.id_proyecto) AS avance, p.estado
        FROM proyectos p ORDER BY avance DESC LIMIT 5`),
      pool.query(`
        SELECT u.nombre, fn_promedio_estudiante(u.id_usuario) AS promedio
        FROM usuarios u WHERE u.rol = 'estudiante' AND u.activo = TRUE
        ORDER BY promedio DESC LIMIT 5`),
    ]);

    return {
      usuarios_activos: queries[0][0][0].total,
      proyectos_activos: queries[1][0][0].total,
      tareas_pendientes: queries[2][0][0].total,
      promedio_general: queries[3][0][0].prom,
      top_proyectos: queries[4][0],
      top_estudiantes: queries[5][0],
    };
  }

  async getProyectosReport() {
    const [rows] = await pool.query(`
      SELECT p.id_proyecto AS id, p.titulo, p.estado, p.fecha_limite,
             u.nombre AS docente,
             COUNT(DISTINCT pe.id_estudiante) AS estudiantes,
             fn_avance_proyecto(p.id_proyecto) AS avance_pct,
             fn_promedio_proyecto(p.id_proyecto) AS calificacion_prom
      FROM proyectos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_docente
      LEFT JOIN proyecto_estudiantes pe ON pe.id_proyecto = p.id_proyecto
      GROUP BY p.id_proyecto
      ORDER BY p.estado, p.fecha_limite`);
    return rows;
  }

  async getTareasVencidas() {
    const [rows] = await pool.query(`
      SELECT t.titulo AS tarea, t.prioridad, t.fecha_limite,
             u.nombre AS estudiante, u.email,
             p.titulo AS proyecto
      FROM tareas t
      INNER JOIN usuarios u ON u.id_usuario = t.id_estudiante
      INNER JOIN proyectos p ON p.id_proyecto = t.id_proyecto
      WHERE t.completada = FALSE AND t.fecha_limite < CURRENT_DATE
      ORDER BY t.fecha_limite ASC`);
    return rows;
  }

  async getEstudiantesReport() {
    const [rows] = await pool.query(`
      SELECT u.id_usuario AS id, u.nombre, u.apellido, u.email,
             fn_promedio_estudiante(u.id_usuario) AS promedio,
             fn_tareas_pendientes(u.id_usuario) AS tareas_pendientes,
             COUNT(DISTINCT pe.id_proyecto) AS proyectos
      FROM usuarios u
      LEFT JOIN proyecto_estudiantes pe ON pe.id_estudiante = u.id_usuario
      WHERE u.rol = 'estudiante' AND u.activo = TRUE
      GROUP BY u.id_usuario
      ORDER BY promedio DESC`);
    return rows;
  }
}

module.exports = new ReporteRepository();
