// models/mongo/auditoria.model.js — Modelo Mongoose de Auditoría
// Reemplaza la tabla 'auditoria' de MySQL (antes gestionada por triggers)
const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema(
  {
    tabla_afectada: {
      type: String,
      required: true,
      index: true,
    },
    operacion: {
      type: String,
      enum: ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ERROR'],
      required: true,
      index: true,
    },
    id_registro: {
      type: String,   // ObjectId del documento afectado (como string)
      default: null,
    },
    usuario_db: {
      type: String,
      default: 'api_backend',
      index: true,
    },
    datos_anteriores: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    datos_nuevos: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'fecha_hora', updatedAt: false },
    collection: 'auditoria',
  }
);

// TTL: eliminar registros de más de 90 días automáticamente
auditoriaSchema.index({ fecha_hora: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Auditoria = mongoose.model('Auditoria', auditoriaSchema);
module.exports = Auditoria;
