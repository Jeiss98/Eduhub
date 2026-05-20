// repositories/usuarioRepository.js — Mongoose (MongoDB)
const { Usuario } = require('../models/mongo/usuario.model');

class UsuarioRepository {
  async findByEmail(email) {
    return await Usuario.findOne({ email: email.trim().toLowerCase() }).lean();
  }

  async findById(id) {
    return await Usuario.findById(id).lean();
  }

  async findPublicById(id) {
    return await Usuario.findById(id)
      .select('-password')
      .lean();
  }

  async create(userData) {
    const { nombre, apellido, email, documento, passwordHash, rol } = userData;
    const usuario = new Usuario({
      nombre: nombre.trim(),
      apellido: apellido ? apellido.trim() : null,
      email: email.trim().toLowerCase(),
      documento: documento.trim(),
      password: passwordHash,
      rol,
    });
    const saved = await usuario.save();
    return saved._id;
  }

  async updatePassword(id, newHash) {
    await Usuario.findByIdAndUpdate(id, { password: newHash });
  }

  async findAll() {
    return await Usuario.find()
      .select('-password')
      .sort({ rol: 1, nombre: 1 })
      .lean();
  }

  async findStudents() {
    return await Usuario.find({ rol: 'estudiante', activo: true })
      .select('_id nombre apellido email rol activo')
      .sort({ nombre: 1 })
      .lean();
  }

  async update(id, updateData) {
    const result = await Usuario.findByIdAndUpdate(id, updateData, { new: true });
    return result ? 1 : 0;
  }

  async updateActivo(id, activo) {
    const result = await Usuario.findByIdAndUpdate(id, { activo }, { new: true });
    return result ? 1 : 0;
  }
}

module.exports = new UsuarioRepository();
