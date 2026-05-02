// repositories/proyectoRepository.js
const { pool } = require('../config/mysql');

class ProyectoRepository {
  async findAllByStudent(estudianteId) {
    const [rows] = await pool.query(`
        SELECT p.id_proyecto AS id, p.titulo, p.descripcion,
               p.fecha_inicio, p.fecha_limite, p.estado,
               u.nombre AS docente, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS lider_nombre,
               fn_avance_proyecto(p.id_proyecto) AS avance_pct
        FROM proyectos p
        INNER JOIN usuarios u ON u.id_usuario = p.id_docente
        INNER JOIN proyecto_estudiantes pe ON pe.id_proyecto = p.id_proyecto
        WHERE pe.id_estudiante = ?
        ORDER BY p.fecha_limite ASC`, [estudianteId]);
    return rows;
  }

  async findAllByDocente(docenteId) {
    const [rows] = await pool.query(`
        SELECT p.id_proyecto AS id, p.titulo, p.descripcion,
               p.fecha_inicio, p.fecha_limite, p.estado,
               u.nombre AS docente, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS lider_nombre,
               COUNT(DISTINCT pe.id_estudiante) AS total_estudiantes,
               fn_avance_proyecto(p.id_proyecto) AS avance_pct
        FROM proyectos p
        INNER JOIN usuarios u ON u.id_usuario = p.id_docente
        LEFT JOIN proyecto_estudiantes pe ON pe.id_proyecto = p.id_proyecto
        WHERE p.id_docente = ?
        GROUP BY p.id_proyecto
        ORDER BY p.fecha_limite ASC`, [docenteId]);
    return rows;
  }

  async findAll() {
    const [rows] = await pool.query(`
        SELECT p.id_proyecto AS id, p.titulo, p.descripcion,
               p.fecha_inicio, p.fecha_limite, p.estado,
               u.nombre AS docente, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS lider_nombre,
               COUNT(DISTINCT pe.id_estudiante) AS total_estudiantes,
               fn_avance_proyecto(p.id_proyecto) AS avance_pct
        FROM proyectos p
        INNER JOIN usuarios u ON u.id_usuario = p.id_docente
        LEFT JOIN proyecto_estudiantes pe ON pe.id_proyecto = p.id_proyecto
        GROUP BY p.id_proyecto
        ORDER BY p.fecha_limite ASC`);
    return rows;
  }

  async findById(id) {
    const [[proyecto]] = await pool.query(`
      SELECT p.id_proyecto AS id, p.titulo, p.descripcion,
             p.fecha_inicio, p.fecha_limite, p.estado, p.created_at, p.id_docente,
             u.nombre AS docente, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS lider_nombre, u.email AS email_docente,
             fn_avance_proyecto(p.id_proyecto) AS avance_pct
      FROM proyectos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_docente
      WHERE p.id_proyecto = ?`, [id]);
    return proyecto || null;
  }

  async getProyectoTareas(id) {
    const [rows] = await pool.query(`
      SELECT t.id_tarea AS id, t.titulo, t.descripcion, t.prioridad,
             t.completada, t.fecha_limite, t.created_at,
             u.nombre AS asignado_a, u.id_usuario AS id_estudiante,
             fn_estado_tarea(t.id_tarea) AS estado
      FROM tareas t
      INNER JOIN usuarios u ON u.id_usuario = t.id_estudiante
      WHERE t.id_proyecto = ?
      ORDER BY t.completada ASC, t.prioridad DESC`, [id]);
    return rows;
  }

  async getProyectoEstudiantes(id) {
    const [rows] = await pool.query(`
      SELECT u.id_usuario AS id, u.nombre, u.apellido, u.email, pe.fecha_ingreso
      FROM proyecto_estudiantes pe
      INNER JOIN usuarios u ON u.id_usuario = pe.id_estudiante
      WHERE pe.id_proyecto = ?
      ORDER BY u.nombre`, [id]);
    return rows;
  }

  async getProyectoEvaluaciones(id) {
    const [rows] = await pool.query(`
      SELECT e.id_evaluacion AS id, e.tipo, e.titulo, e.calificacion,
             e.comentarios, e.fecha,
             est.nombre AS estudiante,
             doc.nombre AS docente
      FROM evaluaciones e
      INNER JOIN usuarios est ON est.id_usuario = e.id_estudiante
      INNER JOIN usuarios doc ON doc.id_usuario = e.id_docente
      WHERE e.id_proyecto = ?
      ORDER BY e.fecha DESC`, [id]);
    return rows;
  }

  async create(docenteId, data) {
    const { titulo, descripcion, fecha_inicio, fecha_limite, estado } = data;
    const [result] = await pool.query(
      `INSERT INTO proyectos (id_docente, titulo, descripcion, fecha_inicio, fecha_limite, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [docenteId, titulo.trim(), descripcion || null, fecha_inicio, fecha_limite, estado || 'activo']
    );
    return result.insertId;
  }

  async update(id, data) {
    const { titulo, descripcion, fecha_inicio, fecha_limite, estado, id_docente } = data;
    const [result] = await pool.query(
      `UPDATE proyectos SET
         titulo       = COALESCE(?, titulo),
         descripcion  = COALESCE(?, descripcion),
         fecha_inicio = COALESCE(?, fecha_inicio),
         fecha_limite = COALESCE(?, fecha_limite),
         estado       = COALESCE(?, estado),
         id_docente   = COALESCE(?, id_docente)
       WHERE id_proyecto = ?`,
      [titulo, descripcion, fecha_inicio, fecha_limite, estado, id_docente, id]
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query('DELETE FROM proyectos WHERE id_proyecto = ?', [id]);
    return result.affectedRows;
  }

  async assignStudent(proyectoId, estudianteId) {
    const [result] = await pool.query('CALL sp_asignar_estudiante(?, ?, @resultado)', [proyectoId, estudianteId]);
    const [[row]] = await pool.query('SELECT @resultado AS resultado');
    return row.resultado;
  }

  async removeStudent(proyectoId, estudianteId) {
    const [result] = await pool.query(
      'DELETE FROM proyecto_estudiantes WHERE id_proyecto = ? AND id_estudiante = ?',
      [proyectoId, estudianteId]
    );
    return result.affectedRows;
  }
}

module.exports = new ProyectoRepository();
