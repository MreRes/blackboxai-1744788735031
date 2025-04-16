const { google } = require('googleapis');
const config = require('../config/config');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    // Initialize with some mock financial data for testing
    this.mockData = [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'expense',
        amount: 50000,
        category: 'food',
        description: 'Lunch at restaurant',
        balance: 950000
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        type: 'income',
        amount: 1000000,
        category: 'salary',
        description: 'Monthly salary',
        balance: 1000000
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
      const client = new google.auth.JWT({
        email: config.googleSheets.clientEmail,
        key: config.googleSheets.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: client });
      console.log('Google Sheets client initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Sheets client:', error);
      console.warn('Falling back to mock mode');
      this.sheets = null;
    }
  }

  async appendFinancialRecord(data) {
    const timestamp = new Date().toISOString();
    const currentBalance = await this.getCurrentBalance();
    const newBalance = data.type === 'income' ? 
      currentBalance + data.amount : 
      currentBalance - data.amount;

    const rowData = {
      timestamp,
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      balance: newBalance
    };

    if (!this.sheets) {
      this.mockData.push(rowData);
      console.log('Mock financial data stored:', rowData);
      return {
        spreadsheetId: 'MOCK_SHEET',
        updates: {
          updatedRange: 'Finances!A:F',
          updatedRows: this.mockData.length
        }
      };
    }

    try {
      const values = [[
        timestamp,
        data.type,
        data.amount,
        data.category,
        data.description,
        newBalance
      ]];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: 'Finances!A:F',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: values
        }
      });

      console.log('Financial record appended successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error appending financial record:', error);
      this.mockData.push(rowData);
      return {
        spreadsheetId: 'MOCK_SHEET',
        updates: {
          updatedRange: 'Finances!A:F',
          updatedRows: this.mockData.length
        }
      };
    }
  }

  async getCurrentBalance() {
    if (!this.sheets) {
      const lastRecord = this.mockData[this.mockData.length - 1];
      return lastRecord ? lastRecord.balance : 0;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: 'Finances!F2:F',
        majorDimension: 'ROWS'
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return 0;
      return parseFloat(rows[rows.length - 1][0]) || 0;
    } catch (error) {
      console.error('Error fetching current balance:', error);
      const lastRecord = this.mockData[this.mockData.length - 1];
      return lastRecord ? lastRecord.balance : 0;
    }
  }

  async getMonthlyReport(month, year) {
    if (!this.sheets) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      return this.mockData.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: 'Finances!A2:F',
        majorDimension: 'ROWS'
      });

      const rows = response.data.values || [];
      return rows.filter(row => {
        const recordDate = new Date(row[0]);
        return recordDate.getMonth() + 1 === month && 
               recordDate.getFullYear() === year;
      }).map(row => ({
        timestamp: row[0],
        type: row[1],
        amount: parseFloat(row[2]),
        category: row[3],
        description: row[4],
        balance: parseFloat(row[5])
      }));
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      return this.mockData;
    }
  }

  async getCategoryTotals(month, year) {
    const records = await this.getMonthlyReport(month, year);
    const totals = {
      income: {},
      expense: {}
    };

    records.forEach(record => {
      const target = totals[record.type];
      if (!target[record.category]) {
        target[record.category] = 0;
      }
      target[record.category] += record.amount;
    });

    return totals;
  }
}

module.exports = new GoogleSheetsService();
