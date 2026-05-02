// controllers/perfilController.js
const perfilService = require('../services/perfilService');

class PerfilController {
  async getPerfil(req, res, next) {
    try {
      const perfil = await perfilService.getPerfil(req.usuario.id);
      res.json({ ok: true, data: perfil });
    } catch (error) {
      next(error);
    }
  }

  async updatePerfil(req, res, next) {
    try {
      await perfilService.updatePerfil(req.usuario.id, req.body);
      res.json({ ok: true, mensaje: 'Perfil actualizado correctamente.' });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new PerfilController();
