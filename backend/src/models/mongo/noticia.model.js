// models/Noticia.js
const mongoose = require('mongoose');

const noticiaSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: [true, 'El título es obligatorio'],
            trim: true,
        },
        contenido: {
            type: String,
            required: [true, 'El contenido es obligatorio'],
        },
        categoria: {
            type: String,
            enum: ['academico', 'taller', 'infra', 'logro'],
            default: 'academico',
        },
        emoji: {
            type: String,
            default: '📌',
        },
        imagen: {
            type: String,
            default: null,
        },
        destacada: {
            type: Boolean,
            default: false,
        },
        activa: {
            type: Boolean,
            default: true,
        },
        vistas: {
            type: Number,
            default: 0,
        },
        autor: {
            nombre: { type: String, default: null },
            usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
        },
    },
    {
        timestamps: true,
        collection: 'noticias',
    }
);

noticiaSchema.index({ activa: 1, destacada: -1, createdAt: -1 });
noticiaSchema.index({ categoria: 1 });

module.exports = mongoose.model('Noticia', noticiaSchema);