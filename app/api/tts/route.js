import { NextResponse } from 'next/server';
import { SarvamAIClient } from 'sarvamai';

// Initialize SarvamAI client
const sarvam = process.env.SARVAM_API_KEY ? new SarvamAIClient({ 
  apiSubscriptionKey: process.env.SARVAM_API_KEY 
}) : null;

// Language code mapping for SarvamAI TTS
const LANGUAGE_CODE_MAP = {
  'English': 'en-IN',
  'हिन्दी (Hindi)': 'hi-IN',
  'मराठी (Marathi)': 'mr-IN', 
  'தமிழ் (Tamil)': 'ta-IN',
  'বাংলা (Bengali)': 'bn-IN',
  'ગુજરાતી (Gujarati)': 'gu-IN',
  'ಕನ್ನಡ (Kannada)': 'kn-IN'
};

export async function POST(request) {
  console.log('\n🔊 ===== SARVAM TTS API CALLED =====');
  
  try {
    // Check if SarvamAI is available
    if (!sarvam) {
      return NextResponse.json({
        success: false,
        error: 'SarvamAI TTS not configured. Please add SARVAM_API_KEY to environment variables.',
        fallback: true
      }, { status: 400 });
    }

    const { text, language = 'English' } = await request.json();

    console.log('🔊 TTS Request:', {
      text: text?.substring(0, 100) + (text?.length > 100 ? '...' : ''),
      textLength: text?.length,
      language: language
    });

    // Validate input
    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Text is required for TTS conversion'
      }, { status: 400 });
    }

    if (text.length > 1500) {
      return NextResponse.json({
        success: false,
        error: 'Text must be no longer than 1500 characters',
        textLength: text.length
      }, { status: 400 });
    }

    // For texts longer than 800 chars, warn about potential truncation
    if (text.length > 800) {
      console.warn('⚠️ Long text detected:', text.length, 'characters - may experience audio truncation');
      console.warn('Consider splitting text for better TTS results');
    }

    // Get target language code
    const targetLanguageCode = LANGUAGE_CODE_MAP[language] || 'en-IN';
    
    console.log('🌐 Language mapping:', {
      selectedLanguage: language,
      targetCode: targetLanguageCode
    });

    // Prepare TTS request - using EXACT official SarvamAI parameters
    const ttsOptions = {
      text: text,
      target_language_code: targetLanguageCode,
      speaker: "arya", // Female voice as requested
      pitch: 0, // Official spec uses 0, not 0.0
      pace: 1, // Official spec default pace
      loudness: 1, // Official spec default loudness
      speech_sample_rate: 22050, // High quality audio
      enable_preprocessing: true, // Better handling of mixed-language text
      model: "bulbul:v2" // Official model specification
    };

    console.log('🎙️ TTS Options:', {
      ...ttsOptions,
      text: ttsOptions.text.substring(0, 50) + '...'
    });

    // Call SarvamAI TTS API
    const ttsResponse = await sarvam.textToSpeech.convert(ttsOptions);

    console.log('✅ SarvamAI TTS Response received:', {
      requestId: ttsResponse.request_id,
      audioCount: ttsResponse.audios?.length || 0
    });

    if (!ttsResponse.audios || ttsResponse.audios.length === 0) {
      throw new Error('No audio generated from SarvamAI TTS');
    }

    // Return the base64 encoded audio
    const audioBase64 = ttsResponse.audios[0];
    
    console.log('🎵 Audio generated successfully:', {
      inputTextLength: text.length,
      audioBase64Length: audioBase64.length,
      estimatedAudioDuration: Math.round(audioBase64.length / 30000), // Rough estimate in seconds
      preview: audioBase64.substring(0, 50) + '...'
    });

    // Debug: Check if the audio seems complete
    if (audioBase64.length < 50000) { // Less than ~3 seconds of audio
      console.warn('⚠️ WARNING: Audio seems very short for', text.length, 'characters');
      console.warn('Expected longer audio for text:', text.substring(0, 100) + '...');
    }

    return NextResponse.json({
      success: true,
      message: 'TTS conversion completed successfully',
      data: {
        requestId: ttsResponse.request_id,
        audioBase64: audioBase64,
        language: targetLanguageCode,
        speaker: 'arya',
        textLength: text.length,
        sampleRate: 22050,
        codec: 'wav'
      }
    });

  } catch (error) {
    console.error('❌ SarvamAI TTS Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'TTS conversion failed',
      details: error.message,
      fallback: true // Indicates frontend should fallback to browser TTS
    }, { status: 500 });
  }
}

// GET endpoint for TTS info and testing
export async function GET() {
  return NextResponse.json({ 
    message: 'SarvamAI TTS API is running',
    version: '1.0.0',
    features: {
      maxTextLength: 1500,
      supportedLanguages: Object.keys(LANGUAGE_CODE_MAP),
      defaultSpeaker: 'arya',
      sampleRate: 22050,
      audioFormat: 'WAV (base64 encoded)'
    },
    available: !!process.env.SARVAM_API_KEY,
    timestamp: new Date().toISOString()
  });
}