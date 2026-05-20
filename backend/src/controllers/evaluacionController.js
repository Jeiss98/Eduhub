// controllers/evaluacionController.js — IDs como string (MongoDB ObjectId)
const evaluacionService = require('../services/evaluacionService');

class EvaluacionController {
  async getEvaluaciones(req, res, next) {
    try {
      const result = await evaluacionService.getEvaluaciones(req.usuario);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getEvaluacionesEstudiante(req, res, next) {
    try {
      const result = await evaluacionService.getEvaluacionesEstudiante(req.params.id);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async createEvaluacion(req, res, next) {
    try {
      const id = await evaluacionService.createEvaluacion(req.body, req.usuario.id);
      res.status(201).json({ ok: true, mensaje: 'Evaluación registrada correctamente.', id });
    } catch (error) {
      next(error);
    }
  }

  async updateEvaluacion(req, res, next) {
    try {
      await evaluacionService.updateEvaluacion(req.params.id, req.body, req.usuario);
      res.json({ ok: true, mensaje: 'Evaluación actualizada.' });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvaluacion(req, res, next) {
    try {
      await evaluacionService.deleteEvaluacion(req.params.id, req.usuario);
      res.json({ ok: true, mensaje: 'Evaluación eliminada.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EvaluacionController();
