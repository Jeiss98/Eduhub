// routes/auditoria.js
const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Solo admin y docente pueden ver la auditoría
router.use(authMiddleware);
router.use(roleMiddleware('admin', 'docente'));

router.get('/',              auditoriaController.getAuditoria);
router.get('/estadisticas',  auditoriaController.getEstadisticas);
router.get('/resumen',       auditoriaController.getResumen);

module.exports = router;
