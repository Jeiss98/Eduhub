// models/mongo/tarea.model.js — Modelo Mongoose de Tarea
const mongoose = require('mongoose');

const tareaSchema = new mongoose.Schema(
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
    prioridad: {
      type: String,
      enum: ['baja', 'media', 'alta'],
      default: 'media',
    },
    completada: {
      type: Boolean,
      default: false,
    },
    fecha_limite: {
      type: Date,
      default: null,
    },
    id_proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proyecto',
      required: true,
    },
    id_estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'tareas',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: estado_actual (equivalente a fn_estado_tarea de MySQL)
tareaSchema.virtual('estado_actual').get(function () {
  if (this.completada) return 'completada';
  if (this.fecha_limite && new Date(this.fecha_limite) < new Date()) return 'vencida';
  return 'pendiente';
});

tareaSchema.index({ id_proyecto: 1 });
tareaSchema.index({ id_estudiante: 1 });
tareaSchema.index({ completada: 1 });

const Tarea = mongoose.model('Tarea', tareaSchema);
module.exports = Tarea;
