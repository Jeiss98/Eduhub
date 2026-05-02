// validators/noticiaValidator.js
const Joi = require('joi');

const createSchema = Joi.object({
  titulo: Joi.string().required().messages({
    'any.required': 'Título es obligatorio.'
  }),
  contenido: Joi.string().required().messages({
    'any.required': 'Contenido es obligatorio.'
  }),
  categoria: Joi.string().optional(),
  emoji: Joi.string().optional(),
  destacada: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')).optional()
}).unknown(true); // Allow unknown because of multer 'imagen'

const updateSchema = Joi.object({
  titulo: Joi.string().optional(),
  contenido: Joi.string().optional(),
  categoria: Joi.string().optional(),
  emoji: Joi.string().optional(),
  destacada: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')).optional()
}).unknown(true);

module.exports = {
  createSchema,
  updateSchema
};
