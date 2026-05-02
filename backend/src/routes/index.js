// routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const usuariosRoutes = require('./usuarios');
const proyectosRoutes = require('./proyectos');
const tareasRoutes = require('./tareas');
const evaluacionesRoutes = require('./evaluaciones');
const noticiasRoutes = require('./noticias');
const reportesRoutes = require('./reportes');
const iaRoutes = require('./ia');
const perfilRoutes = require('./perfil');
const auditoriaRoutes = require('./auditoria');

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/proyectos', proyectosRoutes);
router.use('/tareas', tareasRoutes);
router.use('/evaluaciones', evaluacionesRoutes);
router.use('/noticias', noticiasRoutes);
router.use('/reportes', reportesRoutes);
router.use('/ia', iaRoutes);
router.use('/perfil', perfilRoutes);
router.use('/auditoria', auditoriaRoutes);

module.exports = router;
