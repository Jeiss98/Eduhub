// routes/noticias.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const noticiaController = require('../controllers/noticiaController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createSchema, updateSchema } = require('../validators/noticiaValidator');

const uploadDir = path.join(__dirname, '../../uploads/noticias');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `noticia_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const permitidos = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (permitidos.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Solo imágenes: jpg, png, webp, gif'), false);
  },
});

router.get('/', noticiaController.getNoticias);
router.get('/destacadas', noticiaController.getDestacadas);
router.get('/:id', noticiaController.getNoticia);

router.post('/', authMiddleware, roleMiddleware('docente', 'admin'), upload.single('imagen'), validate(createSchema), noticiaController.createNoticia);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'docente'), upload.single('imagen'), validate(updateSchema), noticiaController.updateNoticia);
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'docente'), noticiaController.deleteNoticia);

module.exports = router;
