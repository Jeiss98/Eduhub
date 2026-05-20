// services/proyectoService.js
const proyectoRepository = require('../repositories/proyectoRepository');

class ProyectoService {
  async getProyectos(reqUsuario) {
    if (reqUsuario.rol === 'estudiante') {
      return await proyectoRepository.findAllByStudent(reqUsuario.id);
    } else if (reqUsuario.rol === 'docente') {
      return await proyectoRepository.findAllByDocente(reqUsuario.id);
    } else {
      return await proyectoRepository.findAll();
    }
  }

  async getProyectoDetail(id) {
    const proyecto = await proyectoRepository.findById(id);
    if (!proyecto) {
      throw { status: 404, message: 'Proyecto no encontrado.' };
    }
    const tareas = await proyectoRepository.getProyectoTareas(id);
    const estudiantes = await proyectoRepository.getProyectoEstudiantes(id);
    const evaluaciones = await proyectoRepository.getProyectoEvaluaciones(id);

    return { ...proyecto, tareas, estudiantes, evaluaciones };
  }

  async createProyecto(reqUsuario, data) {
    let docenteId = reqUsuario.rol === 'admin' && data.id_docente ? data.id_docente : reqUsuario.id;
    
    // Fallback for old tokens where reqUsuario.id is undefined
    if (!docenteId && reqUsuario.email) {
      const { Usuario } = require('../models/mongo/usuario.model');
      const userDoc = await Usuario.findOne({ email: reqUsuario.email });
      if (userDoc) docenteId = userDoc._id;
    }

    const newId = await proyectoRepository.create(docenteId, data);
    return newId;
  }

  async updateProyecto(id, data, reqUsuario) {
    if (reqUsuario.rol === 'docente') {
      const p = await proyectoRepository.findById(id);
      if (!p) throw { status: 404, message: 'Proyecto no encontrado.' };
      if (p.id_docente !== reqUsuario.id) {
        throw { status: 403, message: 'Solo puedes editar tus propios proyectos.' };
      }
    }

    const affectedRows = await proyectoRepository.update(id, data);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Proyecto no encontrado.' };
    }
  }

  async deleteProyecto(id) {
    const affectedRows = await proyectoRepository.delete(id);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Proyecto no encontrado.' };
    }
  }

  async assignStudent(proyectoId, estudianteId) {
    const resultado = await proyectoRepository.assignStudent(proyectoId, estudianteId);
    if (resultado.startsWith('ERROR')) {
      throw { status: 400, message: resultado.replace('ERROR: ', '') };
    }
    return resultado.replace('OK: ', '');
  }

  async removeStudent(proyectoId, estudianteId) {
    const affectedRows = await proyectoRepository.removeStudent(proyectoId, estudianteId);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Estudiante no encontrado en el proyecto.' };
    }
  }
}

module.exports = new ProyectoService();
