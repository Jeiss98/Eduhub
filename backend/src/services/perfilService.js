// services/perfilService.js
const perfilRepository = require('../repositories/perfilRepository');

class PerfilService {
  async getPerfil(usuarioId) {
    const perfil = await perfilRepository.getPerfil(usuarioId);
    if (!perfil) {
      throw { status: 404, message: 'Usuario no encontrado.' };
    }
    return perfil;
  }

  async updatePerfil(usuarioId, data) {
    await perfilRepository.upsertPerfil(usuarioId, data);
  }
}

module.exports = new PerfilService();
