// Environment variables validation
const joi = require('joi');

const envSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  PORT: joi.number().default(3000),
  MONGODB_URI: joi.string().required(),
  TWILIO_ACCOUNT_SID: joi.string().required(),
  TWILIO_AUTH_TOKEN: joi.string().required(),
  TWILIO_PHONE_NUMBER: joi.string().required(),
  JWT_SECRET: joi.string().required(),
  BASE_URL: joi.string().required()
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = envVars;
