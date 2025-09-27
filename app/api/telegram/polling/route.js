import { NextResponse } from 'next/server';

// Telegram Bot Polling Mode (Alternative to webhooks for local development)
export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
    }
    
    // Start polling if not already running
    if (!global.telegramPolling) {
      startTelegramPolling(botToken);
      global.telegramPolling = true;
    }
    
    return NextResponse.json({ 
      message: 'Telegram polling started',
      mode: 'polling',
      status: 'active'
    });
  } catch (error) {
    console.error('Telegram polling error:', error);
    return NextResponse.json({ error: 'Failed to start polling' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'stop') {
      global.telegramPolling = false;
      return NextResponse.json({ message: 'Telegram polling stopped' });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

let pollingInterval;

async function startTelegramPolling(botToken) {
  let lastUpdateId = 0;
  
  console.log('🚀 Starting Telegram polling mode...');
  
  const poll = async () => {
    try {
      if (!global.telegramPolling) {
        clearInterval(pollingInterval);
        console.log('🛑 Telegram polling stopped');
        return;
      }
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: lastUpdateId + 1,
          timeout: 30,
          allowed_updates: ['message', 'callback_query']
        })
      });
      
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          
          // Process the update (same logic as webhook)
          if (update.message) {
            await processTelegramMessage(update.message);
          }
          
          if (update.callback_query) {
            await processTelegramCallback(update.callback_query);
          }
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };
  
  // Start polling immediately, then every 2 seconds
  poll();
  pollingInterval = setInterval(poll, 2000);
}

// Import the message processing functions from the webhook route
async function processTelegramMessage(message) {
  try {
    const { chat, from, text, message_id } = message;
    
    // Handle commands
    if (text?.startsWith('/')) {
      await handleTelegramCommand(text, chat.id, from);
      return;
    }
    
    // Only process text messages
    if (!text) {
      await sendTelegramMessage(chat.id, "Sorry, I can only process text messages right now.");
      return;
    }
    
    console.log(`📱 Telegram message from ${from.username || from.first_name} (${from.id}): ${text}`);
    
    // Show typing indicator
    await sendTelegramTyping(chat.id);
    
    // Get MEENA response
    const response = await getMeenaResponse(text, from.id, 'telegram');
    
    // Send response back to Telegram
    await sendTelegramMessage(chat.id, response, message_id);
    
  } catch (error) {
    console.error('Error processing Telegram message:', error);
    await sendTelegramMessage(message.chat.id, "Sorry, I'm having trouble processing your message. Please try again.");
  }
}

async function handleTelegramCommand(command, chatId, from) {
  const cmd = command.split(' ')[0].toLowerCase();
  
  switch (cmd) {
    case '/start':
      const welcomeMessage = `🤖 Welcome to MEENA AI Assistant!

Hi ${from.first_name}! I'm MEENA, your educational assistant for MANIT.

I can help you with:
📚 Course information
🏫 Campus facilities  
📅 Academic calendar
💰 Fee details
🏠 Hostel information
📝 Admission process
And much more!

Just send me any question and I'll do my best to help you.

Try asking me something like "What are the hostel fees?" or "Tell me about CSE department"`;
      
      await sendTelegramMessage(chatId, welcomeMessage);
      break;
      
    case '/help':
      await sendTelegramMessage(chatId, `🔗 MEENA AI Assistant Help

Available Commands:
/start - Welcome message
/help - Show this help
/info - About MEENA

💡 Tips:
• Ask questions in natural language
• I support multiple Indian languages
• I can help with MANIT-related queries
• Type your question and press send!

Examples:
"What is the fee structure?"
"Tell me about placement statistics"
"How to apply for scholarships?"`);
      break;
      
    case '/info':
      await sendTelegramMessage(chatId, `ℹ️ About MEENA AI Assistant

MEENA is an AI-powered educational assistant designed specifically for MANIT students, faculty, and prospective applicants.

🎯 Purpose: Provide instant, accurate information about MANIT
🧠 Powered by: Advanced AI language models
🌐 Languages: English + 6 Indian languages

🏫 Covers:
• Academic programs & curriculum
• Admission procedures
• Fee structures & scholarships  
• Campus facilities & hostels
• Placement & career guidance
• Events & notifications

Made with ❤️ for the MANIT community`);
      break;
      
    default:
      await sendTelegramMessage(chatId, "Unknown command. Type /help to see available commands.");
  }
}

async function processTelegramCallback(callbackQuery) {
  const { data, message, from } = callbackQuery;
  
  if (data.startsWith('lang_')) {
    const langMap = {
      'lang_english': 'English',
      'lang_hindi': 'हिन्दी (Hindi)',
      'lang_marathi': 'मराठी (Marathi)',
      'lang_tamil': 'தமிழ் (Tamil)',
      'lang_bengali': 'বাংলা (Bengali)',
      'lang_gujarati': 'ગુજરાતી (Gujarati)'
    };
    
    const selectedLang = langMap[data] || 'English';
    
    await sendTelegramMessage(
      message.chat.id, 
      `Language set to: ${selectedLang}\n\nNow you can ask me questions in your preferred language!`
    );
    
    await answerTelegramCallback(callbackQuery.id);
  }
}

async function sendTelegramMessage(chatId, text, replyToMessageId = null, keyboard = null) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };
    
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }
    
    if (keyboard) {
      payload.reply_markup = keyboard;
    }
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

async function sendTelegramTyping(chatId) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing'
      }),
    });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
}

async function answerTelegramCallback(callbackQueryId) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId
      }),
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

async function getMeenaResponse(message, userId, platform) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        language: 'English',
        model: 'sarvam-m',
        userId: `${platform}_${userId}`,
        platform: platform
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get MEENA response');
    }
    
    const data = await response.json();
    return data.reply || 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('Error getting MEENA response:', error);
    return 'Sorry, I am experiencing technical difficulties. Please try again later.';
  }
}