const express = require('express');
const router = express.Router();

// Import route modules - make sure all these files export Router instances
const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');
const medicationRoutes = require('./medicationRoutes');
const voiceRoutes = require('./voiceRoutes');
const familyRoutes = require('./familyRoutes');
const webhookRoutes = require('./webhookRoutes');
const uiRoutes = require('./uiRoutes');

// Debug imports - remove after fixing
console.log('authRoutes:', authRoutes);
console.log('patientRoutes:', patientRoutes);
console.log('medicationRoutes:', medicationRoutes);
console.log('voiceRoutes:', voiceRoutes);
console.log('familyRoutes:', familyRoutes);
console.log('webhookRoutes:', webhookRoutes);

// API versioning
const API_VERSION = '/v1';

// Route registration with base paths
try {
  // Auth routes (no versioning)
  router.use('/auth', authRoutes);
  
  // Lightweight UI integration routes (no versioning)
  // This enables endpoints used directly by the current index.html
  router.use('/', uiRoutes);
  
  // API v1 routes
  router.use(`${API_VERSION}/patients`, patientRoutes);
  router.use(`${API_VERSION}/medications`, medicationRoutes);
  router.use(`${API_VERSION}/voice`, voiceRoutes);
  router.use(`${API_VERSION}/family`, familyRoutes);
  
  // Webhooks (no versioning)
  router.use('/webhooks', webhookRoutes);
} catch (error) {
  console.error('Error mounting routes:', error);
}

// API documentation route
router.get('/', (req, res) => {
  res.json({
    message: 'Voice-Based Health Reminder System API',
    version: '1.0.0',
    database: 'NEW_DB',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/v1/patients',
      medications: '/api/v1/medications',
      voice: '/api/v1/voice',
      family: '/api/v1/family',
      webhooks: '/api/webhooks'
    }
  });
});

module.exports = router;
