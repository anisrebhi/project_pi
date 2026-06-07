const express = require('express');
const router = express.Router();

router.use('/events', require('./eventRoutes'));
router.use('/materials', require('./materialRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/categories', require('./categoryRoutes'));

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, statusCode: 200, message: 'API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
