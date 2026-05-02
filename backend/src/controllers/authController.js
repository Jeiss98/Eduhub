// controllers/authController.js
const authService = require('../services/authService');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      
      res.json({
        ok: true,
        ...data
      });
    } catch (error) {
      next(error);
    }
  }

  async registro(req, res, next) {
    try {
      const data = await authService.registro(req.body);
      
      res.status(201).json({
        ok: true,
        mensaje: 'Usuario creado correctamente.',
        id: data.id,
        contrasena_temporal: data.contrasena_temporal,
        nota: 'El usuario debe cambiar su contraseña en el primer inicio de sesión.',
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarPassword(req, res, next) {
    try {
      const { password_actual, password_nueva } = req.body;
      await authService.cambiarPassword(req.usuario.id, password_actual, password_nueva);
      
      res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente.' });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getMe(req.usuario.id);
      res.json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
