// repositories/reporteRepository.js — Mongoose (MongoDB)
const { Usuario }  = require('../models/mongo/usuario.model');
const Proyecto     = require('../models/mongo/proyecto.model');
const Tarea        = require('../models/mongo/tarea.model');
const Evaluacion   = require('../models/mongo/evaluacion.model');

// Helper: calcular avance de proyecto
async function calcularAvance(proyectoId) {
  const [total, completadas] = await Promise.all([
    Tarea.countDocuments({ id_proyecto: proyectoId }),
    Tarea.countDocuments({ id_proyecto: proyectoId, completada: true }),
  ]);
  return total === 0 ? 0 : Math.round((completadas / total) * 100);
}

// Helper: calcular promedio de calificaciones de un estudiante
async function calcularPromedioEstudiante(estudianteId) {
  const result = await Evaluacion.aggregate([
    { $match: { id_estudiante: estudianteId, calificacion: { $ne: null } } },
    { $group: { _id: null, prom: { $avg: '$calificacion' } } },
  ]);
  return result.length > 0 ? Math.round(result[0].prom * 100) / 100 : null;
}

class ReporteRepository {
  async getDashboardStats() {
    const hoy = new Date();

    const [
      usuariosActivos,
      proyectosActivos,
      tareasPendientes,
      promGeneral,
      topProyectosDocs,
      topEstudiantesDocs,
    ] = await Promise.all([
      Usuario.countDocuments({ activo: true }),
      Proyecto.countDocuments({ estado: 'activo' }),
      Tarea.countDocuments({ completada: false }),
      Evaluacion.aggregate([
        { $match: { calificacion: { $ne: null } } },
        { $group: { _id: null, prom: { $avg: '$calificacion' } } },
      ]),
      Proyecto.find().sort({ createdAt: -1 }).limit(5).lean(),
      Usuario.find({ rol: 'estudiante', activo: true }).select('_id nombre').limit(5).lean(),
    ]);

    // Enriquecer top proyectos
    const top_proyectos = await Promise.all(
      topProyectosDocs.map(async (p) => ({
        titulo: p.titulo,
        estado: p.estado,
        avance: await calcularAvance(p._id),
      }))
    );

    // Enriquecer top estudiantes
    const top_estudiantes = await Promise.all(
      topEstudiantesDocs.map(async (u) => ({
        nombre:   u.nombre,
        promedio: await calcularPromedioEstudiante(u._id),
      }))
    );
    top_estudiantes.sort((a, b) => (b.promedio || 0) - (a.promedio || 0));

    return {
      usuarios_activos:   usuariosActivos,
      proyectos_activos:  proyectosActivos,
      tareas_pendientes:  tareasPendientes,
      promedio_general:   promGeneral.length > 0
        ? Math.round(promGeneral[0].prom * 100) / 100
        : null,
      top_proyectos,
      top_estudiantes,
    };
  }

  async getProyectosReport() {
    const proyectos = await Proyecto.find()
      .populate('id_docente', 'nombre')
      .lean();

    return Promise.all(
      proyectos.map(async (p) => {
        const [avance_pct, calificaciones] = await Promise.all([
          calcularAvance(p._id),
          Evaluacion.aggregate([
            { $match: { id_proyecto: p._id, calificacion: { $ne: null } } },
            { $group: { _id: null, prom: { $avg: '$calificacion' } } },
          ]),
        ]);
        return {
          id:               p._id,
          titulo:           p.titulo,
          estado:           p.estado,
          fecha_limite:     p.fecha_limite,
          docente:          p.id_docente?.nombre || null,
          estudiantes:      p.estudiantes?.length ?? 0,
          avance_pct,
          calificacion_prom: calificaciones.length > 0
            ? Math.round(calificaciones[0].prom * 100) / 100
            : null,
        };
      })
    );
  }

  async getTareasVencidas() {
    const hoy = new Date();
    const tareas = await Tarea.find({
      completada: false,
      fecha_limite: { $lt: hoy },
    })
      .populate('id_estudiante', 'nombre email')
      .populate('id_proyecto', 'titulo')
      .sort({ fecha_limite: 1 })
      .lean();

    return tareas.map((t) => ({
      tarea:        t.titulo,
      prioridad:    t.prioridad,
      fecha_limite: t.fecha_limite,
      estudiante:   t.id_estudiante?.nombre || null,
      email:        t.id_estudiante?.email || null,
      proyecto:     t.id_proyecto?.titulo || null,
    }));
  }

  async getEstudiantesReport() {
    const estudiantes = await Usuario.find({ rol: 'estudiante', activo: true })
      .select('_id nombre apellido email')
      .lean();

    return Promise.all(
      estudiantes.map(async (u) => {
        const [promedio, tareasPend, proyectosCount] = await Promise.all([
          calcularPromedioEstudiante(u._id),
          Tarea.countDocuments({ id_estudiante: u._id, completada: false }),
          Proyecto.countDocuments({ estudiantes: u._id }),
        ]);
        return {
          id:               u._id,
          nombre:           u.nombre,
          apellido:         u.apellido,
          email:            u.email,
          promedio,
          tareas_pendientes: tareasPend,
          proyectos:         proyectosCount,
        };
      })
    );
  }
}

module.exports = new ReporteRepository();
