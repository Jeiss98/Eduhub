// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');

class AuthService {
  async login(email, password) {
    const user = await usuarioRepository.findByEmail(email);
    if (!user) {
      throw { status: 401, message: 'Credenciales incorrectas.' };
    }

    if (!user.activo) {
      throw { status: 403, message: 'Cuenta desactivada. Contacta al administrador.' };
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      throw { status: 401, message: 'Credenciales incorrectas.' };
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '24h' }
    );

    return {
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
      }
    };
  }

  async registro(userData) {
    const existe = await usuarioRepository.findByEmail(userData.email);
    if (existe) {
      throw { status: 409, message: 'El correo ya está registrado.' };
    }

    // La contraseña inicial será el documento de identidad
    const tempPass = userData.documento;
    if (!tempPass) {
      throw { status: 400, message: 'El documento es obligatorio para generar la contraseña inicial.' };
    }

    const passwordHash = await bcrypt.hash(tempPass, 10);
    
    const newId = await usuarioRepository.create({
      ...userData,
      passwordHash
    });

    return {
      id: newId,
      contrasena_temporal: tempPass
    };
  }

  async cambiarPassword(userId, passwordActual, passwordNueva) {
    const user = await usuarioRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'Usuario no encontrado.' };
    }

    const ok = await bcrypt.compare(passwordActual, user.password);
    if (!ok) {
      throw { status: 401, message: 'Contraseña actual incorrecta.' };
    }

    const newHash = await bcrypt.hash(passwordNueva, 10);
    await usuarioRepository.updatePassword(userId, newHash);
  }

  async getMe(userId) {
    const user = await usuarioRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'Usuario no encontrado.' };
    }
    // Ocultar password
    delete user.password;
    return user;
  }
}

module.exports = new AuthService();
