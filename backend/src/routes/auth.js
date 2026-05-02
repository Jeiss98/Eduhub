// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { loginSchema, registroSchema, cambiarPasswordSchema } = require('../validators/authValidator');

router.post('/login', validate(loginSchema), authController.login);
router.post('/registro', authMiddleware, roleMiddleware('admin'), validate(registroSchema), authController.registro);
router.put('/cambiar-password', authMiddleware, validate(cambiarPasswordSchema), authController.cambiarPassword);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
