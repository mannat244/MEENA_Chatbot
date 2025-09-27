import { NextResponse } from 'next/server';

// Simple test endpoint to verify webhook connectivity
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Telegram webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: 'https://x1npp062-3000.inc1.devtunnels.ms/api/telegram'
  });
}

export async function POST() {
  return NextResponse.json({ 
    status: 'received',
    message: 'Webhook is working',
    timestamp: new Date().toISOString()
  });
}