#!/usr/bin/env node

// Simple TTS endpoint test
async function testTTSEndpoint() {
  console.log('🧪 Testing TTS API Endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/tts', {
      method: 'GET'
    });
    
    const data = await response.json();
    console.log('✅ TTS Endpoint Info:', data);
    
    if (data.available) {
      console.log('🎙️ SarvamAI TTS is available and configured!');
    } else {
      console.log('⚠️ SarvamAI TTS not configured. Check SARVAM_API_KEY in .env.local');
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to TTS endpoint:', error.message);
    console.log('💡 Make sure the development server is running: npm run dev');
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTTSEndpoint();
}

export { testTTSEndpoint };