// controllers/tareaController.js
const tareaService = require('../services/tareaService');

class TareaController {
  async getTareas(req, res, next) {
    try {
      const tareas = await tareaService.getTareas(req.query, req.usuario);
      res.json({ ok: true, data: tareas });
    } catch (error) {
      next(error);
    }
  }

  async getTarea(req, res, next) {
    try {
      const tarea = await tareaService.getTareaById(parseInt(req.params.id, 10));
      res.json({ ok: true, data: tarea });
    } catch (error) {
      next(error);
    }
  }

  async createTarea(req, res, next) {
    try {
      const id = await tareaService.createTarea(req.body);
      res.status(201).json({ ok: true, mensaje: 'Tarea creada correctamente.', id });
    } catch (error) {
      next(error);
    }
  }

  async completeTarea(req, res, next) {
    try {
      await tareaService.completeTarea(parseInt(req.params.id, 10), req.usuario);
      res.json({ ok: true, mensaje: 'Tarea marcada como completada.' });
    } catch (error) {
      next(error);
    }
  }

  async updateTarea(req, res, next) {
    try {
      await tareaService.updateTarea(parseInt(req.params.id, 10), req.body);
      res.json({ ok: true, mensaje: 'Tarea actualizada.' });
    } catch (error) {
      next(error);
    }
  }

  async deleteTarea(req, res, next) {
    try {
      await tareaService.deleteTarea(parseInt(req.params.id, 10));
      res.json({ ok: true, mensaje: 'Tarea eliminada.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TareaController();
