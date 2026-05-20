// models/mongo/proyecto.model.js — Modelo Mongoose de Proyecto
const mongoose = require('mongoose');

const proyectoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      default: null,
    },
    fecha_inicio: {
      type: Date,
      default: null,
    },
    fecha_limite: {
      type: Date,
      required: [true, 'La fecha límite es obligatoria'],
    },
    estado: {
      type: String,
      enum: ['activo', 'pausado', 'finalizado'],
      default: 'activo',
    },
    id_docente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    // Array de ObjectIds de estudiantes asignados
    estudiantes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
  },
  {
    timestamps: true,
    collection: 'proyectos',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: porcentaje de avance calculado a partir de las tareas (se calcula en el repositorio)
proyectoSchema.index({ id_docente: 1 });
proyectoSchema.index({ estado: 1 });
proyectoSchema.index({ 'estudiantes': 1 });

const Proyecto = mongoose.model('Proyecto', proyectoSchema);
module.exports = Proyecto;
