// models/mongo/log.model.js
// Modelo Mongoose para logs de actividad del sistema (MongoDB)
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ['login', 'logout', 'registro', 'error', 'accion', 'sistema'],
      required: true,
      index: true,
    },
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId, // ref al _id del Usuario en MongoDB
      ref: 'Usuario',
      default: null,
      index: true,
    },
    email: {
      type: String,
      default: null,
    },
    mensaje: {
      type: String,
      required: true,
      maxlength: 500,
    },
    detalle: {
      type: mongoose.Schema.Types.Mixed, // JSON adicional (ej: payload, error stack)
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,         // createdAt, updatedAt automáticos
    collection: 'logs',
  }
);

// Índice TTL: borrar logs de más de 90 días automáticamente
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
