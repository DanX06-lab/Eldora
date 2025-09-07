// Family routes
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');

// Placeholder routes
router.get('/', authenticateJWT, (req, res) => {
  res.json({ message: 'Family members endpoint' });
});

module.exports = router;
