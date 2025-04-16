# WhatsApp AI Bot with Google Sheets Integration

A WhatsApp chatbot that uses Google's Gemini AI for responses and logs conversations to Google Sheets. Features a modern web dashboard for monitoring conversations and bot status.

## Features

- 🤖 AI-powered responses using Google's Gemini AI
- 📱 WhatsApp integration using Twilio's API
- 📊 Conversation logging in Google Sheets
- 📈 Real-time web dashboard
- ⚡ Modern, responsive UI with Tailwind CSS

## Prerequisites

Before setting up the bot, you'll need:

1. Node.js (v14 or higher)
2. A Twilio Account with WhatsApp API access
3. A Google Cloud Platform Account
4. Access to Google's Gemini AI API
5. A Google Sheets API key and spreadsheet

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ai-bot-whatsapp
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_CLIENT_EMAIL=your_client_email_here
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key_here

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

### 3. Set Up Google Sheets

1. Create a new Google Cloud Project
2. Enable the Google Sheets API
3. Create a service account and download credentials
4. Create a new Google Sheet and share it with the service account email
5. Copy the spreadsheet ID from the URL

### 4. Set Up Twilio WhatsApp

1. Sign up for a Twilio account
2. Navigate to the WhatsApp section
3. Set up a WhatsApp Sandbox
4. Configure the webhook URL to point to your server's /webhook endpoint

### 5. Get Gemini AI Access

1. Sign up for Google AI Studio
2. Generate an API key for Gemini
3. Add the API key to your .env file

### 6. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 8000 (or the port specified in your .env file).

## Usage

### WhatsApp Integration

1. Connect to your Twilio WhatsApp sandbox by sending the provided code
2. Start chatting with the bot
3. The bot will respond using AI-generated responses
4. All conversations are automatically logged to Google Sheets

### Dashboard Access

Access the admin dashboard at:
```
http://localhost:8000
```

The dashboard shows:
- Total message count
- Active users
- Bot uptime
- Recent chat logs
- Service status

## Project Structure

```
ai-bot-whatsapp/
├── config/
│   └── config.js           # Configuration management
├── services/
│   ├── whatsappService.js  # WhatsApp integration
│   ├── googleSheetsService.js # Google Sheets integration
│   └── aiGeminiService.js  # Gemini AI integration
├── routes/
│   ├── webhook.js          # WhatsApp webhook handler
│   └── dashboard.js        # Dashboard API routes
├── public/
│   ├── index.html         # Dashboard UI
│   └── css/
│       └── style.css      # Custom styles
└── server.js              # Main application file
```

## Troubleshooting

### Common Issues

1. **WhatsApp Messages Not Received**
   - Verify Twilio webhook URL is correct
   - Check Twilio account credentials
   - Ensure webhook endpoint is publicly accessible

2. **Google Sheets Not Updating**
   - Verify service account has write access
   - Check Google Sheets API is enabled
   - Validate spreadsheet ID

3. **AI Responses Not Working**
   - Confirm Gemini API key is valid
   - Check API quota limits
   - Verify API endpoint URL

### Error Logs

Check the console output for detailed error logs. The application uses comprehensive error handling and logging.

## Security Considerations

1. Never commit your .env file
2. Use environment variables for all sensitive data
3. Implement rate limiting in production
4. Add authentication for the dashboard in production
5. Keep all API keys and tokens secure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the maintainers.
