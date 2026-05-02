// repositories/evaluacionRepository.js
const { pool } = require('../config/mysql');

class EvaluacionRepository {
  async findAll(reqUsuario) {
    let query, params = [];
    if (reqUsuario.rol === 'estudiante') {
      query = `
        SELECT e.id_evaluacion AS id, e.tipo, e.titulo, e.calificacion,
               e.comentarios, e.fecha,
               p.titulo AS proyecto, p.id_proyecto,
               doc.nombre AS docente
        FROM evaluaciones e
        INNER JOIN proyectos p ON p.id_proyecto = e.id_proyecto
        INNER JOIN usuarios doc ON doc.id_usuario = e.id_docente
        WHERE e.id_estudiante = ?
        ORDER BY e.fecha DESC`;
      params = [reqUsuario.id];
    } else if (reqUsuario.rol === 'docente') {
      query = `
        SELECT e.id_evaluacion AS id, e.tipo, e.titulo, e.calificacion,
               e.comentarios, e.fecha,
               p.titulo AS proyecto, p.id_proyecto,
               est.nombre AS estudiante, est.apellido,
               doc.nombre AS docente
        FROM evaluaciones e
        INNER JOIN proyectos p ON p.id_proyecto = e.id_proyecto
        INNER JOIN usuarios est ON est.id_usuario = e.id_estudiante
        INNER JOIN usuarios doc ON doc.id_usuario = e.id_docente
        WHERE e.id_docente = ?
        ORDER BY e.fecha DESC`;
      params = [reqUsuario.id];
    } else {
      query = `
        SELECT e.id_evaluacion AS id, e.tipo, e.titulo, e.calificacion,
               e.comentarios, e.fecha,
               p.titulo AS proyecto, p.id_proyecto,
               est.nombre AS estudiante,
               doc.nombre AS docente
        FROM evaluaciones e
        INNER JOIN proyectos p ON p.id_proyecto = e.id_proyecto
        INNER JOIN usuarios est ON est.id_usuario = e.id_estudiante
        INNER JOIN usuarios doc ON doc.id_usuario = e.id_docente
        ORDER BY e.fecha DESC`;
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async findByEstudiante(estudianteId) {
    const [rows] = await pool.query(`
      SELECT e.id_evaluacion AS id, e.tipo, e.titulo, e.calificacion,
             e.comentarios, e.fecha, p.titulo AS proyecto
      FROM evaluaciones e
      INNER JOIN proyectos p ON p.id_proyecto = e.id_proyecto
      WHERE e.id_estudiante = ?
      ORDER BY e.fecha DESC`, [estudianteId]);
    return rows;
  }

  async callPromedioEstudiante(estudianteId) {
    await pool.query('CALL sp_promedio_estudiante(?, @prom, @msg)', [estudianteId]);
    const [[sp]] = await pool.query('SELECT @prom AS promedio_sp, @msg AS mensaje_sp');
    return sp;
  }

  async checkStudentInProject(proyectoId, estudianteId) {
    const [[inscrito]] = await pool.query(
      'SELECT 1 FROM proyecto_estudiantes WHERE id_proyecto = ? AND id_estudiante = ?',
      [proyectoId, estudianteId]
    );
    return !!inscrito;
  }

  async create(data, docenteId) {
    const { id_proyecto, id_estudiante, tipo, titulo, calificacion, comentarios } = data;
    const [result] = await pool.query(
      `INSERT INTO evaluaciones (id_proyecto, id_estudiante, id_docente, tipo, titulo, calificacion, comentarios)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_proyecto, id_estudiante, docenteId, tipo, titulo.trim(),
       calificacion !== undefined ? calificacion : null, comentarios || null]
    );
    return result.insertId;
  }

  async update(id, data, reqUsuario) {
    const { titulo, calificacion, comentarios, tipo } = data;
    const whereExtra = reqUsuario.rol === 'docente' ? 'AND id_docente = ?' : '';
    const params = [titulo, calificacion, comentarios, tipo, id];
    if (reqUsuario.rol === 'docente') params.push(reqUsuario.id);

    const [result] = await pool.query(
      `UPDATE evaluaciones SET
         titulo       = COALESCE(?, titulo),
         calificacion = COALESCE(?, calificacion),
         comentarios  = COALESCE(?, comentarios),
         tipo         = COALESCE(?, tipo)
       WHERE id_evaluacion = ? ${whereExtra}`, params
    );
    return result.affectedRows;
  }

  async delete(id, reqUsuario) {
    const whereExtra = reqUsuario.rol === 'docente' ? 'AND id_docente = ?' : '';
    const params = reqUsuario.rol === 'docente' ? [id, reqUsuario.id] : [id];

    const [result] = await pool.query(
      `DELETE FROM evaluaciones WHERE id_evaluacion = ? ${whereExtra}`, params
    );
    return result.affectedRows;
  }
}

module.exports = new EvaluacionRepository();
