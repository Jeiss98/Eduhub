// routes/evaluaciones.js
const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createSchema, updateSchema } = require('../validators/evaluacionValidator');

router.use(authMiddleware);

router.get('/', evaluacionController.getEvaluaciones);
router.get('/estudiante/:id', roleMiddleware('docente', 'admin'), evaluacionController.getEvaluacionesEstudiante);
router.post('/', roleMiddleware('docente', 'admin'), validate(createSchema), evaluacionController.createEvaluacion);
router.put('/:id', roleMiddleware('docente', 'admin'), validate(updateSchema), evaluacionController.updateEvaluacion);
router.delete('/:id', roleMiddleware('docente', 'admin'), evaluacionController.deleteEvaluacion);

module.exports = router;
