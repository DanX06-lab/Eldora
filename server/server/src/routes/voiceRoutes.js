const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');

// Placeholder routes
router.post('/initiate', authenticateJWT, (req, res) => {
  res.json({ message: 'Voice call initiated' });
});

module.exports = router;
