// models/mongo/perfil.model.js — Modelo Mongoose de Perfil extendido
const mongoose = require('mongoose');

const perfilSchema = new mongoose.Schema(
  {
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true,
    },
    fecha_nacimiento: { type: Date, default: null },
    ciudad:           { type: String, trim: true, default: null },
    telefono:         { type: String, trim: true, default: null },
    semestre:         { type: Number, default: null },
    programa:         { type: String, trim: true, default: null },
    es_menor:         { type: Boolean, default: false },
    contacto_nombre:  { type: String, trim: true, default: null },
    contacto_telefono:{ type: String, trim: true, default: null },
    contacto_relacion:{ type: String, trim: true, default: null },
    contacto_email:   { type: String, trim: true, default: null },
    avatar_url:       { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'perfiles',
  }
);

const Perfil = mongoose.model('Perfil', perfilSchema);
module.exports = Perfil;
