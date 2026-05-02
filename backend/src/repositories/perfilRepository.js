// repositories/perfilRepository.js
const { pool } = require('../config/mysql');

let avatarColumnReady = false;

class PerfilRepository {
  async ensureAvatarColumn() {
    if (avatarColumnReady) return;
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM perfiles LIKE 'avatar_url'`);
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE perfiles ADD COLUMN avatar_url LONGTEXT NULL AFTER contacto_email`);
      }
      avatarColumnReady = true;
    } catch (err) {
      // Si la BD no permite ALTER, el perfil sigue funcionando sin tumbar la app.
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      avatarColumnReady = true;
    }
  }

  async getPerfil(usuarioId) {
    await this.ensureAvatarColumn();

    const [usuarios] = await pool.query(
      'SELECT id_usuario, nombre, apellido, email, rol FROM usuarios WHERE id_usuario = ?',
      [usuarioId]
    );
    if (usuarios.length === 0) return null;

    const [perfiles] = await pool.query(
      'SELECT * FROM perfiles WHERE id_usuario = ?',
      [usuarioId]
    );

    return {
      ...usuarios[0],
      perfil: perfiles[0] || null
    };
  }

  async upsertPerfil(usuarioId, data) {
    await this.ensureAvatarColumn();

    const {
      fecha_nacimiento, ciudad, telefono, semestre, programa,
      es_menor, contacto_nombre, contacto_telefono, contacto_relacion,
      contacto_email, avatar_url
    } = data;

    await pool.query(`
      INSERT INTO perfiles
        (id_usuario, fecha_nacimiento, ciudad, telefono, semestre, programa,
         es_menor, contacto_nombre, contacto_telefono, contacto_relacion, contacto_email, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        fecha_nacimiento  = VALUES(fecha_nacimiento),
        ciudad            = VALUES(ciudad),
        telefono          = VALUES(telefono),
        semestre          = VALUES(semestre),
        programa          = VALUES(programa),
        es_menor          = VALUES(es_menor),
        contacto_nombre   = VALUES(contacto_nombre),
        contacto_telefono = VALUES(contacto_telefono),
        contacto_relacion = VALUES(contacto_relacion),
        contacto_email    = VALUES(contacto_email),
        avatar_url        = COALESCE(VALUES(avatar_url), avatar_url)
    `, [
      usuarioId,
      fecha_nacimiento || null, ciudad || null, telefono || null,
      semestre || null, programa || null, es_menor ? 1 : 0,
      contacto_nombre || null, contacto_telefono || null,
      contacto_relacion || null, contacto_email || null, avatar_url || null
    ]);
  }
}

module.exports = new PerfilRepository();