# MEENA Bot Integration Guide

## Overview
Connect MEENA to WhatsApp and Telegram to provide AI assistance through popular messaging platforms.

## 🔧 Quick Setup

### Environment Variables
Add these to your `.env.local` file:

```bash
# WhatsApp Bot (Meta Business API)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id  
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## 📱 WhatsApp Bot Setup

### Step 1: Create Meta Developer Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create account or log in
3. Create new app → Business → WhatsApp

### Step 2: Get Credentials
1. **Access Token**: App Dashboard → WhatsApp → API Setup
2. **Phone Number ID**: From the test phone number
3. **Verify Token**: Create a custom string (e.g., "meena_verify_123")

### Step 3: Configure Webhook
1. In WhatsApp API Setup, click "Configure webhooks"
2. **Webhook URL**: `https://your-domain.com/api/whatsapp`
3. **Verify Token**: Enter your custom verify token
4. **Subscribe to**: `messages`

### Step 4: Test
- Send message to your WhatsApp Business number
- Check MEENA responds automatically

## 🚀 Telegram Bot Setup

### Step 1: Create Bot with BotFather
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Choose bot name (e.g., "MEENA Assistant")  
4. Choose username (e.g., "meena_assistant_bot")
5. Save the bot token

### Step 2: Configure in MEENA
1. Go to Admin Dashboard → Bot Management
2. Enter your bot token in Telegram section
3. Click "Setup Webhook" button
4. Bot is now ready!

### Step 3: Test
- Find your bot on Telegram
- Send `/start` command
- MEENA should respond with welcome message

## 🎯 Features

### WhatsApp Bot Features
- ✅ Text message processing
- ✅ MEENA AI responses  
- ✅ Multi-language support
- ✅ Error handling
- ✅ Message logging

### Telegram Bot Features
- ✅ Text message processing
- ✅ Command support (`/start`, `/help`, `/language`, `/info`)
- ✅ Inline keyboards for language selection
- ✅ Typing indicators
- ✅ Reply to messages
- ✅ Markdown formatting
- ✅ MEENA AI responses

## 📋 Available Commands (Telegram)

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and introduction |
| `/help` | Show help and available commands |
| `/language` | Language selection menu |
| `/info` | About MEENA assistant |

## 🔍 Troubleshooting

### WhatsApp Issues

**Bot not receiving messages?**
- Check webhook URL is correct and accessible
- Verify token matches in Meta Console and environment
- Ensure HTTPS is used (required by Meta)
- Check webhook is verified (green checkmark in Meta Console)

**Bot not sending responses?**
- Verify Access Token is valid
- Check Phone Number ID is correct  
- Ensure phone number is verified in Meta Console
- Check API rate limits not exceeded

### Telegram Issues

**Bot not responding?**
- Verify bot token is correct
- Check webhook setup was successful
- Ensure webhook URL is accessible
- Test with `/start` command

**Commands not working?**
- Bot must be started by user first (`/start`)
- Check bot has permission to receive messages
- Verify webhook is receiving updates

## 📊 Monitoring

### Admin Dashboard
- Bot connection status
- Message counts  
- Last message timestamps
- Setup tools and instructions

### Logs
Check your application logs for:
- Webhook requests
- Message processing
- API responses
- Error messages

## 🔒 Security

### WhatsApp Security
- Access tokens expire regularly
- Use HTTPS for webhooks
- Validate webhook signatures (recommended)
- Store credentials securely

### Telegram Security  
- Bot tokens are permanent until regenerated
- Use webhook secrets (optional)
- Validate update authenticity
- Rate limiting recommended

## 🚀 Deployment

### Vercel Deployment
```bash
# Add environment variables in Vercel dashboard
npm run build
vercel --prod
```

### Railway Deployment  
```bash
# Add environment variables in Railway dashboard
railway up
```

### Docker Deployment
```dockerfile
ENV WHATSAPP_ACCESS_TOKEN=your_token
ENV WHATSAPP_PHONE_NUMBER_ID=your_id
ENV WHATSAPP_VERIFY_TOKEN=your_verify
ENV TELEGRAM_BOT_TOKEN=your_token
```

## 📈 Scaling Considerations

### High Volume
- Implement message queuing (Redis/Bull)
- Add rate limiting
- Use webhook secrets
- Monitor API quotas

### Multiple Bots
- Support multiple WhatsApp numbers
- Multiple Telegram bots per instance
- Bot-specific configuration
- User context isolation

## 💡 Advanced Features

### Planned Enhancements
- [ ] Voice message support (Telegram)
- [ ] Image/document processing  
- [ ] Bot analytics dashboard
- [ ] Custom commands configuration
- [ ] Multi-bot management
- [ ] Broadcast messaging
- [ ] User preference storage

### Custom Integration
```javascript
// Example: Add custom command handler
async function handleCustomCommand(command, chatId, platform) {
  switch(command) {
    case '/fees':
      return await getFeeInformation();
    case '/admission':  
      return await getAdmissionInfo();
    // Add more custom commands
  }
}
```

## 🆘 Support

### Getting Help
1. Check application logs first
2. Test webhook URLs manually  
3. Verify API credentials
4. Check network connectivity
5. Review Meta/Telegram API documentation

### Common Solutions
- **502/503 Errors**: Check server is running and accessible
- **Authentication Errors**: Regenerate tokens  
- **Rate Limiting**: Implement backoff strategies
- **Webhook Failures**: Ensure HTTPS and valid certificates

---

**Ready to connect MEENA to the world! 🌍**

For more help, check the Bot Management tab in your admin dashboard.