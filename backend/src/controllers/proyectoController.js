// controllers/proyectoController.js
const proyectoService = require('../services/proyectoService');

class ProyectoController {
  async getProyectos(req, res, next) {
    try {
      const proyectos = await proyectoService.getProyectos(req.usuario);
      res.json({ ok: true, data: proyectos });
    } catch (error) {
      next(error);
    }
  }

  async getProyectoDetail(req, res, next) {
    try {
      const detail = await proyectoService.getProyectoDetail(parseInt(req.params.id, 10));
      res.json({ ok: true, data: detail });
    } catch (error) {
      next(error);
    }
  }

  async createProyecto(req, res, next) {
    try {
      const id = await proyectoService.createProyecto(req.usuario, req.body);
      res.status(201).json({ ok: true, mensaje: 'Proyecto creado correctamente.', id });
    } catch (error) {
      next(error);
    }
  }

  async updateProyecto(req, res, next) {
    try {
      await proyectoService.updateProyecto(parseInt(req.params.id, 10), req.body, req.usuario);
      res.json({ ok: true, mensaje: 'Proyecto actualizado correctamente.' });
    } catch (error) {
      next(error);
    }
  }

  async deleteProyecto(req, res, next) {
    try {
      await proyectoService.deleteProyecto(parseInt(req.params.id, 10));
      res.json({ ok: true, mensaje: 'Proyecto eliminado.' });
    } catch (error) {
      next(error);
    }
  }

  async assignStudent(req, res, next) {
    try {
      const mensaje = await proyectoService.assignStudent(parseInt(req.params.id, 10), req.body.usuario_id);
      res.status(201).json({ ok: true, mensaje });
    } catch (error) {
      next(error);
    }
  }

  async removeStudent(req, res, next) {
    try {
      await proyectoService.removeStudent(parseInt(req.params.id, 10), parseInt(req.params.uid, 10));
      res.json({ ok: true, mensaje: 'Estudiante desvinculado del proyecto.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProyectoController();
