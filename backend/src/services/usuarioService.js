// services/usuarioService.js
const usuarioRepository = require('../repositories/usuarioRepository');

class UsuarioService {
  async getUsuariosList(reqUsuario) {
    if (reqUsuario.rol === 'admin') {
      return await usuarioRepository.findAll();
    } else if (reqUsuario.rol === 'docente') {
      return await usuarioRepository.findStudents();
    } else {
      throw { status: 403, message: 'Acceso denegado.' };
    }
  }

  async getUsuarioById(id, reqUsuario) {
    const esPropio = id === reqUsuario.id;
    const puedeVer = esPropio || reqUsuario.rol === 'admin' || reqUsuario.rol === 'docente';

    if (!puedeVer) {
      throw { status: 403, message: 'Solo puedes consultar tu propia información.' };
    }

    const user = await usuarioRepository.findPublicById(id);
    if (!user) {
      throw { status: 404, message: 'Usuario no encontrado.' };
    }
    return user;
  }

  async updateUsuario(id, updateData, reqUsuario) {
    const esPropio = id === reqUsuario.id;
    if (!esPropio && reqUsuario.rol !== 'admin') {
      throw { status: 403, message: 'Solo puedes editar tu propio perfil.' };
    }

    const cleanData = {};
    if (updateData.nombre) cleanData.nombre = updateData.nombre.trim();
    if (updateData.apellido !== undefined) cleanData.apellido = updateData.apellido.trim();
    if (updateData.email) cleanData.email = updateData.email.trim().toLowerCase();
    if (updateData.documento) cleanData.documento = updateData.documento.trim();
    
    if (reqUsuario.rol === 'admin') {
      if (updateData.rol) cleanData.rol = updateData.rol;
      if (updateData.activo !== undefined) cleanData.activo = updateData.activo ? 1 : 0;
    }

    if (Object.keys(cleanData).length === 0) {
      throw { status: 400, message: 'No hay campos para actualizar.' };
    }

    try {
      const affectedRows = await usuarioRepository.update(id, cleanData);
      if (affectedRows === 0) {
        throw { status: 404, message: 'Usuario no encontrado.' };
      }
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw { status: 409, message: 'El email ya está en uso.' };
      }
      throw err;
    }
  }

  async deleteUsuario(id, reqUsuario) {
    if (id === reqUsuario.id) {
      throw { status: 400, message: 'No puedes desactivar tu propia cuenta.' };
    }
    const affectedRows = await usuarioRepository.updateActivo(id, false);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Usuario no encontrado.' };
    }
  }

  async reactivateUsuario(id) {
    await usuarioRepository.updateActivo(id, true);
  }

  async toggleStatus(id, activo) {
    const affectedRows = await usuarioRepository.updateActivo(id, activo);
    if (affectedRows === 0) {
      throw { status: 404, message: 'Usuario no encontrado.' };
    }
  }
}

module.exports = new UsuarioService();
