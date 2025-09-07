const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Debug imports (remove after fixing)
console.log('patientController:', patientController);
console.log('authenticateJWT:', authenticateJWT);

// Routes with proper error handling for async functions
router.post('/', authenticateJWT, async (req, res, next) => {
  try {
    await patientController.createPatient(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    await patientController.getAllPatients(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:patientId', authenticateJWT, async (req, res, next) => {
  try {
    await patientController.getPatient(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:patientId', authenticateJWT, async (req, res, next) => {
  try {
    await patientController.updatePatient(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:patientId', authenticateJWT, async (req, res, next) => {
  try {
    await patientController.deletePatient(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:patientId/dashboard', authenticateJWT, async (req, res, next) => {
  try {
    await patientController.getPatientDashboard(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
