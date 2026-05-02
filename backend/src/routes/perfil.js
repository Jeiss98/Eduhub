// routes/perfil.js
const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', perfilController.getPerfil);
router.put('/', perfilController.updatePerfil);

module.exports = router;