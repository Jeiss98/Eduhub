// repositories/tareaRepository.js — Mongoose (MongoDB)
const Tarea   = require('../models/mongo/tarea.model');
const Proyecto = require('../models/mongo/proyecto.model');

class TareaRepository {
  async findAll(queryParams, reqUsuario) {
    const { proyecto_id, estado, prioridad } = queryParams;
    const filtro = {};

    if (reqUsuario.rol === 'estudiante') {
      filtro.id_estudiante = reqUsuario.id;
    } else if (reqUsuario.rol === 'docente') {
      // Obtener proyectos del docente
      const proyectosDocente = await Proyecto.find({ id_docente: reqUsuario.id })
        .select('_id')
        .lean();
      const ids = proyectosDocente.map((p) => p._id);
      filtro.id_proyecto = { $in: ids };
    }
    // admin: sin filtro de dueño

    if (proyecto_id) filtro.id_proyecto = proyecto_id;
    if (prioridad)   filtro.prioridad   = prioridad;
    if (estado === 'completada') filtro.completada = true;
    if (estado === 'pendiente')  filtro.completada = false;

    const tareas = await Tarea.find(filtro)
      .populate('id_proyecto', 'titulo')
      .populate('id_estudiante', 'nombre apellido')
      .sort({ completada: 1, fecha_limite: 1 })
      .lean();

    return tareas.map((t) => ({
      id:           t._id,
      titulo:       t.titulo,
      descripcion:  t.descripcion,
      prioridad:    t.prioridad,
      completada:   t.completada,
      fecha_limite: t.fecha_limite,
      created_at:   t.createdAt,
      proyecto:     t.id_proyecto?.titulo || null,
      id_proyecto:  t.id_proyecto?._id || null,
      estudiante:   t.id_estudiante?.nombre || null,
      estado_actual: t.completada
        ? 'completada'
        : (t.fecha_limite && new Date(t.fecha_limite) < new Date() ? 'vencida' : 'pendiente'),
    }));
  }

  async findById(id) {
    const t = await Tarea.findById(id)
      .populate('id_proyecto', 'titulo')
      .populate('id_estudiante', 'nombre apellido email')
      .lean();
    if (!t) return null;
    return {
      id:              t._id,
      titulo:          t.titulo,
      descripcion:     t.descripcion,
      prioridad:       t.prioridad,
      completada:      t.completada,
      fecha_limite:    t.fecha_limite,
      created_at:      t.createdAt,
      proyecto:        t.id_proyecto?.titulo || null,
      id_proyecto:     t.id_proyecto?._id || null,
      estudiante:      t.id_estudiante?.nombre || null,
      email_estudiante:t.id_estudiante?.email || null,
      estado_actual:   t.completada
        ? 'completada'
        : (t.fecha_limite && new Date(t.fecha_limite) < new Date() ? 'vencida' : 'pendiente'),
    };
  }

  async checkStudentInProject(proyectoId, estudianteId) {
    const p = await Proyecto.findOne({
      _id: proyectoId,
      estudiantes: estudianteId,
    }).lean();
    return !!p;
  }

  async create(data) {
    const { id_proyecto, id_estudiante, titulo, descripcion, prioridad, fecha_limite } = data;
    const tarea = new Tarea({
      id_proyecto,
      id_estudiante,
      titulo: titulo.trim(),
      descripcion: descripcion || null,
      prioridad: prioridad || 'media',
      fecha_limite: fecha_limite || null,
    });
    const saved = await tarea.save();
    return saved._id;
  }

  async completeTarea(id, estudianteId = null) {
    const filtro = { _id: id };
    if (estudianteId) filtro.id_estudiante = estudianteId;
    const result = await Tarea.findOneAndUpdate(filtro, { completada: true }, { new: true });
    return result ? 1 : 0;
  }

  async update(id, data) {
    const { titulo, descripcion, prioridad, fecha_limite, completada } = data;
    const updateFields = {};
    if (titulo       !== undefined) updateFields.titulo       = titulo;
    if (descripcion  !== undefined) updateFields.descripcion  = descripcion;
    if (prioridad    !== undefined) updateFields.prioridad    = prioridad;
    if (fecha_limite !== undefined) updateFields.fecha_limite = fecha_limite;
    if (completada   !== undefined) updateFields.completada   = !!completada;

    const result = await Tarea.findByIdAndUpdate(id, updateFields, { new: true });
    return result ? 1 : 0;
  }

  async delete(id) {
    const result = await Tarea.findByIdAndDelete(id);
    return result ? 1 : 0;
  }
}

module.exports = new TareaRepository();
