const express = require('express');
const router = express.Router();

// Placeholder routes
router.post('/twilio', (req, res) => {
  res.json({ message: 'Twilio webhook received' });
});

module.exports = router;
