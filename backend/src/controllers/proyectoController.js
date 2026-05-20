// controllers/proyectoController.js — IDs como string (MongoDB ObjectId)
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
      const detail = await proyectoService.getProyectoDetail(req.params.id);
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
      await proyectoService.updateProyecto(req.params.id, req.body, req.usuario);
      res.json({ ok: true, mensaje: 'Proyecto actualizado correctamente.' });
    } catch (error) {
      next(error);
    }
  }

  async deleteProyecto(req, res, next) {
    try {
      await proyectoService.deleteProyecto(req.params.id);
      res.json({ ok: true, mensaje: 'Proyecto eliminado.' });
    } catch (error) {
      next(error);
    }
  }

  async assignStudent(req, res, next) {
    try {
      const mensaje = await proyectoService.assignStudent(req.params.id, req.body.usuario_id);
      res.status(201).json({ ok: true, mensaje });
    } catch (error) {
      next(error);
    }
  }

  async removeStudent(req, res, next) {
    try {
      await proyectoService.removeStudent(req.params.id, req.params.uid);
      res.json({ ok: true, mensaje: 'Estudiante desvinculado del proyecto.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProyectoController();
