# 🤖 Telegram Integration Guide - Human Fallback System

## 📋 Overview
The human fallback system integrates with Telegram to notify admins instantly when users need human assistance and allows admins to reply directly through Telegram.

## 🔧 Current Setup Status
**⚠️ Currently using LOCAL STORAGE (In-Memory) - Not MongoDB**
- Human fallback requests are stored temporarily in server memory
- Data is lost on server restart
- Perfect for testing and development

## 🚀 How Telegram Integration Works

### 1. **User Requests Human Help**
- When AI can't help, user fills out contact form
- System automatically sends notification to admin's Telegram

### 2. **Admin Gets Notification** 
```
🆘 *New Human Fallback Request*

*Query:* Who is Salman Khan in CSE department?
*Contact:* 9999943451
*Category:* general  
*Priority:* medium
*Time:* 27/09/2025, 10:30 AM

Reply with /reply fallback_1 [your response] to respond
```

### 3. **Admin Can Reply Two Ways:**
#### Option A: Through Telegram Bot
- Type: `/reply fallback_1 Salman Khan is Assistant Professor in CSE, office: Room 301, Computer Science Block`
- System automatically sends response to user

#### Option B: Through Admin Dashboard  
- Go to `/admin/fallback`
- Click "Reply" button
- Type response and send

## 🔑 Required Environment Variables

To enable Telegram integration, add to your `.env.local`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_telegram_chat_id_here

# Your website URL (for links in messages)
NEXTAUTH_URL=http://localhost:3000
```

## 📱 Setting Up Telegram Bot

### Step 1: Create Bot
1. Message @BotFather on Telegram
2. Type `/newbot`
3. Choose bot name (e.g., "MEENA Assistant Bot")
4. Choose username (e.g., "meena_assistant_bot")
5. Copy the bot token

### Step 2: Get Your Chat ID
1. Start a chat with your new bot
2. Send any message
3. Visit: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getUpdates`
4. Find your `chat_id` in the response

### Step 3: Update Environment
```env
TELEGRAM_BOT_TOKEN=6234567890:AAEhBOwQI_1234567890abcdef
TELEGRAM_ADMIN_CHAT_ID=123456789
```

## 🛠️ Testing the System

### Test Scenario:
1. Go to http://localhost:3000
2. Ask: "Who is Salman Khan in CSE department?"
3. AI will respond with generic answer
4. System detects this as insufficient
5. Shows human fallback dialog
6. Fill in contact details
7. Submit request

### Expected Results:
- ✅ Request saved to local storage  
- ✅ Admin gets Telegram notification (if configured)
- ✅ Request appears in admin dashboard
- ✅ Admin can reply via dashboard or Telegram

## ⚡ Advanced Features

### Automatic Fallback Detection
The system automatically detects when AI gives generic responses like:
- "I don't have information..."
- "Please contact the office..."
- "For specific details, reach out..."
- "I'd recommend contacting..."

### Priority System
- **Low**: General questions
- **Medium**: Academic inquiries  
- **High**: Urgent requests
- **Critical**: Emergency situations

### Category Classification
- 📚 Academic
- 🎓 Admission  
- 🏠 Hostel
- 💰 Fees
- 💼 Placement
- ⚙️ Technical
- ❓ General

## 🔍 Troubleshooting

### "No Telegram notification received"
1. Check if `TELEGRAM_BOT_TOKEN` is set
2. Verify `TELEGRAM_ADMIN_CHAT_ID` is correct
3. Ensure bot is started (send `/start` to your bot)
4. Check server logs for error messages

### "Response not reaching user"
- Currently responses are logged to console
- For SMS/WhatsApp integration, additional services needed
- Telegram responses work if user contacted via Telegram

### "Requests disappearing"
- Using local storage (in-memory)
- Data is lost on server restart
- For production, switch to MongoDB

## 🚀 Production Deployment

### Switch to MongoDB:
1. Set up MongoDB database
2. Update environment variable: `MONGODB_URI`
3. Replace local storage logic with MongoDB calls
4. Deploy to production server

### Webhook Setup (Production):
```bash
curl -X POST \
"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
-H "Content-Type: application/json" \
-d '{"url": "https://yourdomain.com/api/telegram"}'
```

## 📊 Current Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| ✅ Human Fallback Detection | Working | Automatic pattern recognition |
| ✅ Contact Form | Working | Improved colors and contrast |
| ✅ Admin Dashboard | Working | Enhanced UI with better visibility |
| ✅ Local Storage | Working | Temporary data storage |
| 🔧 Telegram Notifications | Configurable | Requires bot setup |
| 🔧 Telegram Replies | Configurable | Works with proper setup |
| ❌ MongoDB Storage | Disabled | Using local storage instead |
| ❌ SMS Integration | Not Implemented | Future enhancement |

## 🎯 Next Steps

1. **Test Current System**: Try the fallback flow with improved UI
2. **Setup Telegram Bot**: Follow the guide above if you want notifications
3. **Production Planning**: Consider MongoDB for data persistence
4. **User Experience**: Test the improved color contrast and visibility

The system is now fully functional with local storage and ready for testing! 🚀