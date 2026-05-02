// middlewares/validate.js
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errores = error.details.map(err => err.message);
      return res.status(400).json({ ok: false, mensaje: errores.join(', ') });
    }
    next();
  };
}

module.exports = validate;
