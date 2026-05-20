// repositories/proyectoRepository.js
const mongoose = require('mongoose'); // ← agregado
const Proyecto = require('../models/mongo/proyecto.model');
const Tarea = require('../models/mongo/tarea.model');
const Evaluacion = require('../models/mongo/evaluacion.model');
const { Usuario } = require('../models/mongo/usuario.model');

async function calcularAvance(proyectoId) {
  const [total, completadas] = await Promise.all([
    Tarea.countDocuments({ id_proyecto: proyectoId }),
    Tarea.countDocuments({ id_proyecto: proyectoId, completada: true }),
  ]);
  if (total === 0) return 0;
  return Math.round((completadas / total) * 100);
}

class ProyectoRepository {
  async _enrich(docs) {
    return Promise.all(
      docs.map(async (p) => {
        const avance_pct = await calcularAvance(p._id);
        return {
          id: p._id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          fecha_inicio: p.fecha_inicio,
          fecha_limite: p.fecha_limite,
          estado: p.estado,
          docente: p.id_docente?.nombre || null,
          lider_nombre: p.id_docente
            ? `${p.id_docente.nombre} ${p.id_docente.apellido || ''}`.trim()
            : null,
          email_docente: p.id_docente?.email || null,
          id_docente: p.id_docente?._id || null,
          total_estudiantes: p.estudiantes?.length ?? 0,
          avance_pct,
        };
      })
    );
  }

  async findAllByStudent(estudianteId) {
    const docs = await Proyecto.find({ estudiantes: estudianteId })
      .populate('id_docente', 'nombre apellido email')
      .sort({ fecha_limite: 1 })
      .lean();
    return this._enrich(docs);
  }

  async findAllByDocente(docenteId) {
    const docs = await Proyecto.find({ id_docente: docenteId })
      .populate('id_docente', 'nombre apellido email')
      .sort({ fecha_limite: 1 })
      .lean();
    return this._enrich(docs);
  }

  async findAll() {
    const docs = await Proyecto.find()
      .populate('id_docente', 'nombre apellido email')
      .sort({ fecha_limite: 1 })
      .lean();
    return this._enrich(docs);
  }

  async findById(id) {
    const p = await Proyecto.findById(id)
      .populate('id_docente', 'nombre apellido email')
      .lean();
    if (!p) return null;
    const [enriched] = await this._enrich([p]);
    return enriched;
  }

  async getProyectoTareas(id) {
    const tareas = await Tarea.find({ id_proyecto: id })
      .populate('id_estudiante', 'nombre apellido')
      .sort({ completada: 1, fecha_limite: 1 })
      .lean();

    return tareas.map((t) => ({
      id: t._id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      prioridad: t.prioridad,
      completada: t.completada,
      fecha_limite: t.fecha_limite,
      created_at: t.createdAt,
      asignado_a: t.id_estudiante?.nombre || null,
      id_estudiante: t.id_estudiante?._id || null,
      estado: t.completada
        ? 'completada'
        : (t.fecha_limite && new Date(t.fecha_limite) < new Date() ? 'vencida' : 'pendiente'),
    }));
  }

  async getProyectoEstudiantes(id) {
    const p = await Proyecto.findById(id)
      .populate('estudiantes', 'nombre apellido email')
      .lean();
    if (!p) return [];
    return (p.estudiantes || []).map((u) => ({
      id: u._id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
    }));
  }

  async getProyectoEvaluaciones(id) {
    const evals = await Evaluacion.find({ id_proyecto: id })
      .populate('id_estudiante', 'nombre')
      .populate('id_docente', 'nombre')
      .sort({ fecha: -1 })
      .lean();

    return evals.map((e) => ({
      id: e._id,
      tipo: e.tipo,
      titulo: e.titulo,
      calificacion: e.calificacion,
      comentarios: e.comentarios,
      fecha: e.fecha,
      estudiante: e.id_estudiante?.nombre || null,
      docente: e.id_docente?.nombre || null,
    }));
  }

  async create(docenteId, data) {
    const { titulo, descripcion, fecha_inicio, fecha_limite, estado } = data;
    const proyecto = new Proyecto({
      titulo: titulo.trim(),
      descripcion: descripcion || null,
      fecha_inicio: fecha_inicio || null,
      fecha_limite,
      estado: estado || 'activo',
      id_docente: new mongoose.Types.ObjectId(docenteId.toString()), // ← fix
      estudiantes: [],
    });
    const saved = await proyecto.save();
    return saved._id;
  }

  async update(id, data) {
    const { titulo, descripcion, fecha_inicio, fecha_limite, estado, id_docente } = data;
    const updateFields = {};
    if (titulo !== undefined) updateFields.titulo = titulo;
    if (descripcion !== undefined) updateFields.descripcion = descripcion;
    if (fecha_inicio !== undefined) updateFields.fecha_inicio = fecha_inicio;
    if (fecha_limite !== undefined) updateFields.fecha_limite = fecha_limite;
    if (estado !== undefined) updateFields.estado = estado;
    if (id_docente !== undefined) updateFields.id_docente = new mongoose.Types.ObjectId(id_docente.toString()); // ← fix consistente

    const result = await Proyecto.findByIdAndUpdate(id, updateFields, { new: true });
    return result ? 1 : 0;
  }

  async delete(id) {
    const result = await Proyecto.findByIdAndDelete(id);
    return result ? 1 : 0;
  }

  async assignStudent(proyectoId, estudianteId) {
    const proyecto = await Proyecto.findById(proyectoId);
    if (!proyecto) return 'ERROR: Proyecto no encontrado';

    const yaAsignado = proyecto.estudiantes.some(
      (e) => e.toString() === estudianteId.toString()
    );
    if (yaAsignado) return 'ERROR: El estudiante ya está asignado al proyecto';

    proyecto.estudiantes.push(estudianteId);
    await proyecto.save();
    return 'OK: Estudiante asignado correctamente';
  }

  async removeStudent(proyectoId, estudianteId) {
    const result = await Proyecto.findByIdAndUpdate(
      proyectoId,
      { $pull: { estudiantes: estudianteId } },
      { new: true }
    );
    return result ? 1 : 0;
  }

  async checkStudentInProject(proyectoId, estudianteId) {
    const p = await Proyecto.findOne({
      _id: proyectoId,
      estudiantes: estudianteId,
    }).lean();
    return !!p;
  }
}

module.exports = new ProyectoRepository();