const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config/config');
const webhookRouter = require('./routes/webhook');
const dashboardRouter = require('./routes/dashboard');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/webhook', webhookRouter);
app.use('/dashboard', dashboardRouter);

// Root route - redirect to dashboard
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
});
