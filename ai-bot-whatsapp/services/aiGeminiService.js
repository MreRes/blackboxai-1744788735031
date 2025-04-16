const axios = require('axios');
const config = require('../config/config');

class AiGeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.apiUrl = config.gemini.apiUrl;
    
    if (!this.apiKey) {
      console.warn('Gemini API key not set. Running in mock mode.');
    }
  }

  async generateResponse(userMessage) {
    if (!this.apiKey) {
      return this.getMockResponse(userMessage);
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          contents: [{
            parts: [{
              text: userMessage
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Extract the generated text from Gemini's response
      const generatedText = response.data.candidates[0].content.parts[0].text;
      return this.formatResponse(generatedText);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.getMockResponse(userMessage);
    }
  }

  formatResponse(text) {
    // Trim whitespace and ensure response isn't too long for WhatsApp
    return text.trim().substring(0, 1500); // WhatsApp message limit
  }

  getMockResponse(userMessage) {
    const mockResponses = [
      "I understand you're asking about '" + userMessage + "'. Let me help you with that.",
      "Thanks for your message. In response to '" + userMessage + "', I would typically provide a detailed answer.",
      "I've received your query about '" + userMessage + "'. Here's a simulated response.",
      "Thank you for reaching out. Your message about '" + userMessage + "' is important.",
      "I'm running in mock mode, but I can acknowledge your message about '" + userMessage + "'."
    ];
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  // Helper method to validate if the message is appropriate for processing
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return false;
    }
    // Add any other validation rules (e.g., message length, content restrictions)
    return message.length > 0 && message.length <= 2000;
  }
}

module.exports = new AiGeminiService();
