// routes/proyectos.js
const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyectoController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createSchema, updateSchema, assignStudentSchema } = require('../validators/proyectoValidator');

router.use(authMiddleware);

router.get('/', proyectoController.getProyectos);
router.get('/:id', proyectoController.getProyectoDetail);
router.post('/', roleMiddleware('docente', 'admin'), validate(createSchema), proyectoController.createProyecto);
router.put('/:id', roleMiddleware('docente', 'admin'), validate(updateSchema), proyectoController.updateProyecto);
router.delete('/:id', roleMiddleware('docente', 'admin'), proyectoController.deleteProyecto);
router.post('/:id/estudiantes', roleMiddleware('docente', 'admin'), validate(assignStudentSchema), proyectoController.assignStudent);
router.delete('/:id/estudiantes/:uid', roleMiddleware('docente', 'admin'), proyectoController.removeStudent);

module.exports = router;
