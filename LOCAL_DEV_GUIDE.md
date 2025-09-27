# Local Development with Ngrok

## Install Ngrok
1. Download from https://ngrok.com/
2. Extract and add to PATH
3. Create free account for auth token

## Setup Steps

### 1. Start Your Local Server
```bash
cd "c:\Users\manna\Documents\Chatbot\chatbot"
npm run dev
# Server runs on http://localhost:3000
```

### 2. Start Ngrok Tunnel
```bash
# In another terminal
ngrok http 3000
# This gives you a public HTTPS URL like: https://abc123.ngrok.io
```

### 3. Update Environment Variables
```bash
# Add to .env.local
NEXTAUTH_URL=https://abc123.ngrok.io
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 4. Configure Webhooks
- **WhatsApp**: Use `https://abc123.ngrok.io/api/whatsapp`
- **Telegram**: Use admin dashboard with ngrok URL

## Pros & Cons

### ✅ Pros:
- Both bots work locally
- Real webhook testing
- Easy development cycle
- Free tier available

### ❌ Cons:
- URL changes on restart (free tier)
- Need internet connection
- Some latency added
- Rate limits on free tier

## Alternative: Polling Mode for Telegram

If you don't want to use ngrok for Telegram, you can use polling instead of webhooks.