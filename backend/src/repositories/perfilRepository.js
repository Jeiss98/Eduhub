// repositories/perfilRepository.js — Mongoose (MongoDB)
const { Usuario } = require('../models/mongo/usuario.model');
const Perfil = require('../models/mongo/perfil.model');

class PerfilRepository {
  async getPerfil(usuarioId) {
    const usuario = await Usuario.findById(usuarioId)
      .select('_id nombre apellido email rol')
      .lean();
    if (!usuario) return null;

    const perfil = await Perfil.findOne({ usuario_id: usuarioId }).lean();

    return {
      ...usuario,
      id: usuario._id,
      perfil: perfil || null,
    };
  }

  async upsertPerfil(usuarioId, data) {
    const {
      fecha_nacimiento, ciudad, telefono, semestre, programa,
      es_menor, contacto_nombre, contacto_telefono, contacto_relacion,
      contacto_email, avatar_url,
    } = data;

    await Perfil.findOneAndUpdate(
      { usuario_id: usuarioId },
      {
        usuario_id:        usuarioId,
        fecha_nacimiento:  fecha_nacimiento || null,
        ciudad:            ciudad || null,
        telefono:          telefono || null,
        semestre:          semestre || null,
        programa:          programa || null,
        es_menor:          !!es_menor,
        contacto_nombre:   contacto_nombre || null,
        contacto_telefono: contacto_telefono || null,
        contacto_relacion: contacto_relacion || null,
        contacto_email:    contacto_email || null,
        ...(avatar_url ? { avatar_url } : {}),
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

module.exports = new PerfilRepository();