// models/mysql/usuarios.model.js
// Modelo de usuario MySQL — mapeo y validaciones de estructura
// Nota: La lógica de acceso a datos está en repositories/usuarioRepository.js

const ROLES_VALIDOS = ['estudiante', 'docente', 'admin'];

/**
 * Valida y limpia los datos de un usuario antes de insertar/actualizar.
 * @param {object} data - Datos crudos del request
 * @returns {object} - Datos sanitizados
 */
function sanitizeUsuario(data) {
  const clean = {};

  if (data.nombre !== undefined)   clean.nombre   = String(data.nombre).trim();
  if (data.apellido !== undefined) clean.apellido  = String(data.apellido).trim();
  if (data.email !== undefined)    clean.email     = String(data.email).trim().toLowerCase();
  if (data.documento !== undefined) clean.documento = String(data.documento).trim();
  if (data.rol !== undefined) {
    if (!ROLES_VALIDOS.includes(data.rol)) {
      throw { status: 400, message: `Rol inválido. Permitidos: ${ROLES_VALIDOS.join(', ')}` };
    }
    clean.rol = data.rol;
  }
  if (data.activo !== undefined) clean.activo = data.activo ? 1 : 0;

  return clean;
}

/**
 * Valida que el objeto usuario tenga los campos requeridos para creación.
 * @param {object} data
 */
function validateCreacion(data) {
  const requeridos = ['nombre', 'apellido', 'email', 'documento', 'rol'];
  const faltantes = requeridos.filter(campo => !data[campo]);
  if (faltantes.length > 0) {
    throw { status: 400, message: `Campos requeridos: ${faltantes.join(', ')}` };
  }
  if (!ROLES_VALIDOS.includes(data.rol)) {
    throw { status: 400, message: `Rol inválido. Permitidos: ${ROLES_VALIDOS.join(', ')}` };
  }
}

module.exports = { sanitizeUsuario, validateCreacion, ROLES_VALIDOS };
