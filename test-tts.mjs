// Test SarvamAI TTS API
import { SarvamAIClient } from 'sarvamai';

async function testTTS() {
  try {
    console.log('🧪 Testing SarvamAI TTS API...');
    
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      throw new Error('SARVAM_API_KEY not found in environment');
    }

    const sarvam = new SarvamAIClient({ 
      apiSubscriptionKey: apiKey 
    });

    // Test with a simple English text
    const testText = "Hello, this is a test of SarvamAI text to speech functionality.";
    
    console.log('📝 Testing text:', testText);
    console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');

    const response = await sarvam.textToSpeech.convert({
      text: testText,
      target_language_code: 'en-IN',
      speaker: 'arya',
      pitch: 0.0,
      pace: 1.0,
      loudness: 1.2,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: 'bulbul:v2'
    });

    console.log('✅ TTS Response:', {
      requestId: response.request_id,
      audioCount: response.audios?.length || 0,
      audioPreview: response.audios?.[0]?.substring(0, 50) + '...' || 'No audio'
    });

    console.log('🎵 TTS test completed successfully!');
    
  } catch (error) {
    console.error('❌ TTS Test Failed:', error);
  }
}

testTTS();