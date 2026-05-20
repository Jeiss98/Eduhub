// models/mongo/usuario.model.js — Modelo Mongoose de Usuario
const mongoose = require('mongoose');

const ROLES_VALIDOS = ['estudiante', 'docente', 'admin'];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    apellido: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    documento: {
      type: String,
      required: [true, 'El documento es obligatorio'],
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    rol: {
      type: String,
      enum: ROLES_VALIDOS,
      required: true,
      default: 'estudiante',
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'usuarios',
  }
);

// Índices
usuarioSchema.index({ email: 1 }, { unique: true });
usuarioSchema.index({ rol: 1 });

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = { Usuario, ROLES_VALIDOS };
