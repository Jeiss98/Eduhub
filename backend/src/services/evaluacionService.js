// services/evaluacionService.js
const evaluacionRepository = require('../repositories/evaluacionRepository');

class EvaluacionService {
  async getEvaluaciones(reqUsuario) {
    const rows = await evaluacionRepository.findAll(reqUsuario);
    const notas = rows.filter(r => r.calificacion !== null).map(r => parseFloat(r.calificacion));
    const promedio = notas.length > 0 ? (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(2) : null;

    return { data: rows, promedio, total: rows.length };
  }

  async getEvaluacionesEstudiante(estudianteId) {
    const rows = await evaluacionRepository.findByEstudiante(estudianteId);
    const notas = rows.filter(r => r.calificacion !== null).map(r => parseFloat(r.calificacion));
    const promedio = notas.length > 0 ? (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(2) : null;

    const sp = await evaluacionRepository.callPromedioEstudiante(estudianteId);

    return { data: rows, promedio, promedio_sp: sp.promedio_sp, mensaje_sp: sp.mensaje_sp };
  }

  async createEvaluacion(data, docenteId) {
    const isEnrolled = await evaluacionRepository.checkStudentInProject(data.id_proyecto, data.id_estudiante);
    if (!isEnrolled) {
      throw { status: 400, message: 'El estudiante no pertenece a ese proyecto.' };
    }
    const newId = await evaluacionRepository.create(data, docenteId);
    return newId;
  }

  async updateEvaluacion(id, data, reqUsuario) {
    const affectedRows = await evaluacionRepository.update(id, data, reqUsuario);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Evaluación no encontrada o sin permiso.' };
    }
  }

  async deleteEvaluacion(id, reqUsuario) {
    const affectedRows = await evaluacionRepository.delete(id, reqUsuario);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Evaluación no encontrada o sin permiso.' };
    }
  }
}

module.exports = new EvaluacionService();
