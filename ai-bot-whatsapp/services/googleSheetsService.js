const { google } = require('googleapis');
const config = require('../config/config');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    // Initialize with some mock data for testing
    this.mockData = [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        sender: '+1234567890',
        message: 'Hello, how can you help me?',
        botResponse: 'Hi! I\'m here to assist you. What would you like to know?'
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        sender: '+1234567890',
        message: 'I need information about your services',
        botResponse: 'I can help you with various tasks including answering questions, providing information, and assisting with different topics. What specific information are you looking for?'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        sender: '+9876543210',
        message: 'What\'s the weather like today?',
        botResponse: 'I\'m running in mock mode, but I can help you find weather information when properly configured with weather APIs.'
      }
    ];
    this.initializeClient();
  }

  initializeClient() {
    if (!config.googleSheets.clientEmail || !config.googleSheets.privateKey) {
      console.warn('Google Sheets credentials not set. Running in mock mode.');
      return;
    }

    try {
      // Create JWT client without private key formatting
      const client = new google.auth.JWT({
        email: config.googleSheets.clientEmail,
        key: config.googleSheets.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      // Initialize Google Sheets API
      this.sheets = google.sheets({ version: 'v4', auth: client });
      console.log('Google Sheets client initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Sheets client:', error);
      console.warn('Falling back to mock mode');
      this.sheets = null;
    }
  }

  async appendRow(data) {
    const timestamp = new Date().toISOString();
    const rowData = {
      timestamp,
      sender: data.sender,
      message: data.message,
      botResponse: data.botResponse
    };

    if (!this.sheets) {
      // Store in memory if running in mock mode
      this.mockData.push(rowData);
      console.log('Mock data stored:', rowData);
      return {
        spreadsheetId: 'MOCK_SHEET',
        updates: {
          updatedRange: 'Sheet1!A:D',
          updatedRows: this.mockData.length
        }
      };
    }

    try {
      const values = [[
        timestamp,
        data.sender,
        data.message,
        data.botResponse
      ]];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: 'Sheet1!A:D',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: values
        }
      });

      console.log('Row appended successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error appending row to Google Sheets:', error);
      // Fall back to mock storage
      this.mockData.push(rowData);
      console.warn('Stored in mock storage due to error');
      return {
        spreadsheetId: 'MOCK_SHEET',
        updates: {
          updatedRange: 'Sheet1!A:D',
          updatedRows: this.mockData.length
        }
      };
    }
  }

  async getRecentChats(limit = 50) {
    if (!this.sheets) {
      // Return mock data if running in mock mode
      console.log('Returning mock data:', this.mockData.length, 'records');
      return this.mockData.slice(-limit);
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: 'Sheet1!A2:D',
        majorDimension: 'ROWS'
      });

      const rows = response.data.values || [];
      return rows.slice(-limit).map(row => ({
        timestamp: row[0],
        sender: row[1],
        message: row[2],
        botResponse: row[3]
      }));
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      // Return mock data as fallback
      console.log('Returning mock data due to error:', this.mockData.length, 'records');
      return this.mockData.slice(-limit);
    }
  }
}

module.exports = new GoogleSheetsService();
