import { NextResponse } from 'next/server';

// In-memory conversation history storage for WhatsApp
const whatsappConversations = new Map();

function getWhatsAppConversationHistory(phoneNumber) {
  return whatsappConversations.get(phoneNumber) || [];
}

function addToWhatsAppConversationHistory(phoneNumber, message, role) {
  const history = getWhatsAppConversationHistory(phoneNumber);
  history.push({ role, content: message, timestamp: new Date().toISOString() });
  
  // Keep only last 10 messages to avoid memory issues
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }
  
  whatsappConversations.set(phoneNumber, history);
}

// WhatsApp webhook handler
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Verify webhook (WhatsApp requirement)
    if (body.object === 'whatsapp_business_account') {
      // Process incoming messages
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value?.messages || [];
            
            for (const message of messages) {
              await processWhatsAppMessage(message, change.value?.metadata);
            }
          }
        }
      }
      
      return NextResponse.json({ status: 'success' });
    }
    
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Webhook verification (GET request)
export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
    const { getBotCredentials } = await import('../../../lib/botConfig');
    const credentials = getBotCredentials('whatsapp');
    const VERIFY_TOKEN = credentials.verifyToken || 'your-verify-token';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return new Response(challenge, { status: 200 });
  }
  
  return new Response('Verification failed', { status: 403 });
}

async function processWhatsAppMessage(message, metadata) {
  try {
    const { from, text, type, timestamp } = message;
    
    // Only process text messages for now
    if (type !== 'text' || !text?.body) {
      await sendWhatsAppMessage(from, "Sorry, I can only process text messages right now.");
      return;
    }
    
    const userMessage = text.body;
    const phoneNumber = metadata?.phone_number_id;
    
    console.log(`WhatsApp message from ${from}: ${userMessage}`);
    
    // Add user message to conversation history
    addToWhatsAppConversationHistory(from, userMessage, 'user');
    
    // Get conversation history for context
    const conversationHistory = getWhatsAppConversationHistory(from);
    
    // Get MEENA response with conversation history and ChromaDB context
    const response = await getMeenaResponseWithContext(userMessage, from, 'whatsapp', conversationHistory);
    
    // Add MEENA response to conversation history
    if (response) {
      addToWhatsAppConversationHistory(from, response, 'assistant');
    }
    
    // Send response back to WhatsApp
    await sendWhatsAppMessage(from, response, phoneNumber);
    
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    await sendWhatsAppMessage(message.from, "Sorry, I'm having trouble processing your message. Please try again.");
  }
}

async function sendWhatsAppMessage(to, message, phoneNumberId) {
  try {
    const { getBotCredentials } = await import('../../../lib/botConfig');
    const credentials = getBotCredentials('whatsapp');
    
    const accessToken = credentials.accessToken;
    const phoneId = phoneNumberId || credentials.phoneNumberId;
    
    if (!accessToken || !phoneId) {
      console.error('Missing WhatsApp credentials');
      return;
    }
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
    } else {
      console.log(`Message sent to WhatsApp user ${to}`);
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

async function getMeenaResponseWithContext(message, userId, platform, conversationHistory = []) {
  try {
    // Format conversation history for the chat API (exclude current message)
    const formattedHistory = conversationHistory.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    console.log(`📱 WhatsApp: Sending message with ${formattedHistory.length} previous messages as context`);
    
    // Search ChromaDB for relevant context
    let contextualInfo = '';
    let hasContext = false;
    
    try {
      console.log('🔍 WhatsApp: Searching ChromaDB for relevant context...');
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
          console.log(`📚 WhatsApp: Found ${chromaResult.results.length} relevant knowledge entries`);
          chromaResult.results.forEach((result, i) => {
            console.log(`  ${i + 1}. Title: ${result.title || 'No title'}`);
            console.log(`      Content: ${(result.text || result.content || '').substring(0, 100)}...`);
          });
        } else {
          console.log('📚 WhatsApp: No relevant knowledge found in ChromaDB');
        }
      }
    } catch (chromaError) {
      console.error('❌ WhatsApp: ChromaDB search failed:', chromaError);
    }
    
    // Enhance message with context if available
    const enhancedMessage = hasContext ? message + contextualInfo : message;
    
    console.log(`📱 WhatsApp: Enhanced message length: ${enhancedMessage.length} chars (context: ${hasContext ? 'YES' : 'NO'})`);
    
    // Use the existing chat API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: enhancedMessage,
        originalMessage: message,
        language: 'English', // Default language, could be detected
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