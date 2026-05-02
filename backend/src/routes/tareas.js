// routes/tareas.js
const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createSchema, updateSchema } = require('../validators/tareaValidator');

router.use(authMiddleware);

router.get('/', tareaController.getTareas);
router.get('/:id', tareaController.getTarea);
router.post('/', roleMiddleware('docente', 'admin'), validate(createSchema), tareaController.createTarea);
router.patch('/:id/completar', tareaController.completeTarea);
router.put('/:id', roleMiddleware('docente', 'admin'), validate(updateSchema), tareaController.updateTarea);
router.delete('/:id', roleMiddleware('docente', 'admin'), tareaController.deleteTarea);

module.exports = router;
