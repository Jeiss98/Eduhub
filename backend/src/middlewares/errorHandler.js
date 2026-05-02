// middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('[Error]:', err.message);
  
  const status = err.status || 500;
  const mensaje = err.status ? err.message : 'Error interno del servidor.';

  res.status(status).json({
    ok: false,
    mensaje
  });
}

module.exports = errorHandler;
