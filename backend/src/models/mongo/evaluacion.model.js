// models/mongo/evaluacion.model.js — Modelo Mongoose de Evaluación
const mongoose = require('mongoose');

const evaluacionSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['parcial', 'final', 'entrega', 'quiz', 'taller', 'otro'],
      default: 'entrega',
    },
    calificacion: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
    comentarios: {
      type: String,
      default: null,
    },
    fecha: {
      type: Date,
      default: Date.now,
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
    id_docente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'evaluaciones',
  }
);

evaluacionSchema.index({ id_proyecto: 1 });
evaluacionSchema.index({ id_estudiante: 1 });
evaluacionSchema.index({ id_docente: 1 });

const Evaluacion = mongoose.model('Evaluacion', evaluacionSchema);
module.exports = Evaluacion;
