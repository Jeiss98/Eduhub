// repositories/noticiaRepository.js
const Noticia = require('../models/Noticia');

class NoticiaRepository {
  async findAll(filtro, skip, limit) {
    const noticias = await Noticia.find(filtro)
      .sort({ destacada: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    return noticias;
  }

  async count(filtro) {
    return await Noticia.countDocuments(filtro);
  }

  async findDestacadas(limit = 5) {
    return await Noticia.find({ activa: true, destacada: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');
  }

  async findByIdAndIncrementViews(id) {
    return await Noticia.findByIdAndUpdate(
      id,
      { $inc: { vistas: 1 } },
      { new: true, select: '-__v' }
    );
  }

  async create(data) {
    const noticia = new Noticia(data);
    await noticia.save();
    return noticia;
  }

  async update(id, updateData) {
    return await Noticia.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  async softDelete(id) {
    return await Noticia.findByIdAndUpdate(
      id,
      { activa: false },
      { new: true }
    );
  }
}

module.exports = new NoticiaRepository();
