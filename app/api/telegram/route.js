import { NextResponse } from 'next/server';

// In-memory conversation history storage
const conversationHistories = new Map();

function getConversationHistory(userId) {
  return conversationHistories.get(userId) || [];
}

function addToConversationHistory(userId, message, role) {
  const history = getConversationHistory(userId);
  history.push({ role, content: message, timestamp: new Date().toISOString() });
  
  // Keep only last 10 messages to avoid memory issues
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }
  
  conversationHistories.set(userId, history);
}

// Telegram Bot webhook handler
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Process incoming updates
    if (body.update_id && body.message) {
      await processTelegramMessage(body.message);
    }
    
    // Handle callback queries (inline buttons)
    if (body.callback_query) {
      await processTelegramCallback(body.callback_query);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processTelegramMessage(message) {
  try {
    const { chat, from, text, message_id } = message;
    
    // Check if this is an admin reply to a fallback request
    const pendingFallbacks = global.pendingFallbackReplies || new Map();
    if (pendingFallbacks.has(from.id)) {
      const fallbackId = pendingFallbacks.get(from.id);
      await handleFallbackReply(fallbackId, text, from, chat.id);
      pendingFallbacks.delete(from.id);
      return;
    }

    // Check if user is providing phone number for human fallback
    const waitingForPhone = global.waitingForPhone || new Set();
    if (waitingForPhone.has(from.id)) {
      await handlePhoneNumberSubmission(text, from, chat.id);
      waitingForPhone.delete(from.id);
      return;
    }
    
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
    
    console.log(`Telegram message from ${from.username || from.first_name} (${from.id}): ${text}`);
    
    // Add user message to conversation history
    addToConversationHistory(from.id, text, 'user');
    
    // Show typing indicator
    await sendTelegramTyping(chat.id);
    
    // Get conversation history for context
    const conversationHistory = getConversationHistory(from.id);
    
    // Get MEENA response with conversation history
    const response = await getMeenaResponse(text, from.id, 'telegram', conversationHistory);
    
    // Check if response indicates lack of knowledge - trigger human fallback
    if (checkForHumanFallback(response, text)) {
      await handleTelegramFallback(text, response, from, chat.id);
      return;
    }
    
    // Add MEENA response to conversation history
    if (response) {
      addToConversationHistory(from.id, response, 'assistant');
    }
    
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

Hi ${from.first_name}! I'm MEENA, your educational assistant for MANIT (Maulana Azad National Institute of Technology).

I can help you with:
📚 Course information
🏫 Campus facilities
📅 Academic calendar
💰 Fee details
🏠 Hostel information
📝 Admission process
And much more!

Just send me any question and I'll do my best to help you. You can also use these commands:

/help - Show this help message
/language - Change language preferences
/info - About MEENA

Try asking me something like "What are the hostel fees?" or "Tell me about CSE department"`;
      
      await sendTelegramMessage(chatId, welcomeMessage);
      break;
      
    case '/help':
      await sendTelegramMessage(chatId, `🔗 MEENA AI Assistant Help

Available Commands:
/start - Welcome message
/help - Show this help
/language - Language options
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
      
    case '/language':
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'English', callback_data: 'lang_english' },
            { text: 'हिन्दी', callback_data: 'lang_hindi' }
          ],
          [
            { text: 'मराठी', callback_data: 'lang_marathi' },
            { text: 'தமிழ்', callback_data: 'lang_tamil' }
          ],
          [
            { text: 'বাংলা', callback_data: 'lang_bengali' },
            { text: 'ગુજરાતી', callback_data: 'lang_gujarati' }
          ]
        ]
      };
      
      await sendTelegramMessage(chatId, 'Choose your preferred language:', null, keyboard);
      break;
      
    case '/info':
      await sendTelegramMessage(chatId, `ℹ️ About MEENA AI Assistant

MEENA is an AI-powered educational assistant designed specifically for MANIT students, faculty, and prospective applicants.

🎯 Purpose: Provide instant, accurate information about MANIT

🧠 Powered by: Advanced AI language models
🌐 Languages: English + 6 Indian languages
🔧 Features: Text responses, voice support (web version)

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
      'lang_gujarati': 'ગુজરાતી (Gujarati)'
    };
    
    const selectedLang = langMap[data] || 'English';
    
    // Here you could store user language preference in database
    // await updateUserLanguage(from.id, selectedLang);
    
    await sendTelegramMessage(
      message.chat.id, 
      `Language set to: ${selectedLang}\n\nNow you can ask me questions in your preferred language!`
    );
    
    // Answer callback query to remove loading state
    await answerTelegramCallback(callbackQuery.id);
  }
  
  // Handle human fallback reply buttons
  if (data.startsWith('fallback_reply_')) {
    const fallbackId = data.replace('fallback_reply_', '');
    
    // Send admin a message asking for their response
    const responsePrompt = `📝 *Reply to Fallback Request*

Please type your response for fallback request ID: \`${fallbackId}\`

Your next message will be sent as the response to the user.`;

    await sendTelegramMessage(message.chat.id, responsePrompt);
    
    // Store the context that admin is replying to this fallback
    global.pendingFallbackReplies = global.pendingFallbackReplies || new Map();
    global.pendingFallbackReplies.set(from.id, fallbackId);
    
    await answerTelegramCallback(callbackQuery.id, 'Reply mode activated. Send your response message.');
  }

  // Handle user requesting human help
  if (data === 'request_human_help') {
    await sendTelegramMessage(message.chat.id, '📱 Please send me your phone number so our human expert can contact you within 24 hours.');
    
    // Mark user as waiting for phone number
    global.waitingForPhone = global.waitingForPhone || new Set();
    global.waitingForPhone.add(from.id);
    
    await answerTelegramCallback(callbackQuery.id, 'Please provide your phone number');
  }

  // Handle user declining human help
  if (data === 'decline_human_help') {
    await sendTelegramMessage(message.chat.id, '👍 No problem! Feel free to ask me anything else or try rephrasing your question.');
    
    // Clear any pending fallback request
    const pendingRequests = global.pendingFallbackRequests || new Map();
    pendingRequests.delete(from.id);
    
    await answerTelegramCallback(callbackQuery.id, 'Human help declined');
  }
}

async function sendTelegramMessage(chatId, text, replyToMessageId = null, keyboard = null) {
  try {
    const { getBotCredentials } = await import('../../../lib/botConfig');
    const credentials = getBotCredentials('telegram');
    const botToken = credentials.botToken;
    
    if (!botToken) {
      console.error('Missing Telegram bot token');
      return;
    }
    
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
    } else {
      console.log(`Message sent to Telegram user ${chatId}`);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

async function sendTelegramTyping(chatId) {
  try {
    const { getBotCredentials } = await import('../../../lib/botConfig');
    const credentials = getBotCredentials('telegram');
    const botToken = credentials.botToken;
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const { getBotCredentials } = await import('../../../lib/botConfig');
    const credentials = getBotCredentials('telegram');
    const botToken = credentials.botToken;
    
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId
      }),
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

async function getMeenaResponse(message, userId, platform, conversationHistory = []) {
  try {
    // Format conversation history for the chat API (exclude current message)
    const formattedHistory = conversationHistory.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    console.log(`📱 Telegram: Sending message with ${formattedHistory.length} previous messages as context`);
    
    // Search ChromaDB for relevant context
    let contextualInfo = '';
    let hasContext = false;
    
    try {
      console.log('🔍 Telegram: Searching ChromaDB for relevant context...');
      const chromaResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chromadb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search_knowledge',
          data: { query: message, limit: 3 }
        }),
      });
      
      if (chromaResponse.ok) {
        const chromaResult = await chromaResponse.json();
        if (chromaResult.success && chromaResult.results && chromaResult.results.length > 0) {
          contextualInfo = '\n\nRELEVANT CONTEXT:\n' + 
            chromaResult.results.map(result => `- ${result.text || result.content}`).join('\n');
          hasContext = true;
          console.log(`📚 Telegram: Found ${chromaResult.results.length} relevant knowledge entries`);
          chromaResult.results.forEach((result, i) => {
            console.log(`  ${i + 1}. Title: ${result.title || 'No title'}`);
            console.log(`      Content: ${(result.text || result.content || '').substring(0, 100)}...`);
          });
        } else {
          console.log('📚 Telegram: No relevant knowledge found in ChromaDB');
        }
      }
    } catch (chromaError) {
      console.error('❌ Telegram: ChromaDB search failed:', chromaError);
    }
    
    // Enhance message with context if available
    const enhancedMessage = hasContext ? message + contextualInfo : message;
    
    console.log(`📱 Telegram: Enhanced message length: ${enhancedMessage.length} chars (context: ${hasContext ? 'YES' : 'NO'})`);
    
    // Use the existing chat API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: enhancedMessage,
        originalMessage: message,
        language: 'English', // Default language, could be stored per user
        contextualInfo: contextualInfo,
        hasContext: hasContext,
        model: 'sarvam-m',
        userId: `${platform}_${userId}`,
        platform: platform,
        conversationHistory: formattedHistory
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get MEENA response');
    }
    
    // Handle streaming response from chat API
    const text = await response.text();
    
    // Parse the streaming response to get the final message
    const lines = text.split('\n').filter(line => line.startsWith('data: '));
    let finalResponse = '';
    
    for (const line of lines) {
      try {
        const jsonStr = line.replace('data: ', '');
        if (jsonStr === '[DONE]') break;
        
        const data = JSON.parse(jsonStr);
        if (data.content) {
          finalResponse += data.content;
        }
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }
    
    return finalResponse || 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('Error getting MEENA response:', error);
    return 'Sorry, I am experiencing technical difficulties. Please try again later.';
  }
}

// Helper function to check if response indicates lack of knowledge
function checkForHumanFallback(response, query) {
  const lowKnowledgeIndicators = [
    "i don't know",
    "i'm not sure",
    "i don't have information",
    "i cannot provide",
    "i'm unable to",
    "i don't have enough information",
    "i'm not aware",
    "i cannot find",
    "no information available",
    "not in my knowledge",
    "unable to provide",
    "i don't have details",
    "sorry, i don't know",
    "i'm not familiar",
    "no specific information",
    "cannot determine",
    "insufficient information",
    "does not mention",
    "no mention of",
    "not mentioned",
    "no reference to",
    "there is no mention",
    "information does not include",
    "knowledge base does not contain",
    "not found in the information",
    "no details available about",
    "information provided does not",
    "no specific details about",
    "not covered in the available",
    "recommend contacting",
    "contact the department",
    "reach out to"
  ];
  
  const responseText = response.toLowerCase();
  
  // Check for direct knowledge gap indicators
  const hasKnowledgeGap = lowKnowledgeIndicators.some(indicator => responseText.includes(indicator));
  
  // Check for pattern where AI suggests contacting someone (indicates knowledge gap)
  const suggestsContact = responseText.includes("recommend contacting") || 
                         responseText.includes("contact the") || 
                         responseText.includes("reach them via") ||
                         responseText.includes("you can reach") ||
                         (responseText.includes("email:") && responseText.includes("phone:"));
  
  // Check if response is deflecting to external sources
  const isDeflecting = responseText.includes("for the most accurate") ||
                      responseText.includes("for updated information") ||
                      responseText.includes("contact") && responseText.includes("directly");
  
  return hasKnowledgeGap || (suggestsContact && isDeflecting);
}

// Handle Telegram human fallback
async function handleTelegramFallback(query, aiResponse, from, chatId) {
  try {
    const fallbackMessage = `🤖 I apologize, but I don't have enough information to answer your question properly.

❓ *Your Question:* ${query}

🔄 Would you like me to connect you with a human expert who can provide a detailed answer?

If yes, please provide your phone number so our team can contact you within 24 hours.`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📞 Yes, Contact Me', callback_data: 'request_human_help' },
          { text: '❌ No Thanks', callback_data: 'decline_human_help' }
        ]
      ]
    };

    await sendTelegramMessage(chatId, fallbackMessage, null, keyboard);

    // Store the fallback context for this user
    global.pendingFallbackRequests = global.pendingFallbackRequests || new Map();
    global.pendingFallbackRequests.set(from.id, {
      query,
      aiResponse,
      userId: from.id,
      userName: from.first_name + (from.last_name ? ` ${from.last_name}` : ''),
      username: from.username,
      chatId
    });

  } catch (error) {
    console.error('Error handling Telegram fallback:', error);
  }
}

// Handle admin reply to fallback
async function handleFallbackReply(fallbackId, responseText, admin, chatId) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/human-fallback`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: fallbackId,
        adminResponse: responseText,
        status: 'resolved',
        respondedBy: admin.first_name + (admin.last_name ? ` ${admin.last_name}` : '')
      })
    });

    const data = await response.json();
    
    if (data.success) {
      await sendTelegramMessage(chatId, '✅ Response sent to user successfully!');
    } else {
      await sendTelegramMessage(chatId, '❌ Failed to send response: ' + data.error);
    }
  } catch (error) {
    console.error('Error handling fallback reply:', error);
    await sendTelegramMessage(chatId, '❌ Error sending response. Please try again.');
  }
}

// Handle phone number submission for human fallback
async function handlePhoneNumberSubmission(phoneNumber, from, chatId) {
  try {
    const pendingRequests = global.pendingFallbackRequests || new Map();
    const fallbackData = pendingRequests.get(from.id);
    
    if (!fallbackData) {
      await sendTelegramMessage(chatId, '❌ Sorry, I couldn\'t find your pending request. Please try asking your question again.');
      return;
    }

    // Validate phone number (basic validation)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      await sendTelegramMessage(chatId, '❌ Please provide a valid phone number (at least 10 digits).');
      return;
    }

    // Submit to human fallback system
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/human-fallback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: fallbackData.query,
        userContact: {
          name: fallbackData.userName,
          phone: cleanPhone,
          chatId: chatId
        },
        originalResponse: fallbackData.aiResponse,
        context: {
          previousMessages: [], // Could add conversation history here
          sessionId: `telegram_${from.id}`,
          platform: 'telegram'
        },
        category: 'general',
        priority: 'medium',
        metadata: {
          telegramUserId: from.id,
          telegramUsername: fallbackData.username,
          userAgent: 'Telegram Bot'
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      const confirmationMessage = `✅ Thank you! Your request has been submitted successfully.

📱 We will contact you at: ${cleanPhone}
⏰ Expected response time: Within 24 hours
📝 Request ID: ${data.data.id}

Our human expert will reach out to you soon with a detailed answer to your question.`;

      await sendTelegramMessage(chatId, confirmationMessage);
      
      // Clear the pending request
      pendingRequests.delete(from.id);
    } else {
      await sendTelegramMessage(chatId, '❌ Sorry, there was an error submitting your request. Please try again later.');
    }

  } catch (error) {
    console.error('Error handling phone number submission:', error);
    await sendTelegramMessage(chatId, '❌ Sorry, there was an error processing your request. Please try again later.');
  }
}