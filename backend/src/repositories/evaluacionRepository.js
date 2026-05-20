// repositories/evaluacionRepository.js — Mongoose (MongoDB)
const Evaluacion = require('../models/mongo/evaluacion.model');
const Proyecto   = require('../models/mongo/proyecto.model');

class EvaluacionRepository {
  async findAll(reqUsuario) {
    const filtro = {};

    if (reqUsuario.rol === 'estudiante') {
      filtro.id_estudiante = reqUsuario.id;
    } else if (reqUsuario.rol === 'docente') {
      filtro.id_docente = reqUsuario.id;
    }
    // admin: sin filtro

    const evals = await Evaluacion.find(filtro)
      .populate('id_proyecto', 'titulo')
      .populate('id_estudiante', 'nombre apellido')
      .populate('id_docente', 'nombre')
      .sort({ fecha: -1 })
      .lean();

    return evals.map((e) => ({
      id:           e._id,
      tipo:         e.tipo,
      titulo:       e.titulo,
      calificacion: e.calificacion,
      comentarios:  e.comentarios,
      fecha:        e.fecha,
      proyecto:     e.id_proyecto?.titulo || null,
      id_proyecto:  e.id_proyecto?._id || null,
      estudiante:   e.id_estudiante?.nombre || null,
      apellido:     e.id_estudiante?.apellido || null,
      docente:      e.id_docente?.nombre || null,
    }));
  }

  async findByEstudiante(estudianteId) {
    const evals = await Evaluacion.find({ id_estudiante: estudianteId })
      .populate('id_proyecto', 'titulo')
      .sort({ fecha: -1 })
      .lean();

    return evals.map((e) => ({
      id:           e._id,
      tipo:         e.tipo,
      titulo:       e.titulo,
      calificacion: e.calificacion,
      comentarios:  e.comentarios,
      fecha:        e.fecha,
      proyecto:     e.id_proyecto?.titulo || null,
    }));
  }

  // Equivalente a sp_promedio_estudiante
  async callPromedioEstudiante(estudianteId) {
    const evals = await Evaluacion.find({
      id_estudiante: estudianteId,
      calificacion: { $ne: null },
    })
      .select('calificacion')
      .lean();

    if (evals.length === 0) {
      return { promedio_sp: null, mensaje_sp: 'Sin evaluaciones' };
    }
    const sum = evals.reduce((acc, e) => acc + e.calificacion, 0);
    const promedio = Math.round((sum / evals.length) * 100) / 100;
    return {
      promedio_sp: promedio,
      mensaje_sp: `Promedio calculado sobre ${evals.length} evaluación(es)`,
    };
  }

  async checkStudentInProject(proyectoId, estudianteId) {
    const p = await Proyecto.findOne({
      _id: proyectoId,
      estudiantes: estudianteId,
    }).lean();
    return !!p;
  }

  async create(data, docenteId) {
    const { id_proyecto, id_estudiante, tipo, titulo, calificacion, comentarios } = data;
    const evaluacion = new Evaluacion({
      id_proyecto,
      id_estudiante,
      id_docente: docenteId,
      tipo: tipo || 'entrega',
      titulo: titulo.trim(),
      calificacion: calificacion !== undefined ? calificacion : null,
      comentarios: comentarios || null,
    });
    const saved = await evaluacion.save();
    return saved._id;
  }

  async update(id, data, reqUsuario) {
    const { titulo, calificacion, comentarios, tipo } = data;
    const filtro = { _id: id };
    if (reqUsuario.rol === 'docente') filtro.id_docente = reqUsuario.id;

    const updateFields = {};
    if (titulo      !== undefined) updateFields.titulo      = titulo;
    if (calificacion !== undefined) updateFields.calificacion = calificacion;
    if (comentarios !== undefined) updateFields.comentarios = comentarios;
    if (tipo        !== undefined) updateFields.tipo        = tipo;

    const result = await Evaluacion.findOneAndUpdate(filtro, updateFields, { new: true });
    return result ? 1 : 0;
  }

  async delete(id, reqUsuario) {
    const filtro = { _id: id };
    if (reqUsuario.rol === 'docente') filtro.id_docente = reqUsuario.id;
    const result = await Evaluacion.findOneAndDelete(filtro);
    return result ? 1 : 0;
  }
}

module.exports = new EvaluacionRepository();
