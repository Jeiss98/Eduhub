// controllers/noticiaController.js
const fs = require('fs');
const noticiaService = require('../services/noticiaService');

class NoticiaController {
  async getNoticias(req, res, next) {
    try {
      const result = await noticiaService.getNoticias(req.query);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getDestacadas(req, res, next) {
    try {
      const noticias = await noticiaService.getDestacadas();
      res.json({ ok: true, data: noticias });
    } catch (error) {
      next(error);
    }
  }

  async getNoticia(req, res, next) {
    try {
      const noticia = await noticiaService.getNoticiaById(req.params.id);
      res.json({ ok: true, data: noticia });
    } catch (error) {
      next(error);
    }
  }

  async createNoticia(req, res, next) {
    try {
      const noticia = await noticiaService.createNoticia(req.body, req.file, req.usuario);
      res.status(201).json({ ok: true, mensaje: 'Noticia publicada correctamente.', data: noticia });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      next(error);
    }
  }

  async updateNoticia(req, res, next) {
    try {
      const noticia = await noticiaService.updateNoticia(req.params.id, req.body, req.file);
      res.json({ ok: true, mensaje: 'Noticia actualizada.', data: noticia });
    } catch (error) {
      next(error);
    }
  }

  async deleteNoticia(req, res, next) {
    try {
      await noticiaService.deleteNoticia(req.params.id);
      res.json({ ok: true, mensaje: 'Noticia eliminada.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NoticiaController();
