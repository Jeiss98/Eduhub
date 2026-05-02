// controllers/auditoriaController.js
const logModel = require('../models/mysql/log.model');
const { generarPDF } = require('../utils/pdfGenerator');

class AuditoriaController {
  /**
   * GET /api/auditoria — lista con filtros opcionales
   * Query params: tabla, operacion, usuario_db, fecha_inicio, fecha_fin, limite
   */
  async getAuditoria(req, res, next) {
    try {
      const { tabla, operacion, usuario_db, fecha_inicio, fecha_fin, limite, formato } = req.query;

      const rows = await logModel.getAuditoria({
        tabla, operacion, usuario_db, fecha_inicio, fecha_fin, limite,
      });

      if (formato === 'pdf') {
        return generarPDF(res, 'Reporte de Auditoría', rows, [
          { key: 'id_auditoria',   label: '#' },
          { key: 'tabla_afectada', label: 'Tabla' },
          { key: 'operacion',      label: 'Operación' },
          { key: 'id_registro',    label: 'ID Reg.' },
          { key: 'usuario_db',     label: 'Usuario DB' },
          { key: 'fecha_hora',     label: 'Fecha / Hora' },
        ]);
      }

      res.json({ ok: true, total: rows.length, data: rows });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auditoria/estadisticas — agrupado por día
   */
  async getEstadisticas(req, res, next) {
    try {
      const stats = await logModel.getEstadisticas();
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
      const resumen = await logModel.getResumen();
      res.json({ ok: true, data: resumen });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditoriaController();
