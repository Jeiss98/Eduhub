// middleware/auth.js — JWT + control de roles
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * authMiddleware — verifica el token JWT
 * Header: Authorization: Bearer <token>
 * Inyecta req.usuario = { id, nombre, email, rol }
 */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso denegado. Token requerido.',
    });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, nombre, email, rol }
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expirado. Inicia sesión nuevamente.'
      : 'Token inválido.';
    return res.status(401).json({ ok: false, mensaje: msg });
  }
}

/**
 * roleMiddleware — restricción por rol
 * Uso: roleMiddleware('admin') | roleMiddleware('docente','admin')
 */
function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado.' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado. Rol requerido: ${roles.join(' o ')}.`,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
