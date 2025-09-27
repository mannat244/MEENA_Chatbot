import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check bot status by testing API connections
    const status = {
      whatsapp: await checkWhatsAppStatus(),
      telegram: await checkTelegramStatus()
    };
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking bot status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

async function checkWhatsAppStatus() {
  try {
    const { getBotCredentials } = await import('../../../../lib/botConfig');
    const credentials = getBotCredentials('whatsapp');
    const accessToken = credentials.accessToken;
    const phoneNumberId = credentials.phoneNumberId;
    
    if (!accessToken || !phoneNumberId) {
      return { connected: false, lastMessage: null, messageCount: 0 };
    }
    
    // Test WhatsApp API connection
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      return { connected: true, lastMessage: new Date().toISOString(), messageCount: 0 };
    } else {
      return { connected: false, lastMessage: null, messageCount: 0 };
    }
  } catch (error) {
    return { connected: false, lastMessage: null, messageCount: 0 };
  }
}

async function checkTelegramStatus() {
  try {
    const { getBotCredentials } = await import('../../../../lib/botConfig');
    const credentials = getBotCredentials('telegram');
    const botToken = credentials.botToken;
    
    console.log('Checking Telegram status:', { 
      hasToken: !!botToken, 
      tokenPrefix: botToken ? botToken.substring(0, 10) : 'none' 
    });
    
    if (!botToken) {
      console.log('No Telegram bot token found');
      return { connected: false, lastMessage: null, messageCount: 0, error: 'No bot token configured' };
    }
    
    // Test Telegram API connection
    console.log('Testing Telegram API connection...');
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    
    console.log('Telegram API response:', { ok: data.ok, result: data.result?.username });
    
    if (data.ok) {
      return { 
        connected: true, 
        lastMessage: new Date().toISOString(), 
        messageCount: 0,
        botInfo: data.result
      };
    } else {
      return { 
        connected: false, 
        lastMessage: null, 
        messageCount: 0, 
        error: data.description || 'API call failed'
      };
    }
  } catch (error) {
    console.error('Error checking Telegram status:', error);
    return { 
      connected: false, 
      lastMessage: null, 
      messageCount: 0, 
      error: error.message 
    };
  }
}