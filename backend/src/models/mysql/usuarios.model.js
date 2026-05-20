// models/mongo/usuarios.model.js
// Alias de compatibilidad — exporta el modelo Mongoose de usuario
// (mantiene la referencia para imports que usaban models/mysql/usuarios.model.js)
const { Usuario, ROLES_VALIDOS } = require('./usuario.model');

function sanitizeUsuario(data) {
  const clean = {};
  if (data.nombre    !== undefined) clean.nombre    = String(data.nombre).trim();
  if (data.apellido  !== undefined) clean.apellido  = String(data.apellido).trim();
  if (data.email     !== undefined) clean.email     = String(data.email).trim().toLowerCase();
  if (data.documento !== undefined) clean.documento = String(data.documento).trim();
  if (data.rol       !== undefined) {
    if (!ROLES_VALIDOS.includes(data.rol)) {
      throw { status: 400, message: `Rol inválido. Permitidos: ${ROLES_VALIDOS.join(', ')}` };
    }
    clean.rol = data.rol;
  }
  if (data.activo !== undefined) clean.activo = !!data.activo;
  return clean;
}

function validateCreacion(data) {
  const requeridos = ['nombre', 'apellido', 'email', 'documento', 'rol'];
  const faltantes  = requeridos.filter((campo) => !data[campo]);
  if (faltantes.length > 0) {
    throw { status: 400, message: `Campos requeridos: ${faltantes.join(', ')}` };
  }
  if (!ROLES_VALIDOS.includes(data.rol)) {
    throw { status: 400, message: `Rol inválido. Permitidos: ${ROLES_VALIDOS.join(', ')}` };
  }
}

module.exports = { sanitizeUsuario, validateCreacion, ROLES_VALIDOS };
