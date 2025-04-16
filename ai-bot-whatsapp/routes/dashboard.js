const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');

// Get recent chat logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await googleSheetsService.getRecentChats(limit);
    res.json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chat logs',
      error: error.message
    });
  }
});

// Get bot status
router.get('/status', (req, res) => {
  try {
    const status = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        whatsapp: 'active',
        googleSheets: 'active',
        aiGemini: 'active'
      }
    };
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bot status',
      error: error.message
    });
  }
});

module.exports = router;
