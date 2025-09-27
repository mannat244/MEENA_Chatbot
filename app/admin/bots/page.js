'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Phone, Send, Settings, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function BotManagement() {
  const [botStatus, setBotStatus] = useState({
    whatsapp: { connected: false, lastMessage: null, messageCount: 0 },
    telegram: { connected: false, lastMessage: null, messageCount: 0 }
  });
  
  const [webhookUrls, setWebhookUrls] = useState({
    whatsapp: '',
    telegram: ''
  });
  
  const [botSettings, setBotSettings] = useState({
    whatsapp: {
      accessToken: '',
      phoneNumberId: '',
      verifyToken: ''
    },
    telegram: {
      botToken: '',
      webhookSecret: ''
    }
  });
  
  const [testMessages, setTestMessages] = useState({
    whatsapp: 'Hello! This is a test message from MEENA.',
    telegram: 'Hello! This is a test message from MEENA.'
  });

  useEffect(() => {
    // Set webhook URLs based on current domain
    const baseUrl = window.location.origin;
    setWebhookUrls({
      whatsapp: `${baseUrl}/api/whatsapp`,
      telegram: `${baseUrl}/api/telegram`
    });
    
    loadBotConfig();
    checkBotStatus();
  }, []);

  const loadBotConfig = async () => {
    try {
      const response = await fetch('/api/bots/config');
      const config = await response.json();
      
      setBotSettings({
        whatsapp: {
          accessToken: config.whatsapp.hasToken ? config.whatsapp.accessToken : '',
          phoneNumberId: config.whatsapp.phoneNumberId || '',
          verifyToken: config.whatsapp.hasToken ? config.whatsapp.verifyToken : ''
        },
        telegram: {
          botToken: config.telegram.hasToken ? config.telegram.botToken : '',
          webhookSecret: config.telegram.webhookSecret || ''
        }
      });
    } catch (error) {
      console.error('Error loading bot config:', error);
    }
  };

  const saveBotConfig = async (platform, config) => {
    try {
      const response = await fetch('/api/bots/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, config })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`${platform} configuration saved successfully!`);
        checkBotStatus();
      } else {
        alert(`Failed to save ${platform} configuration: ` + result.error);
      }
    } catch (error) {
      alert(`Error saving ${platform} configuration: ` + error.message);
    }
  };

  const checkBotStatus = async () => {
    try {
      console.log('Checking bot status...');
      const response = await fetch('/api/bots/status');
      const data = await response.json();
      console.log('Bot status response:', data);
      setBotStatus(data);
    } catch (error) {
      console.error('Error checking bot status:', error);
    }
  };

  const setupTelegramWebhook = async () => {
    if (!botSettings.telegram.botToken) {
      alert('Please enter Telegram bot token first');
      return;
    }

    try {
      console.log('Setting up Telegram webhook with token:', botSettings.telegram.botToken.substring(0, 10) + '...');
      
      const response = await fetch('/api/bots/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botSettings.telegram.botToken,
          webhookUrl: webhookUrls.telegram
        })
      });
      
      const result = await response.json();
      console.log('Webhook setup result:', result);
      
      if (result.success) {
        alert(`✅ Telegram webhook setup successfully!\n\nBot: ${result.botInfo?.username || 'Unknown'}\nWebhook: ${result.webhookUrl}`);
        checkBotStatus();
      } else {
        console.error('Webhook setup failed:', result);
        alert(`❌ Failed to setup Telegram webhook:\n\n${result.error}\n\n${result.details ? 'Details: ' + JSON.stringify(result.details, null, 2) : ''}`);
      }
    } catch (error) {
      console.error('Error setting up webhook:', error);
      alert('❌ Error setting up Telegram webhook: ' + error.message);
    }
  };

  const testTelegramToken = async () => {
    if (!botSettings.telegram.botToken) {
      alert('Please enter Telegram bot token first');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botSettings.telegram.botToken}/getMe`);
      const result = await response.json();
      
      if (result.ok) {
        alert(`✅ Bot token is valid!\n\nBot Name: ${result.result.first_name}\nUsername: @${result.result.username}\nID: ${result.result.id}`);
      } else {
        alert(`❌ Invalid bot token:\n\n${result.description}`);
      }
    } catch (error) {
      alert('❌ Error testing bot token: ' + error.message);
    }
  };

  const setupWhatsAppWebhook = async () => {
    alert('WhatsApp webhook must be configured in Meta Developer Console. Use this URL: ' + webhookUrls.whatsapp);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 Bot Management
        </h1>
        <p className="text-gray-600">
          Connect MEENA to WhatsApp and Telegram for broader reach and accessibility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* WhatsApp Bot */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">WhatsApp Bot</h2>
              <p className="text-sm text-gray-600">Meta WhatsApp Business API</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={checkBotStatus}
                className="p-1 hover:bg-gray-100 rounded"
                title="Refresh status"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
              {botStatus.whatsapp.connected ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-medium ${botStatus.whatsapp.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {botStatus.whatsapp.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Messages:</span>
                <span className="ml-2 font-medium text-gray-900">{botStatus.whatsapp.messageCount}</span>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <input
                type="password"
                value={botSettings.whatsapp.accessToken}
                onChange={(e) => setBotSettings(prev => ({
                  ...prev,
                  whatsapp: { ...prev.whatsapp, accessToken: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter WhatsApp Access Token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={botSettings.whatsapp.phoneNumberId}
                onChange={(e) => setBotSettings(prev => ({
                  ...prev,
                  whatsapp: { ...prev.whatsapp, phoneNumberId: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Phone Number ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={webhookUrls.whatsapp}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm bg-gray-50"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(webhookUrls.whatsapp)}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure this URL in Meta Developer Console
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => saveBotConfig('whatsapp', {
                accessToken: botSettings.whatsapp.accessToken,
                phoneNumberId: botSettings.whatsapp.phoneNumberId,
                verifyToken: botSettings.whatsapp.verifyToken,
                enabled: !!(botSettings.whatsapp.accessToken && botSettings.whatsapp.phoneNumberId)
              })}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              disabled={!botSettings.whatsapp.accessToken || !botSettings.whatsapp.phoneNumberId}
            >
              Save Config
            </button>
            <button
              onClick={setupWhatsAppWebhook}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Instructions
            </button>
          </div>
        </div>

        {/* Telegram Bot */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Telegram Bot</h2>
              <p className="text-sm text-gray-600">Telegram Bot API</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={checkBotStatus}
                className="p-1 hover:bg-gray-100 rounded"
                title="Refresh status"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
              {botStatus.telegram.connected ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-medium ${botStatus.telegram.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {botStatus.telegram.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Messages:</span>
                <span className="ml-2 font-medium text-gray-900">{botStatus.telegram.messageCount}</span>
              </div>
              {botStatus.telegram.botInfo && (
                <div className="col-span-2">
                  <span className="text-gray-600">Bot:</span>
                  <span className="ml-2 font-medium text-blue-600">@{botStatus.telegram.botInfo.username}</span>
                </div>
              )}
              {botStatus.telegram.error && (
                <div className="col-span-2">
                  <span className="text-gray-600">Error:</span>
                  <span className="ml-2 font-medium text-red-600 text-xs">{botStatus.telegram.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bot Token
              </label>
              <input
                type="password"
                value={botSettings.telegram.botToken}
                onChange={(e) => setBotSettings(prev => ({
                  ...prev,
                  telegram: { ...prev.telegram, botToken: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Telegram Bot Token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={webhookUrls.telegram}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm bg-gray-50"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(webhookUrls.telegram)}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Webhook will be set automatically
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => saveBotConfig('telegram', {
                botToken: botSettings.telegram.botToken,
                webhookSecret: botSettings.telegram.webhookSecret,
                enabled: !!botSettings.telegram.botToken
              })}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              disabled={!botSettings.telegram.botToken}
            >
              Save Config
            </button>
            <button
              onClick={testTelegramToken}
              className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              disabled={!botSettings.telegram.botToken}
            >
              Test Token
            </button>
            <button
              onClick={setupTelegramWebhook}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              disabled={!botSettings.telegram.botToken}
            >
              Setup Webhook
            </button>
            <button
              onClick={() => window.open('/api/telegram/polling', '_blank')}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              title="Start polling mode for local development"
            >
              Start Polling
            </button>
          </div>
        </div>
      </div>

      {/* Local Development Notice */}
      <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Local Development</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-yellow-800 mb-2">✅ Telegram - Works Locally:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Use polling mode (no webhook needed)</li>
              <li>• Visit <code>/api/telegram/polling</code> to start</li>
              <li>• Perfect for local testing</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-yellow-800 mb-2">❌ WhatsApp - Needs Public URL:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Requires HTTPS webhook</li>
              <li>• Use Ngrok for local testing</li>
              <li>• Or deploy to test WhatsApp</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💡 Quick Local Test:</strong> Add <code>TELEGRAM_BOT_TOKEN</code> to your environment, 
            then visit <a href="/api/telegram/polling" className="underline">/api/telegram/polling</a> to start polling mode.
          </p>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Setup Instructions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">WhatsApp Bot Setup:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
              <li>Create a Meta Developer account</li>
              <li>Set up WhatsApp Business API</li>
              <li>Get Access Token and Phone Number ID</li>
              <li>Configure webhook URL in Meta Console</li>
              <li>Add environment variables to your deployment</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Telegram Bot Setup:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
              <li>Message @BotFather on Telegram</li>
              <li>Create new bot with /newbot command</li>
              <li>Get bot token from BotFather</li>
              <li>Enter token above and setup webhook</li>
              <li>Bot will be ready to receive messages</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Required Environment Variables:</h4>
          <div className="text-sm text-blue-700 font-mono">
            <div>WHATSAPP_ACCESS_TOKEN=your_access_token</div>
            <div>WHATSAPP_PHONE_NUMBER_ID=your_phone_id</div>
            <div>WHATSAPP_VERIFY_TOKEN=your_verify_token</div>
            <div>TELEGRAM_BOT_TOKEN=your_bot_token</div>
          </div>
        </div>
      </div>
    </div>
  );
}