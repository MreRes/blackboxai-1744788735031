const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const googleSheetsService = require('../services/googleSheetsService');
const aiGeminiService = require('../services/aiGeminiService');

router.post('/', async (req, res) => {
  try {
    // Validate the incoming webhook
    const twilioSignature = req.headers['x-twilio-signature'];
    const isValid = whatsappService.validateWebhook(
      twilioSignature,
      req.protocol + '://' + req.get('host') + req.originalUrl,
      req.body
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Extract message details from the webhook payload
    const messageBody = req.body.Body;
    const sender = req.body.From.replace('whatsapp:', '');

    if (!messageBody) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    // Generate AI response
    const aiResponse = await aiGeminiService.generateResponse(messageBody);

    // Log the conversation to Google Sheets
    await googleSheetsService.appendRow({
      sender: sender,
      message: messageBody,
      botResponse: aiResponse
    });

    // Send response back to user
    await whatsappService.sendMessage(sender, aiResponse);

    // Return success response
    res.status(200).json({ 
      status: 'success',
      message: 'Message processed successfully'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

module.exports = router;
