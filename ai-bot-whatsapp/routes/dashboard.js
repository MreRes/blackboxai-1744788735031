const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');

// Serve static dashboard
router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// API endpoint for monthly report data
router.get('/api/monthly-report', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get monthly transactions
    const transactions = await googleSheetsService.getMonthlyReport(month, year);
    
    // Calculate statistics
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        monthlyIncome += transaction.amount;
      } else {
        monthlyExpenses += transaction.amount;
      }
    });

    // Get current balance
    const currentBalance = await googleSheetsService.getCurrentBalance();

    res.json({
      success: true,
      stats: {
        totalTransactions: transactions.length,
        currentBalance: currentBalance,
        monthlyIncome: monthlyIncome,
        monthlyExpenses: monthlyExpenses
      },
      transactions: transactions.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 50) // Return most recent 50 transactions
    });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly report'
    });
  }
});

// API endpoint for category totals
router.get('/api/category-totals', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const totals = await googleSheetsService.getCategoryTotals(month, year);

    res.json({
      success: true,
      data: totals
    });
  } catch (error) {
    console.error('Error fetching category totals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category totals'
    });
  }
});

module.exports = router;
