const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('ADMIN', 'CUSTOMER', 'RETAILER', 'DELIVERY_PARTNER').required(),
    // Optional fields based on role
    storeName: Joi.string().when('role', { is: 'RETAILER', then: Joi.required() }),
    gstin: Joi.string().allow('').optional(),
    address: Joi.string().optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
