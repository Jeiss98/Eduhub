// controllers/reporteController.js
const reporteService = require('../services/reporteService');
const { generarPDF } = require('../utils/pdfGenerator');

class ReporteController {
  async getDashboard(req, res, next) {
    try {
      const stats = await reporteService.getDashboard();
      res.json({ ok: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getProyectos(req, res, next) {
    try {
      const rows = await reporteService.getProyectos();
      
      if (req.query.formato === 'pdf') {
        return generarPDF(res, 'Reporte de Proyectos', rows, [
          { key: 'titulo',          label: 'Proyecto' },
          { key: 'docente',         label: 'Docente' },
          { key: 'estado',          label: 'Estado' },
          { key: 'estudiantes',     label: 'Estudiantes' },
          { key: 'avance_pct',      label: 'Avance %' },
          { key: 'calificacion_prom', label: 'Nota Prom.' },
          { key: 'fecha_limite',    label: 'Límite' },
        ]);
      }

      res.json({ ok: true, data: rows });
    } catch (error) {
      next(error);
    }
  }

  async getTareasVencidas(req, res, next) {
    try {
      const rows = await reporteService.getTareasVencidas();

      if (req.query.formato === 'pdf') {
        return generarPDF(res, 'Reporte — Tareas Vencidas', rows, [
          { key: 'tarea',      label: 'Tarea' },
          { key: 'estudiante', label: 'Estudiante' },
          { key: 'proyecto',   label: 'Proyecto' },
          { key: 'prioridad',  label: 'Prioridad' },
          { key: 'fecha_limite', label: 'Venció' },
        ]);
      }

      res.json({ ok: true, data: rows, total: rows.length });
    } catch (error) {
      next(error);
    }
  }

  async getEstudiantes(req, res, next) {
    try {
      const rows = await reporteService.getEstudiantes();
      res.json({ ok: true, data: rows });
    } catch (error) {
      next(error);
    }
  }

  async generarPdfTipo(req, res, next) {
    try {
      const { tipo } = req.params;
      let rows, titulo, columnas;

      if (tipo === 'usuarios') {
        rows = await reporteService.getEstudiantes();
        titulo = 'Reporte de Estudiantes';
        columnas = [
          { key: 'nombre',           label: 'Nombre' },
          { key: 'email',            label: 'Email' },
          { key: 'proyectos',        label: 'Proyectos' },
          { key: 'promedio',         label: 'Promedio' },
          { key: 'tareas_pendientes', label: 'Pendientes' },
        ];
      } else if (tipo === 'proyectos') {
        rows = await reporteService.getProyectos();
        titulo = 'Reporte de Proyectos';
        columnas = [
          { key: 'titulo',          label: 'Proyecto' },
          { key: 'docente',         label: 'Docente' },
          { key: 'estado',          label: 'Estado' },
          { key: 'estudiantes',     label: 'Estudiantes' },
          { key: 'avance_pct',      label: 'Avance %' },
        ];
      } else if (tipo === 'notas') {
        rows = await reporteService.getProyectos(); 
        titulo = 'Rendimiento Académico por Proyecto';
        columnas = [
          { key: 'titulo',          label: 'Proyecto' },
          { key: 'calificacion_prom', label: 'Nota Promedio' },
          { key: 'docente',         label: 'Docente' },
          { key: 'estudiantes',     label: 'Estudiantes' },
        ];
      } else {
        return res.status(400).json({ ok: false, message: 'Tipo de reporte no soportado' });
      }

      return generarPDF(res, titulo, rows, columnas);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReporteController();
