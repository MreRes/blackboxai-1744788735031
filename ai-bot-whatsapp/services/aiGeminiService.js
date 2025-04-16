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

  async processFinancialMessage(userMessage) {
    if (!this.apiKey) {
      return this.mockProcessFinancialMessage(userMessage);
    }

    try {
      // Create a structured prompt for financial analysis
      const prompt = `Analyze this financial message and extract the following information in JSON format:
      - type: "income" or "expense"
      - amount: number (extract the amount)
      - category: string (e.g., food, transportation, salary, etc.)
      - description: string (brief description of the transaction)

      Message: "${userMessage}"

      Only respond with valid JSON. Example:
      {
        "type": "expense",
        "amount": 50000,
        "category": "food",
        "description": "Lunch at restaurant"
      }`;

      const response = await axios.post(
        this.apiUrl,
        {
          contents: [{
            parts: [{
              text: prompt
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

      // Extract and parse the JSON response
      const generatedText = response.data.candidates[0].content.parts[0].text;
      return this.parseFinancialResponse(generatedText);
    } catch (error) {
      console.error('Error processing financial message:', error);
      return this.mockProcessFinancialMessage(userMessage);
    }
  }

  parseFinancialResponse(text) {
    try {
      // Find JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const data = JSON.parse(jsonMatch[0]);
      
      // Validate the parsed data
      if (!data.type || !data.amount || !data.category || !data.description) {
        throw new Error('Invalid financial data structure');
      }

      return {
        success: true,
        data: data,
        message: this.generateConfirmationMessage(data)
      };
    } catch (error) {
      console.error('Error parsing financial response:', error);
      return {
        success: false,
        error: 'Could not parse financial information',
        message: 'I could not understand the financial information. Please try again with a clearer message.'
      };
    }
  }

  generateConfirmationMessage(data) {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(data.amount);

    if (data.type === 'expense') {
      return `📝 Expense recorded:\n` +
             `💰 Amount: ${formattedAmount}\n` +
             `📁 Category: ${data.category}\n` +
             `📝 Description: ${data.description}\n\n` +
             `Type "confirm" to save this record or "cancel" to discard.`;
    } else {
      return `📝 Income recorded:\n` +
             `💰 Amount: ${formattedAmount}\n` +
             `📁 Category: ${data.category}\n` +
             `📝 Description: ${data.description}\n\n` +
             `Type "confirm" to save this record or "cancel" to discard.`;
    }
  }

  mockProcessFinancialMessage(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    let data;

    // Simple pattern matching for mock mode
    if (lowerMessage.includes('spent') || lowerMessage.includes('bought') || lowerMessage.includes('paid')) {
      // Extract amount - look for numbers
      const amountMatch = lowerMessage.match(/\d+/);
      const amount = amountMatch ? parseInt(amountMatch[0]) : 50000;

      data = {
        type: 'expense',
        amount: amount,
        category: lowerMessage.includes('food') ? 'food' : 
                 lowerMessage.includes('transport') ? 'transportation' : 
                 'general',
        description: userMessage
      };
    } else if (lowerMessage.includes('received') || lowerMessage.includes('salary') || lowerMessage.includes('income')) {
      const amountMatch = lowerMessage.match(/\d+/);
      const amount = amountMatch ? parseInt(amountMatch[0]) : 1000000;

      data = {
        type: 'income',
        amount: amount,
        category: lowerMessage.includes('salary') ? 'salary' : 'other income',
        description: userMessage
      };
    } else {
      return {
        success: false,
        error: 'Could not identify financial information',
        message: 'I could not identify whether this is an income or expense. Please try again with a clearer message.'
      };
    }

    return {
      success: true,
      data: data,
      message: this.generateConfirmationMessage(data)
    };
  }

  async generateBudgetReport(categoryTotals) {
    if (!this.apiKey) {
      return this.mockGenerateBudgetReport(categoryTotals);
    }

    try {
      const prompt = `Generate a budget analysis report based on these category totals:
      ${JSON.stringify(categoryTotals, null, 2)}

      Provide insights on:
      1. Top spending categories
      2. Income vs Expense ratio
      3. Budget recommendations
      
      Format the response in a clear, readable way using emojis and bullet points.`;

      const response = await axios.post(
        this.apiUrl,
        {
          contents: [{
            parts: [{
              text: prompt
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

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating budget report:', error);
      return this.mockGenerateBudgetReport(categoryTotals);
    }
  }

  mockGenerateBudgetReport(categoryTotals) {
    const totalIncome = Object.values(categoryTotals.income).reduce((a, b) => a + b, 0);
    const totalExpense = Object.values(categoryTotals.expense).reduce((a, b) => a + b, 0);
    
    return `📊 Monthly Budget Report\n\n` +
           `💰 Total Income: ${this.formatCurrency(totalIncome)}\n` +
           `💸 Total Expenses: ${this.formatCurrency(totalExpense)}\n` +
           `💵 Net Balance: ${this.formatCurrency(totalIncome - totalExpense)}\n\n` +
           `Top Expenses:\n` +
           Object.entries(categoryTotals.expense)
             .sort(([,a], [,b]) => b - a)
             .slice(0, 3)
             .map(([category, amount]) => `• ${category}: ${this.formatCurrency(amount)}`)
             .join('\n');
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  }
}

module.exports = new AiGeminiService();
