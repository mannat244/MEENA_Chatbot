import { NextResponse } from 'next/server';
import { loadBotConfig, saveBotConfig, updateBotConfig } from '../../../../lib/botConfig';

export async function GET() {
  try {
    const config = loadBotConfig();
    
    // Return config without sensitive tokens (for dashboard display)
    const safeConfig = {
      whatsapp: {
        accessToken: config.whatsapp.accessToken ? '•'.repeat(20) : '',
        phoneNumberId: config.whatsapp.phoneNumberId,
        verifyToken: config.whatsapp.verifyToken ? '•'.repeat(10) : '',
        enabled: config.whatsapp.enabled,
        hasToken: !!config.whatsapp.accessToken
      },
      telegram: {
        botToken: config.telegram.botToken ? '•'.repeat(20) : '',
        webhookSecret: config.telegram.webhookSecret ? '•'.repeat(10) : '',
        enabled: config.telegram.enabled,
        hasToken: !!config.telegram.botToken
      },
      general: config.general
    };
    
    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error('Error getting bot config:', error);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { platform, config } = await request.json();
    
    if (!platform || !config) {
      return NextResponse.json({ error: 'Platform and config required' }, { status: 400 });
    }
    
    const result = updateBotConfig(platform, config);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving bot config:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { webhookUrl } = await request.json();
    
    const config = loadBotConfig();
    config.general.webhookUrl = webhookUrl;
    
    const result = saveBotConfig(config);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Webhook URL updated' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating webhook URL:', error);
    return NextResponse.json({ error: 'Failed to update webhook URL' }, { status: 500 });
  }
}