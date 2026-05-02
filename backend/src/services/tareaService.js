// services/tareaService.js
const tareaRepository = require('../repositories/tareaRepository');

class TareaService {
  async getTareas(queryParams, reqUsuario) {
    return await tareaRepository.findAll(queryParams, reqUsuario);
  }

  async getTareaById(id) {
    const tarea = await tareaRepository.findById(id);
    if (!tarea) throw { status: 404, message: 'Tarea no encontrada.' };
    return tarea;
  }

  async createTarea(data) {
    const isEnrolled = await tareaRepository.checkStudentInProject(data.id_proyecto, data.id_estudiante);
    if (!isEnrolled) {
      throw { status: 400, message: 'El estudiante no está inscrito en ese proyecto.' };
    }
    const newId = await tareaRepository.create(data);
    return newId;
  }

  async completeTarea(id, reqUsuario) {
    const estudianteId = reqUsuario.rol === 'estudiante' ? reqUsuario.id : null;
    const affectedRows = await tareaRepository.completeTarea(id, estudianteId);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Tarea no encontrada o sin permiso.' };
    }
  }

  async updateTarea(id, data) {
    const affectedRows = await tareaRepository.update(id, data);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Tarea no encontrada.' };
    }
  }

  async deleteTarea(id) {
    const affectedRows = await tareaRepository.delete(id);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Tarea no encontrada.' };
    }
  }
}

module.exports = new TareaService();
