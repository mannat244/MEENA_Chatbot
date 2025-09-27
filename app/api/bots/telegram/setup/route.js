import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    let { botToken, webhookUrl } = await request.json();
    
    // Use your port forwarded URL
    webhookUrl = "https://x1npp062-3000.inc1.devtunnels.ms/api/telegram";
    
    console.log('Setting up Telegram webhook:', { 
      botToken: botToken ? `${botToken.substring(0, 10)}...` : 'missing',
      webhookUrl 
    });

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
    }

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
    }
    
    // First test if bot token is valid by calling getMe
    console.log('Testing bot token validity...');
    const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const testResult = await testResponse.json();
    
    if (!testResult.ok) {
      console.error('Invalid bot token:', testResult);
      return NextResponse.json({ 
        error: `Invalid bot token: ${testResult.description || 'Token verification failed'}` 
      }, { status: 400 });
    }
    
    console.log('Bot token valid, bot info:', testResult.result);
    
    // Now set webhook for Telegram bot
    console.log('Setting webhook...');
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true
      }),
    });
    
    const result = await response.json();
    console.log('Webhook setup result:', result);
    
    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook set successfully',
        botInfo: testResult.result,
        webhookUrl: webhookUrl
      });
    } else {
      return NextResponse.json({ 
        error: result.description || 'Failed to set webhook',
        details: result
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Telegram setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// GET endpoint to check current webhook info
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const botToken = url.searchParams.get('botToken');
    
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token required' }, { status: 400 });
    }
    
    // Get current webhook info
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const result = await response.json();
    
    if (result.ok) {
      return NextResponse.json({
        success: true,
        webhookInfo: result.result
      });
    } else {
      return NextResponse.json({
        error: result.description || 'Failed to get webhook info'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return NextResponse.json({ 
      error: 'Failed to get webhook info',
      details: error.message
    }, { status: 500 });
  }
}