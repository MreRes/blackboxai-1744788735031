const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const googleSheetsService = require('../services/googleSheetsService');
const aiGeminiService = require('../services/aiGeminiService');

// Store pending transactions
const pendingTransactions = new Map();

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

    // Extract message details
    const messageBody = req.body.Body;
    const sender = req.body.From.replace('whatsapp:', '');

    if (!messageBody) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    // Check if there's a pending transaction for this user
    if (pendingTransactions.has(sender)) {
      await handlePendingTransaction(sender, messageBody.toLowerCase());
    } else {
      // Process new financial message
      await handleNewMessage(sender, messageBody);
    }

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

async function handleNewMessage(sender, message) {
  const lowerMessage = message.toLowerCase();

  // Handle special commands
  if (lowerMessage === 'help') {
    const helpMessage = 
      "🤖 Financial Assistant Help\n\n" +
      "📝 To record transactions:\n" +
      "• Expense: 'spent 50000 on lunch'\n" +
      "• Income: 'received 1000000 salary'\n\n" +
      "📊 Reports:\n" +
      "• 'balance' - Check current balance\n" +
      "• 'report' - Monthly report\n" +
      "• 'budget' - Budget analysis\n\n" +
      "❓ Other commands:\n" +
      "• 'help' - Show this message\n" +
      "• 'cancel' - Cancel current operation";

    await whatsappService.sendMessage(sender, helpMessage);
    return;
  }

  if (lowerMessage === 'balance') {
    const balance = await googleSheetsService.getCurrentBalance();
    const formattedBalance = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(balance);
    
    await whatsappService.sendMessage(sender, `💰 Current Balance: ${formattedBalance}`);
    return;
  }

  if (lowerMessage === 'report') {
    const currentDate = new Date();
    const report = await googleSheetsService.getMonthlyReport(
      currentDate.getMonth() + 1,
      currentDate.getFullYear()
    );

    let totalIncome = 0;
    let totalExpense = 0;
    report.forEach(record => {
      if (record.type === 'income') totalIncome += record.amount;
      else totalExpense += record.amount;
    });

    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    });

    const reportMessage = 
      "📊 Monthly Report\n\n" +
      `💰 Total Income: ${formatter.format(totalIncome)}\n` +
      `💸 Total Expenses: ${formatter.format(totalExpense)}\n` +
      `💵 Net: ${formatter.format(totalIncome - totalExpense)}`;

    await whatsappService.sendMessage(sender, reportMessage);
    return;
  }

  if (lowerMessage === 'budget') {
    const currentDate = new Date();
    const categoryTotals = await googleSheetsService.getCategoryTotals(
      currentDate.getMonth() + 1,
      currentDate.getFullYear()
    );
    
    const budgetReport = await aiGeminiService.generateBudgetReport(categoryTotals);
    await whatsappService.sendMessage(sender, budgetReport);
    return;
  }

  // Process potential financial message
  const result = await aiGeminiService.processFinancialMessage(message);
  
  if (result.success) {
    pendingTransactions.set(sender, result.data);
    await whatsappService.sendMessage(sender, result.message);
  } else {
    await whatsappService.sendMessage(sender, result.message);
  }
}

async function handlePendingTransaction(sender, message) {
  const transaction = pendingTransactions.get(sender);

  if (message === 'confirm') {
    // Save the transaction
    await googleSheetsService.appendFinancialRecord(transaction);
    const balance = await googleSheetsService.getCurrentBalance();
    const formattedBalance = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(balance);
    
    await whatsappService.sendMessage(
      sender, 
      `✅ Transaction recorded successfully!\n💰 Current balance: ${formattedBalance}`
    );
  } else if (message === 'cancel') {
    await whatsappService.sendMessage(sender, '❌ Transaction cancelled.');
  } else {
    await whatsappService.sendMessage(
      sender,
      '❓ Please type "confirm" to save the transaction or "cancel" to discard it.'
    );
    return;
  }

  // Clear the pending transaction
  pendingTransactions.delete(sender);
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

module.exports = router;
