// Medication routes
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');

// In-memory storage for demo purposes
// In a real app, this would be a database
let medications = [];

// GET /api/v1/medications - Get all medications
// TODO: Re-enable authentication in production
// router.get('/', authenticateJWT, (req, res) => {
router.get('/', (req, res) => {
  try {
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// POST /api/v1/medications - Add a new medication
// TODO: Re-enable authentication in production
// router.post('/', authenticateJWT, (req, res) => {
router.post('/', (req, res) => {
  try {
    const { memberId, memberName, name, dosage, times } = req.body;
    
    if (!name || !memberId || !Array.isArray(times) || times.length === 0) {
      return res.status(400).json({ error: 'Name, memberId, and at least one time are required' });
    }

    const newMedication = {
      id: medications.length + 1,
      memberId,
      memberName: memberName || `Member ${memberId}`,
      name,
      dosage: dosage || 'Not specified',
      times,
      createdAt: new Date().toISOString()
    };

    medications.push(newMedication);
    
    res.status(201).json(newMedication);
  } catch (error) {
    console.error('Error saving medication:', error);
    res.status(500).json({ error: 'Failed to save medication' });
  }
});

module.exports = router;
