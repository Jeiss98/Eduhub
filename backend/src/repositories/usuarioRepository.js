// repositories/usuarioRepository.js
const { pool } = require('../config/mysql');

class UsuarioRepository {
  async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT id_usuario AS id, nombre, apellido, email, documento, password, rol, activo, created_at 
       FROM usuarios WHERE email = ?`,
      [email.trim().toLowerCase()]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id_usuario AS id, nombre, apellido, email, documento, password, rol, activo, created_at 
       FROM usuarios WHERE id_usuario = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findPublicById(id) {
    const [rows] = await pool.query(
      `SELECT id_usuario AS id, nombre, apellido, email, documento, rol, activo, created_at 
       FROM usuarios WHERE id_usuario = ?`,
      [id]
    );
    return rows[0] || null;
  }
  async create(userData) {
    const { nombre, apellido, email, documento, passwordHash, rol } = userData;
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, documento, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre.trim(), apellido.trim(), email.trim().toLowerCase(), documento.trim(), passwordHash, rol]
    );
    return result.insertId;
  }

  async updatePassword(id, newHash) {
    await pool.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [newHash, id]);
  }
  async findAll() {
    const [rows] = await pool.query(
      `SELECT id_usuario AS id, nombre, apellido, email, documento, rol, activo, created_at 
       FROM usuarios ORDER BY rol, nombre`
    );
    return rows;
  }

  async findStudents() {
    const [rows] = await pool.query(
      `SELECT id_usuario AS id, nombre, apellido, email, rol, activo 
       FROM usuarios WHERE rol = 'estudiante' AND activo = TRUE ORDER BY nombre`
    );
    return rows;
  }

  async update(id, updateData) {
    const fields = [];
    const vals = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        vals.push(value);
      }
    }

    if (fields.length === 0) return 0;
    
    vals.push(id);
    const [result] = await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`, vals
    );
    
    return result.affectedRows;
  }

  async updateActivo(id, activo) {
    const [result] = await pool.query(
      'UPDATE usuarios SET activo = ? WHERE id_usuario = ?', [activo ? 1 : 0, id]
    );
    return result.affectedRows;
  }
}

module.exports = new UsuarioRepository();
