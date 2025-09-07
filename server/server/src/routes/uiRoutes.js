// Lightweight UI integration routes (no auth) to support the current index.html
const express = require('express');
const router = express.Router();

// In-memory demo state (replace with DB models later)
let demoState = {
  retryCount: 3,
  members: [
    { id: 1, name: 'Member 1' },
    { id: 2, name: 'Member 2' }
  ],
  medications: []
};

// GET /api/family-members - return member list
router.get('/family-members', (req, res) => {
  res.json(demoState.members);
});

// PUT /api/settings/retry-count - update retry count
router.put('/settings/retry-count', (req, res) => {
  const { retryCount } = req.body || {};
  const parsed = Number(retryCount);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    return res.status(400).json({ error: 'retryCount must be an integer between 1 and 10' });
  }
  demoState.retryCount = parsed;
  // Notify SSE clients
  broadcastEvent({ type: 'retryCountUpdated', retryCount: parsed });
  res.json({ success: true, retryCount: parsed });
});

// POST /api/medications - save a medication entry
router.post('/medications', (req, res) => {
  const { member, name, dosage, times } = req.body || {};
  if (!member || !name || !dosage || !Array.isArray(times) || times.length === 0) {
    return res.status(400).json({ error: 'member, name, dosage, and non-empty times[] are required' });
  }
  const record = {
    id: demoState.medications.length + 1,
    member,
    name,
    dosage,
    times,
    createdAt: new Date().toISOString()
  };
  demoState.medications.push(record);
  // Notify SSE clients
  broadcastEvent({ type: 'medicationSaved', medication: record });
  res.status(201).json({ success: true, medication: record });
});

// Simple Server-Sent Events stream for live updates
const sseClients = new Set();

function broadcastEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    res.write(payload);
  }
}

router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send an initial event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  sseClients.add(res);

  // Heartbeat to keep the connection alive
  const interval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(interval);
    sseClients.delete(res);
    res.end();
  });
});

module.exports = router;
