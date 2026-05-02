// routes/reportes.js
const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/dashboard', reporteController.getDashboard);
router.get('/proyectos', reporteController.getProyectos);
router.get('/tareas-vencidas', reporteController.getTareasVencidas);
router.get('/estudiantes', roleMiddleware('admin', 'docente'), reporteController.getEstudiantes);
router.get('/pdf/:tipo', roleMiddleware('admin', 'docente'), reporteController.generarPdfTipo);

module.exports = router;
