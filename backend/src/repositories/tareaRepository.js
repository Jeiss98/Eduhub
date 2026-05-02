// repositories/tareaRepository.js
const { pool } = require('../config/mysql');

class TareaRepository {
  async findAll(queryParams, reqUsuario) {
    let query, params = [];
    const { proyecto_id, estado, prioridad } = queryParams;

    if (reqUsuario.rol === 'estudiante') {
      query = `
        SELECT t.id_tarea AS id, t.titulo, t.descripcion, t.prioridad,
               t.completada, t.fecha_limite, t.created_at,
               p.titulo AS proyecto, p.id_proyecto,
               fn_estado_tarea(t.id_tarea) AS estado_actual
        FROM tareas t
        INNER JOIN proyectos p ON p.id_proyecto = t.id_proyecto
        WHERE t.id_estudiante = ?`;
      params = [reqUsuario.id];
    } else {
      query = `
        SELECT t.id_tarea AS id, t.titulo, t.descripcion, t.prioridad,
               t.completada, t.fecha_limite, t.created_at,
               p.titulo AS proyecto, p.id_proyecto,
               u.nombre AS estudiante,
               fn_estado_tarea(t.id_tarea) AS estado_actual
        FROM tareas t
        INNER JOIN proyectos p ON p.id_proyecto = t.id_proyecto
        INNER JOIN usuarios u ON u.id_usuario = t.id_estudiante
        WHERE 1=1`;
      if (reqUsuario.rol === 'docente') {
        query += ' AND p.id_docente = ?';
        params.push(reqUsuario.id);
      }
    }

    if (proyecto_id) { query += ' AND t.id_proyecto = ?'; params.push(proyecto_id); }
    if (prioridad)   { query += ' AND t.prioridad = ?';   params.push(prioridad); }
    if (estado === 'completada')   { query += ' AND t.completada = TRUE'; }
    if (estado === 'pendiente')    { query += ' AND t.completada = FALSE'; }

    query += ' ORDER BY t.completada ASC, t.fecha_limite ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findById(id) {
    const [[tarea]] = await pool.query(`
      SELECT t.id_tarea AS id, t.titulo, t.descripcion, t.prioridad,
             t.completada, t.fecha_limite, t.created_at,
             p.titulo AS proyecto, p.id_proyecto,
             u.nombre AS estudiante, u.email AS email_estudiante,
             fn_estado_tarea(t.id_tarea) AS estado_actual
      FROM tareas t
      INNER JOIN proyectos p ON p.id_proyecto = t.id_proyecto
      INNER JOIN usuarios u  ON u.id_usuario  = t.id_estudiante
      WHERE t.id_tarea = ?`, [id]);
    return tarea || null;
  }

  async checkStudentInProject(proyectoId, estudianteId) {
    const [[inscrito]] = await pool.query(
      'SELECT 1 FROM proyecto_estudiantes WHERE id_proyecto = ? AND id_estudiante = ?',
      [proyectoId, estudianteId]
    );
    return !!inscrito;
  }

  async create(data) {
    const { id_proyecto, id_estudiante, titulo, descripcion, prioridad, fecha_limite } = data;
    const [result] = await pool.query(
      `INSERT INTO tareas (id_proyecto, id_estudiante, titulo, descripcion, prioridad, fecha_limite)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_proyecto, id_estudiante, titulo.trim(), descripcion || null, prioridad, fecha_limite]
    );
    return result.insertId;
  }

  async completeTarea(id, estudianteId = null) {
    let query, params;
    if (estudianteId) {
      query  = 'UPDATE tareas SET completada = TRUE WHERE id_tarea = ? AND id_estudiante = ?';
      params = [id, estudianteId];
    } else {
      query  = 'UPDATE tareas SET completada = TRUE WHERE id_tarea = ?';
      params = [id];
    }
    const [result] = await pool.query(query, params);
    return result.affectedRows;
  }

  async update(id, data) {
    const { titulo, descripcion, prioridad, fecha_limite, completada } = data;
    const [result] = await pool.query(
      `UPDATE tareas SET
         titulo       = COALESCE(?, titulo),
         descripcion  = COALESCE(?, descripcion),
         prioridad    = COALESCE(?, prioridad),
         fecha_limite = COALESCE(?, fecha_limite),
         completada   = COALESCE(?, completada)
       WHERE id_tarea = ?`,
      [titulo, descripcion, prioridad, fecha_limite,
       completada !== undefined ? (completada ? 1 : 0) : null,
       id]
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query('DELETE FROM tareas WHERE id_tarea = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = new TareaRepository();
