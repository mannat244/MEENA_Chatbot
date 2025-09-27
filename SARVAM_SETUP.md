# SarvamAI Integration Setup Gu## 🎯 Features

### Primary Model for All Languages
- **SarvamAI (sarvam-m)** → Primary model for English and all Indian languages
- **Groq (Gemma 2 only)** → Alternative model option

### Advanced Text-to-Speech (NEW!)
🎙️ **SarvamAI TTS with Arya Voice**
- High-quality female voice (Arya) for all supported languages
- Natural pronunciation for Indian languages
- Automatic fallback to browser TTS if needed
- Smart audio management with loading indicators

### Conversation History & Follow-ups (NEW!)
💬 **Context-Aware Conversations**
- Maintains context of last 6 messages for intelligent follow-ups
- Supports questions like "Can you explain that further?" or "What about the other option?"
- Works across both SarvamAI and Groq models
- Preserves context when switching languages
- Smart memory management to optimize performance

### Supported Languages (SarvamAI Optimized)
- **English**
- **Hindi** (हिन्दी)
- **Marathi** (मराठी) 
- **Tamil** (தமிழ்)
- **Bengali** (বাংলা)
- **Gujarati** (ગુજરાતી)
- **Kannada** (ಕನ್ನಡ)
- **Malayalam** (മലയാളം)
- **Telugu** (తెలుగు)
- **Punjabi** (ਪੰਜਾਬੀ)
- **Odia** (ଓଡ଼ିଆ)

### Key Advantages of SarvamAI
✅ **Better Cultural Context** - Understands Indian cultural nuances
✅ **Regional Language Expertise** - Native-level understanding of Indian languages  
✅ **Educational Context** - Optimized for Indian educational systems
✅ **Wiki Grounding** - Automatic Wikipedia context when no knowledge base match
✅ **Premium TTS** - High-quality text-to-speech with natural voices
✅ **Multilingual Support** - Single model handles all languages efficiently

## 🎙️ Text-to-Speech (TTS) Usage

### How to Use TTS
1. **Chat with MEENA** - Get a response from the AI
2. **Click the Volume Icon** 🔊 - Look for the speaker button next to bot responses
3. **Automatic Language Detection** - TTS automatically uses the correct language
4. **High-Quality Voice** - Enjoy natural speech with Arya (female voice)

### TTS Features
- **Smart Audio Management** - Stops previous audio when starting new
- **Loading Indicators** - Visual feedback during speech conversion
- **Automatic Fallback** - Uses browser TTS if SarvamAI unavailable  
- **Language Optimization** - Each language uses optimal voice settings

### Technical Specifications
- **Voice Model**: Arya (Female)
- **Sample Rate**: 22,050 Hz (High Quality)
- **Audio Format**: WAV
- **Max Text Length**: 1,500 characters
- **Preprocessing**: Enabled for mixed-language text
- **Pitch/Pace**: Optimized for clarity

## 🔧 Troubleshooting

### TTS Not Working?
1. **Check API Key** - Ensure SARVAM_API_KEY is in .env.local
2. **Restart Server** - Run `npm run dev` after adding the key
3. **Browser Support** - Falls back to browser TTS automatically
4. **Network Issues** - Check console for API errors

### Common Issues
- **No Sound**: Check browser audio permissions
- **Loading Forever**: Network timeout - will fallback automatically  
- **Wrong Language**: Ensure correct language is selected in dropdown
- **Audio Cuts Off**: Previous audio stopped automatically (normal behavior)

### Testing TTS
```bash
# Test TTS functionality
node test-tts.mjs
```y Model for All Languages

MEENA now uses **SarvamAI as the default model** for both English and Indian languages, with Groq Gemma 2 as an alternative option!

## 🚀 Quick Setup

### 1. Get SarvamAI API Key
- Visit: https://api.sarvam.ai/dashboard
- Sign up for an account
- Generate your API subscription key

### 2. Add to Environment Variables

Add this to your `.env.local` file:

```bash
# Existing variables
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# NEW: SarvamAI for Indian Languages
SARVAM_API_KEY=your_sarvam_api_subscription_key_here
```

### 3. Restart Your Application
```bash
npm run dev
```

## 🎯 Features

### Automatic Model Selection
- **English** → Uses Groq models (Gemma 2, Llama 3, Mixtral)
- **Indian Languages** → Automatically switches to SarvamAI Sarvam-M model

### Supported Languages (SarvamAI Optimized)
- **Hindi** (हिन्दी)
- **Marathi** (मराठी) 
- **Tamil** (தமிழ்)
- **Bengali** (বাংলা)
- **Gujarati** (ગુજરાતી)
- And many more regional languages

### Key Advantages of SarvamAI
✅ **Better Cultural Context** - Understands Indian cultural nuances
✅ **Regional Language Expertise** - Native-level understanding of Indian languages  
✅ **Educational Context** - Optimized for Indian educational systems
✅ **Wiki Grounding** - Automatic Wikipedia context when no knowledge base match
✅ **MANIT-Specific** - Better understanding of Indian technical institutes

## 🔧 Manual Model Selection

Users can manually choose models in the header:
- **🌐 General Models** - Groq (Gemma 2, Llama 3, Mixtral)
- **🇮🇳 Indian Languages** - SarvamAI (Sarvam-M) ⭐

## 🎛️ Technical Details

### API Configuration
- **Provider**: SarvamAI
- **Model**: sarvam-m  
- **Temperature**: 0.7 (optimized for educational content)
- **Max Tokens**: 1024
- **Wiki Grounding**: Auto-enabled when no context available

### Error Handling
- Graceful fallback to Groq if SarvamAI unavailable
- Clear error messages for missing API keys
- Automatic model switching based on language selection

## 🌟 Usage Tips

1. **For Indian Languages**: The system automatically selects SarvamAI
2. **For English**: Uses Groq models for optimal performance  
3. **Mixed Language Queries**: Choose model manually based on primary language
4. **Educational Queries**: SarvamAI excels at Indian educational context

## 🔍 Verification

Check if SarvamAI is working:
1. Select a non-English language (e.g., Hindi)
2. Look for the purple indicator: "🇮🇳 Using SarvamAI for enhanced Hindi understanding"
3. Ask a question - should get contextually appropriate responses

## 🆘 Troubleshooting

**Model not switching?**
- Check API key is correctly set in `.env.local`
- Restart the development server
- Check console for error messages

**API errors?**
- Verify SarvamAI API subscription is active
- Check API key format (should be subscription key)
- Ensure proper internet connectivity

## 💡 Why SarvamAI + Groq?

This dual-LLM approach provides:
- **Best of both worlds** - General purpose + Indian language specialization
- **Fallback reliability** - If one provider fails, other continues
- **Optimized performance** - Right model for the right language
- **Enhanced user experience** - Automatic intelligent switching

---

**Ready to experience MEENA's enhanced multilingual capabilities!** 🚀🇮🇳