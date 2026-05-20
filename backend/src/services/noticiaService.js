// services/noticiaService.js
const noticiaRepository = require('../repositories/noticiaRepository');

class NoticiaService {
  async getNoticias(queryParams) {
    const { categoria, destacada, page = 1, limit = 9 } = queryParams;
    const filtro = { activa: true };
    if (categoria && categoria !== 'all') filtro.categoria = categoria;
    if (destacada === 'true') filtro.destacada = true;

    const limitNum = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * limitNum;

    const [noticias, total] = await Promise.all([
      noticiaRepository.findAll(filtro, skip, limitNum),
      noticiaRepository.count(filtro)
    ]);

    return {
      data: noticias,
      total,
      pagina: parseInt(page, 10),
      paginas: Math.ceil(total / limitNum)
    };
  }

  async getDestacadas() {
    return await noticiaRepository.findDestacadas(5);
  }

  async getNoticiaById(id) {
    const noticia = await noticiaRepository.findByIdAndIncrementViews(id);
    if (!noticia) throw { status: 404, message: 'Noticia no encontrada.' };
    return noticia;
  }

  async createNoticia(data, file, reqUsuario) {
    const { titulo, contenido, categoria, emoji, destacada } = data;

    const nuevaNoticia = {
      titulo: titulo.trim(),
      contenido,
      categoria: categoria || 'academico',
      emoji: emoji || '📌',
      destacada: destacada === 'true' || destacada === true,
      activa: true, // ← siempre true al crear
      autor: { nombre: reqUsuario.nombre, usuario_id: reqUsuario.id },
      imagen: file ? `/uploads/noticias/${file.filename}` : null
    };

    return await noticiaRepository.create(nuevaNoticia);
  }

  async updateNoticia(id, data, file) {
    const update = { ...data };
    if (file) update.imagen = `/uploads/noticias/${file.filename}`;
    if (update.destacada !== undefined) {
      update.destacada = update.destacada === 'true' || update.destacada === true;
    }

    const noticia = await noticiaRepository.update(id, update);
    if (!noticia) throw { status: 404, message: 'Noticia no encontrada.' };
    return noticia;
  }

  async deleteNoticia(id) {
    const noticia = await noticiaRepository.softDelete(id);
    if (!noticia) throw { status: 404, message: 'Noticia no encontrada.' };
  }

  // ← ruta de migración para noticias sin campo activa
  async fixActiva() {
    const Noticia = require('../models/Noticia');
    const result = await Noticia.updateMany(
      { activa: { $exists: false } },
      { $set: { activa: true } }
    );
    return result.modifiedCount;
  }
}

module.exports = new NoticiaService();