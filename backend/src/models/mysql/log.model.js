// models/mysql/log.model.js — Modelo de Auditoría
const { pool } = require('../../config/mysql');

class LogModel {
  /**
   * Retorna registros de la tabla auditoria con filtros opcionales
   * @param {Object} filtros - { tabla, operacion, usuario_db, fecha_inicio, fecha_fin, limite }
   */
  async getAuditoria({ tabla, operacion, usuario_db, fecha_inicio, fecha_fin, limite = 200 } = {}) {
    const conditions = [];
    const params = [];

    if (tabla) {
      conditions.push('tabla_afectada = ?');
      params.push(tabla);
    }
    if (operacion) {
      conditions.push('operacion = ?');
      params.push(operacion.toUpperCase());
    }
    if (usuario_db) {
      conditions.push('usuario_db LIKE ?');
      params.push(`%${usuario_db}%`);
    }
    if (fecha_inicio) {
      conditions.push('DATE(fecha_hora) >= ?');
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      conditions.push('DATE(fecha_hora) <= ?');
      params.push(fecha_fin);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id_auditoria, tabla_afectada, operacion, id_registro, usuario_db,
             datos_anteriores, datos_nuevos, fecha_hora
      FROM auditoria
      ${where}
      ORDER BY fecha_hora DESC
      LIMIT ?
    `;
    params.push(parseInt(limite, 10) || 200);

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Estadísticas de auditoría agrupadas por día y operación
   */
  async getEstadisticas() {
    const [rows] = await pool.query(`
      SELECT 
        DATE(fecha_hora) AS fecha,
        operacion,
        tabla_afectada,
        COUNT(*) AS total
      FROM auditoria
      GROUP BY DATE(fecha_hora), operacion, tabla_afectada
      ORDER BY fecha DESC
      LIMIT 90
    `);
    return rows;
  }

  /**
   * Resumen global de operaciones
   */
  async getResumen() {
    const [rows] = await pool.query(`
      SELECT 
        operacion,
        COUNT(*) AS total,
        MAX(fecha_hora) AS ultima_vez
      FROM auditoria
      GROUP BY operacion
    `);
    return rows;
  }

  /**
   * Insertar entrada manual (para uso desde el backend)
   */
  async insertar({ tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores = null, datos_nuevos = null }) {
    const [result] = await pool.query(
      `INSERT INTO auditoria 
       (tabla_afectada, operacion, id_registro, usuario_db, datos_anteriores, datos_nuevos)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tabla_afectada,
        operacion.toUpperCase(),
        id_registro,
        usuario_db || 'api_backend',
        datos_anteriores ? JSON.stringify(datos_anteriores) : null,
        datos_nuevos    ? JSON.stringify(datos_nuevos)    : null,
      ]
    );
    return result.insertId;
  }
}

module.exports = new LogModel();
