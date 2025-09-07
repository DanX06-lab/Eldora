const joi = require('joi');

// Registration validation
const validateRegistration = (req, res, next) => {
  const schema = joi.object({
    firstName: joi.string().min(2).max(50).required().trim(),
    lastName: joi.string().min(2).max(50).required().trim(),
    email: joi.string().email().required().lowercase().trim(),
    phoneNumber: joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
    relationshipToPatient: joi.string().valid('son', 'daughter', 'spouse', 'sibling', 'caregiver', 'other').required(),
    password: joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

// Login validation
const validateLogin = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  // ... your existing validations
};
