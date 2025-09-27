import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'bot-config.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Default configuration
const defaultConfig = {
  whatsapp: {
    accessToken: '',
    phoneNumberId: '',
    verifyToken: '',
    enabled: false
  },
  telegram: {
    botToken: '',
    webhookSecret: '',
    enabled: false
  },
  general: {
    webhookUrl: '',
    lastUpdated: null
  }
};

// Load bot configuration
export function loadBotConfig() {
  try {
    ensureDataDir();
    
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { ...defaultConfig, ...config };
    }
    
    // Return environment variables if config file doesn't exist
    return {
      ...defaultConfig,
      whatsapp: {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
        enabled: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
        enabled: !!process.env.TELEGRAM_BOT_TOKEN
      },
      general: {
        webhookUrl: process.env.NEXTAUTH_URL || '',
        lastUpdated: null
      }
    };
  } catch (error) {
    console.error('Error loading bot config:', error);
    return defaultConfig;
  }
}

// Save bot configuration
export function saveBotConfig(config) {
  try {
    ensureDataDir();
    
    const updatedConfig = {
      ...config,
      general: {
        ...config.general,
        lastUpdated: new Date().toISOString()
      }
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving bot config:', error);
    return { success: false, error: error.message };
  }
}

// Get specific bot credentials (for use in bot APIs)
export function getBotCredentials(platform) {
  const config = loadBotConfig();
  
  if (platform === 'whatsapp') {
    // Prefer environment variables over config file for security
    return {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || config.whatsapp.accessToken,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || config.whatsapp.phoneNumberId,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || config.whatsapp.verifyToken
    };
  }
  
  if (platform === 'telegram') {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken,
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || config.telegram.webhookSecret
    };
  }
  
  return null;
}

// Update specific bot configuration
export function updateBotConfig(platform, updates) {
  const config = loadBotConfig();
  
  if (platform === 'whatsapp' || platform === 'telegram') {
    config[platform] = { ...config[platform], ...updates };
    return saveBotConfig(config);
  }
  
  return { success: false, error: 'Invalid platform' };
}