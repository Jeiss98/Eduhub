// controllers/auditoriaController.js — Mongoose (MongoDB)
const Auditoria = require('../models/mongo/auditoria.model');
const { generarPDF } = require('../utils/pdfGenerator');

class AuditoriaController {
  /**
   * GET /api/auditoria — lista con filtros opcionales
   * Query params: tabla, operacion, usuario_db, fecha_inicio, fecha_fin, limite, formato
   */
  async getAuditoria(req, res, next) {
    try {
      const { tabla, operacion, usuario_db, fecha_inicio, fecha_fin, limite = 200, formato } = req.query;
      const filtro = {};

      if (tabla)      filtro.tabla_afectada = tabla;
      if (operacion)  filtro.operacion      = operacion.toUpperCase();
      if (usuario_db) filtro.usuario_db     = { $regex: usuario_db, $options: 'i' };
      if (fecha_inicio || fecha_fin) {
        filtro.fecha_hora = {};
        if (fecha_inicio) filtro.fecha_hora.$gte = new Date(fecha_inicio);
        if (fecha_fin)    filtro.fecha_hora.$lte = new Date(`${fecha_fin}T23:59:59`);
      }

      const rows = await Auditoria.find(filtro)
        .sort({ fecha_hora: -1 })
        .limit(parseInt(limite, 10) || 200)
        .lean();

      // Normalizar campo para compatibilidad con el PDF generador
      const data = rows.map((r) => ({
        id_auditoria:    r._id,
        tabla_afectada:  r.tabla_afectada,
        operacion:       r.operacion,
        id_registro:     r.id_registro,
        usuario_db:      r.usuario_db,
        datos_anteriores:r.datos_anteriores,
        datos_nuevos:    r.datos_nuevos,
        fecha_hora:      r.fecha_hora,
      }));

      if (formato === 'pdf') {
        return generarPDF(res, 'Reporte de Auditoría', data, [
          { key: 'id_auditoria',   label: '#' },
          { key: 'tabla_afectada', label: 'Tabla' },
          { key: 'operacion',      label: 'Operación' },
          { key: 'id_registro',    label: 'ID Reg.' },
          { key: 'usuario_db',     label: 'Usuario DB' },
          { key: 'fecha_hora',     label: 'Fecha / Hora' },
        ]);
      }

      res.json({ ok: true, total: data.length, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auditoria/estadisticas — agrupado por día y operación
   */
  async getEstadisticas(req, res, next) {
    try {
      const stats = await Auditoria.aggregate([
        {
          $group: {
            _id: {
              fecha: { $dateToString: { format: '%Y-%m-%d', date: '$fecha_hora' } },
              operacion: '$operacion',
              tabla_afectada: '$tabla_afectada',
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            fecha: '$_id.fecha',
            operacion: '$_id.operacion',
            tabla_afectada: '$_id.tabla_afectada',
            total: 1,
          },
        },
        { $sort: { fecha: -1 } },
        { $limit: 90 },
      ]);

      res.json({ ok: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auditoria/resumen — totales por operación
   */
  async getResumen(req, res, next) {
    try {
      const resumen = await Auditoria.aggregate([
        {
          $group: {
            _id: '$operacion',
            total: { $sum: 1 },
            ultima_vez: { $max: '$fecha_hora' },
          },
        },
        {
          $project: {
            _id: 0,
            operacion: '$_id',
            total: 1,
            ultima_vez: 1,
          },
        },
      ]);

      res.json({ ok: true, data: resumen });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditoriaController();
