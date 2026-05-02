// routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateSchema, toggleStatusSchema } = require('../validators/usuarioValidator');

router.use(authMiddleware);

router.get('/', usuarioController.getUsuarios);
router.get('/:id', usuarioController.getUsuario);
router.put('/:id', validate(updateSchema), usuarioController.updateUsuario);
router.delete('/:id', roleMiddleware('admin'), usuarioController.deleteUsuario);
router.post('/:id/activar', roleMiddleware('admin'), usuarioController.activateUsuario);
router.patch('/:id/estado', roleMiddleware('admin'), validate(toggleStatusSchema), usuarioController.toggleStatus);

module.exports = router;
