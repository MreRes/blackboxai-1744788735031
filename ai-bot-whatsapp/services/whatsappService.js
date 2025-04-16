const twilio = require('twilio');
const config = require('../config/config');

class WhatsAppService {
  constructor() {
    this.client = null;
    if (config.twilio.accountSid && config.twilio.accountSid.startsWith('AC') && config.twilio.authToken) {
      try {
        this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
      } catch (error) {
        console.warn('Failed to initialize Twilio client:', error.message);
      }
    } else {
      console.warn('Twilio credentials not set or invalid. WhatsApp service running in mock mode.');
    }
  }

  async sendMessage(to, message) {
    try {
      if (!this.client) {
        console.log('Mock WhatsApp message sent:', {
          to: to,
          message: message
        });
        return {
          sid: 'MOCK_MESSAGE_' + Date.now(),
          status: 'sent',
          to: to,
          body: message
        };
      }

      // Remove 'whatsapp:' prefix if it exists
      const formattedNumber = to.replace('whatsapp:', '');
      
      const response = await this.client.messages.create({
        from: config.twilio.whatsappNumber,
        to: `whatsapp:${formattedNumber}`,
        body: message
      });
      
      console.log('Message sent successfully:', response.sid);
      return response;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        sid: 'ERROR_' + Date.now(),
        status: 'error',
        to: to,
        body: message,
        error: error.message
      };
    }
  }

  // Validate incoming webhook
  validateWebhook(signature, url, params) {
    if (!this.client) {
      // In mock mode, always return true
      return true;
    }

    try {
      const requestIsValid = twilio.validateRequest(
        config.twilio.authToken,
        signature,
        url,
        params
      );
      return requestIsValid;
    } catch (error) {
      console.error('Error validating webhook:', error);
      return false;
    }
  }
}

module.exports = new WhatsAppService();
