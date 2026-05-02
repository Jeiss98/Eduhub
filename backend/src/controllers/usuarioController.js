// controllers/usuarioController.js
const usuarioService = require('../services/usuarioService');

class UsuarioController {
  async getUsuarios(req, res, next) {
    try {
      const usuarios = await usuarioService.getUsuariosList(req.usuario);
      res.json({ ok: true, data: usuarios });
    } catch (error) {
      next(error);
    }
  }

  async getUsuario(req, res, next) {
    try {
      const usuario = await usuarioService.getUsuarioById(parseInt(req.params.id, 10), req.usuario);
      res.json({ ok: true, data: usuario });
    } catch (error) {
      next(error);
    }
  }

  async updateUsuario(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      await usuarioService.updateUsuario(id, req.body, req.usuario);
      res.json({ ok: true, mensaje: 'Usuario actualizado correctamente.' });
    } catch (error) {
      next(error);
    }
  }

  async deleteUsuario(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      await usuarioService.deleteUsuario(id, req.usuario);
      res.json({ ok: true, mensaje: 'Usuario desactivado.' });
    } catch (error) {
      next(error);
    }
  }

  async activateUsuario(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      await usuarioService.reactivateUsuario(id);
      res.json({ ok: true, mensaje: 'Usuario reactivado.' });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { activo } = req.body;
      await usuarioService.toggleStatus(id, activo);
      res.json({ ok: true, mensaje: activo ? 'Usuario activado.' : 'Usuario desactivado.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuarioController();
