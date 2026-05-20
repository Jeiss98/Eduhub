// models/Noticia.js — Schema Mongoose (MongoDB)
const mongoose = require('mongoose');

const NoticiaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [200, 'Máximo 200 caracteres'],
    },
    contenido: {
      type: String,
      required: [true, 'El contenido es obligatorio'],
    },
    categoria: {
      type: String,
      enum: ['academico', 'taller', 'infra', 'logro', 'convocatoria', 'evento'],
      default: 'academico',
    },
    emoji: {
      type: String,
      default: '📌',
    },
    autor: {
      nombre:     { type: String, required: true },
      usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    },
    vistas: {
      type: Number,
      default: 0,
    },
    destacada: {
      type: Boolean,
      default: false,
    },
    activa: {
      type: Boolean,
      default: true,
    },
    imagen: {
      type: String,
      default: null,
    },
    etiquetas: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt + updatedAt automáticos
  }
);

// Índices para búsqueda y performance
NoticiaSchema.index({ categoria: 1 });
NoticiaSchema.index({ destacada: 1, createdAt: -1 });
NoticiaSchema.index({ titulo: 'text', contenido: 'text' }); // búsqueda full-text

module.exports = mongoose.model('Noticia', NoticiaSchema);
