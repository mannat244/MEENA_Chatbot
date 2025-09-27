import { Groq } from 'groq-sdk';
import { SarvamAIClient } from 'sarvamai';
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb.js';
import Chat from '../../../models/Chat.js';
import { findLocationInQuery, generateMapResponse, CAMPUS_LOCATIONS } from '../../../lib/mapUtils.js';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: false
});

// Initialize SarvamAI client (only if API key is available)
const sarvam = process.env.SARVAM_API_KEY ? new SarvamAIClient({ 
  apiSubscriptionKey: process.env.SARVAM_API_KEY 
}) : null;

export async function POST(request) {
  try {
    const { 
      message, 
      originalMessage,
      language, 
      contextualInfo, 
      hasContext,
      model: requestedModel = 'gemma2-9b-it',
      conversationHistory = [] 
    } = await request.json();
    
    // Validate and set the model
    const model = validateModel(requestedModel);
    
    console.log('\n🤖 ===== CHAT API RECEIVED REQUEST =====');
    console.log('📝 Original Message:', originalMessage || 'Not provided');
    console.log('📋 Enhanced Message Length:', message?.length || 0);
    console.log('🔧 Has Context:', hasContext);
    console.log('📊 Context Info Length:', contextualInfo?.length || 0);
    console.log('💬 Conversation History:', conversationHistory?.length || 0, 'messages');

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 🗺️ Check if this is a location query
    const locationQuery = findLocationInQuery(originalMessage || message);
    if (locationQuery) {
      console.log('🗺️ Location query detected:', locationQuery.name);
      const mapResponse = generateMapResponse(locationQuery, originalMessage || message);
      
      if (mapResponse) {
        console.log('✅ Returning pre-generated map response');
        
        // Create streaming response for consistency with other responses
        const encoder = new TextEncoder();
        
        const stream = new ReadableStream({
          async start(controller) {
            try {
              // Split response into chunks for streaming effect
              const words = mapResponse.split(' ');
              
              for (let i = 0; i < words.length; i++) {
                const wordToSend = (i > 0 ? ' ' : '') + words[i];
                const data = `data: ${JSON.stringify({ content: wordToSend })}\n\n`;
                controller.enqueue(encoder.encode(data));
                
                // Small delay for streaming effect
                await new Promise(resolve => setTimeout(resolve, 30));
              }
              
              // Send done signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              
              // Log the interaction for statistics
              try {
                await dbConnect();
                const chatDoc = new Chat({
                  message: originalMessage || message,
                  response: mapResponse,
                  timestamp: new Date(),
                  language: language || 'English',
                  hasContext: false,
                  contextInfo: `Location query for: ${locationQuery.name}`,
                  model: 'location_service'
                });
                await chatDoc.save();
                console.log('📊 Location query logged to MongoDB');
              } catch (dbError) {
                console.warn('Database logging failed for location query:', dbError.message);
              }
              
            } catch (error) {
              console.error('Location response streaming error:', error);
              controller.error(error);
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      }
    }

    // Language instruction based on selected language
    const languageInstruction = language !== 'English' 
      ? `Please respond in ${language}. ` 
      : '';

    // Build conversation history for context
    const conversationMessages = [];
    
    // Add conversation history (last 6 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6); // Last 6 messages
      recentHistory.forEach(msg => {
        if (msg.sender === 'user') {
          conversationMessages.push({ role: 'user', content: msg.text });
        } else if (msg.sender === 'meena') {
          conversationMessages.push({ role: 'assistant', content: msg.text });
        }
      });
      
      console.log('\n💬 ===== CONVERSATION HISTORY DEBUG =====');
      console.log('📊 Total history messages:', conversationMessages.length);
      conversationMessages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg.role}: ${msg.content.substring(0, 100)}...`);
      });
      console.log('✅ Conversation context will be sent to LLM for follow-up understanding');
    } else {
      console.log('\n❌ No conversation history - this is a fresh conversation');
    }

    // System prompt for MEENA - Updated to work with context and conversation history
    const basePrompt = `You are MEENA, a Multilingual Embeddable Educational Natural Language Assistant for Maulana Azad National Institute of Technology (MANIT), Bhopal. You help students with academic queries, campus information, and administrative processes.

GUIDELINES:
- Communicate naturally in English, Hindi, Punjabi, Marathi, Tamil, Telugu and other Indian regional languages
- Keep replies concise, accurate, and conversational
- Maintain a professional, student-friendly tone
- Always be helpful and provide practical guidance
- Use previous conversation context to provide relevant follow-up responses
- Reference earlier parts of the conversation when appropriate

�️ LOCATION & MAP FUNCTIONALITY:
When users ask about locations on campus (like "Where is NTB?", "Location of library", etc.), you can provide interactive maps by including:
MAP_COORDINATES{"coordinates": [latitude, longitude], "title": "Location Name", "description": "Brief description"}

Available campus locations include:
- NTB (New Technology Block): 23.217438984792697, 77.40852269998584
- H10 Block: 23.209486879043148, 77.41245462794596  
- Library, Hostels, Main Gate, Sports Complex, Medical Center, etc.

�🔧 HUMAN FALLBACK TRIGGER:
If you cannot provide accurate information or if the user needs specialized human assistance, include this exact code anywhere in your response: HUMAN_FALLBACK_TRIGGER_7439
This will automatically connect them to human support while showing your response. Use this for:
- Complex administrative queries requiring verification
- Sensitive matters needing personal attention  
- When you're uncertain about accuracy
- Emergency or urgent situations
- When user explicitly asks for human contact

${hasContext ? `CONTEXT-BASED RESPONSE MODE:
- The user's message includes relevant information from the MANIT knowledge base
- Prioritize and use the provided knowledge base information in your response
- Cite specific details from the knowledge base when answering
- If the knowledge base information answers their question, use it confidently
- If additional verification is needed, suggest they contact the appropriate office and include HUMAN_FALLBACK_TRIGGER_7439` : `NO-CONTEXT RESPONSE MODE:
- No specific MANIT information is available for this query
- Provide general guidance and suggest they contact MANIT offices for accurate details
- For important queries, include HUMAN_FALLBACK_TRIGGER_7439 to connect them to human support
- Mention that for current information, they should check the official MANIT website or contact:
  * Academic Office: For exam dates, academic calendar
  * Accounts Office: For fee information
  * Hostel Office: For accommodation queries
  * Training & Placement: For placement related queries`}

${languageInstruction}`;

    const systemPrompt = basePrompt;

    // 🔍 DEBUG: Log the complete conversation being sent to LLM
    console.log('\n🔍 ===== COMPLETE LLM REQUEST DEBUG =====');
    console.log('🤖 Model:', model);
    console.log('🌐 Language:', language);
    console.log('🔧 Has Context:', hasContext);
    console.log('📝 Message Length:', message?.length || 0);
    console.log('📄 Context Length:', contextualInfo?.length || 0);
    console.log('💬 History Messages:', conversationMessages.length);
    
    console.log('\n📤 SYSTEM PROMPT BEING SENT TO LLM:');
    console.log('═'.repeat(80));
    console.log(systemPrompt);
    console.log('═'.repeat(80));
    
    console.log('\n👤 USER MESSAGE BEING SENT TO LLM:');
    console.log('─'.repeat(80));
    console.log(message);
    console.log('─'.repeat(80));
    
    if (hasContext) {
      console.log('✅ CONTEXT EMBEDDED IN USER MESSAGE - MEENA will see the knowledge base info directly');
    } else {
      console.log('❌ NO CONTEXT - MEENA will give general response');
    }

    // Get model configuration
    const modelConfig = AVAILABLE_MODELS[model];
    const provider = modelConfig?.provider || 'groq';
    
    console.log(`🤖 Using ${provider.toUpperCase()} with model: ${model}`);

    // Create chat completion based on provider
    let chatCompletion;
    
    if (provider === 'sarvam') {
      // Check if SarvamAI is available
      if (!sarvam) {
        throw new Error('SarvamAI API key not configured. Please add SARVAM_API_KEY to your environment variables.');
      }
      
      // SarvamAI API call with conversation history
      // Fix: Ensure proper alternating pattern for SarvamAI
      const sarvamMessages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];
      
      // Add conversation history with strict alternating validation
      if (conversationMessages.length > 0) {
        let lastRole = 'system';
        const validatedHistory = [];
        
        for (const msg of conversationMessages) {
          // Only add message if it creates proper alternation
          if (msg.role === 'user' && lastRole !== 'user') {
            validatedHistory.push(msg);
            lastRole = 'user';
          } else if (msg.role === 'assistant' && lastRole === 'user') {
            validatedHistory.push(msg);
            lastRole = 'assistant';
          } else {
            console.log(`⚠️ Skipping ${msg.role} message to maintain alternating pattern (last was ${lastRole})`);
          }
        }
        
        sarvamMessages.push(...validatedHistory);
        
        // Check if we can add current user message
        const lastHistoryRole = validatedHistory.length > 0 ? validatedHistory[validatedHistory.length - 1].role : 'system';
        
        if (lastHistoryRole !== 'user') {
          // Safe to add user message
          sarvamMessages.push({
            role: "user",
            content: message
          });
        } else {
          // Last message was user, we need to skip it or merge
          console.log('⚠️ Cannot add user message - last message was also from user. Merging with previous.');
          // Instead of adding new message, update the last user message
          if (validatedHistory.length > 0 && validatedHistory[validatedHistory.length - 1].role === 'user') {
            sarvamMessages[sarvamMessages.length - 1].content += `\n\nAdditional question: ${message}`;
          } else {
            sarvamMessages.push({
              role: "user",
              content: message
            });
          }
        }
      } else {
        // No history, just add current user message
        sarvamMessages.push({
          role: "user", 
          content: message
        });
      }
      
      // Final validation before sending
      const roles = sarvamMessages.map(m => m.role);
      const isValidPattern = validateMessagePattern(roles);
      
      if (!isValidPattern) {
        console.error('❌ Invalid message pattern detected:', roles.join(' -> '));
        // Fallback: send only system + current message
        const fallbackMessages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ];
        console.log('🔄 Using fallback pattern: system -> user');
        
        chatCompletion = await sarvam.chat.completions({
          messages: fallbackMessages,
          model: model,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
          wiki_grounding: hasContext ? false : true,
          top_p: 0.9
        });
      } else {
        console.log(`📤 Sending ${sarvamMessages.length} messages to SarvamAI (including ${conversationMessages.length} original history messages)`);
        console.log('✅ Valid message order:', roles.join(' -> '));
        
        chatCompletion = await sarvam.chat.completions({
          messages: sarvamMessages,
          model: model,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
          wiki_grounding: hasContext ? false : true,
          top_p: 0.9
        });
      }
    } else {
      // Groq API call with conversation history
      const groqMessages = [
        {
          role: "system",
          content: systemPrompt
        },
        ...conversationMessages, // Add conversation history
        {
          role: "user",
          content: message
        }
      ];
      
      console.log(`📤 Sending ${groqMessages.length} messages to Groq (including ${conversationMessages.length} history messages)`);
      
      chatCompletion = await groq.chat.completions.create({
        messages: groqMessages,
        model: model,
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null
      });
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    let fullResponseText = ''; // Collect full response for MongoDB logging
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (provider === 'sarvam') {
            // Handle SarvamAI non-streaming response - simulate streaming by sending chunks progressively
            const fullResponse = chatCompletion.choices?.[0]?.message?.content || '';
            fullResponseText = fullResponse; // Store for logging
            console.log('SarvamAI full response received:', fullResponse.length, 'characters');
            
            if (fullResponse) {
              // Split into words and stream them progressively for better UX
              const words = fullResponse.split(' ');
              
              for (let i = 0; i < words.length; i++) {
                const wordToSend = (i > 0 ? ' ' : '') + words[i];
                const data = `data: ${JSON.stringify({ content: wordToSend })}\n\n`;
                controller.enqueue(encoder.encode(data));
                
                // Small delay between words to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 30));
              }
            } else {
              // Fallback if no content
              const errorContent = 'Sorry, I could not generate a response. Please try again.';
              const data = `data: ${JSON.stringify({ content: errorContent })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          } else {
            // Handle Groq streaming response
            for await (const chunk of chatCompletion) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullResponseText += content; // Collect full response for logging
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
          }
          
          // Send completion signal
          const doneData = `data: ${JSON.stringify({ done: true })}\n\n`;
          controller.enqueue(encoder.encode(doneData));
          
          // Log conversation to MongoDB after streaming is complete
          if (fullResponseText.trim()) {
            try {
              await logConversationToMongoDB(message, fullResponseText, language, contextualInfo);
            } catch (logError) {
              console.error('⚠️ Failed to log conversation to MongoDB:', logError.message);
              // Don't fail the response - logging is optional
            }
          }
          
          controller.close();
          
        } catch (error) {
          console.error(`${provider.toUpperCase()} Streaming error:`, error);
          const errorData = `data: ${JSON.stringify({ error: `${provider.toUpperCase()} streaming failed: ${error.message}` })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error.message },
      { status: 500 }
    );
  }
}

// Available models configuration
const AVAILABLE_MODELS = {
  // SarvamAI Models (Primary - supports English + Indian Languages)
  'sarvam-m': { provider: 'sarvam', name: 'Sarvam-M', category: 'Primary' },
  
  // Groq Models (Alternative - Gemma only)
  'gemma2-9b-it': { provider: 'groq', name: 'Gemma 2 9B', category: 'Alternative' },
};

// Validate model selection
function validateModel(model) {
  return AVAILABLE_MODELS[model] ? model : 'sarvam-m';
}

// Check if API keys are configured
function isProviderAvailable(provider) {
  switch (provider) {
    case 'groq':
      return !!process.env.GROQ_API_KEY;
    case 'sarvam':
      return !!process.env.SARVAM_API_KEY;
    default:
      return false;
  }
}

// Validate message pattern for SarvamAI
function validateMessagePattern(roles) {
  // Must start with system
  if (roles.length === 0 || roles[0] !== 'system') {
    return false;
  }
  
  // After system, must be user
  if (roles.length > 1 && roles[1] !== 'user') {
    return false;
  }
  
  // Check alternating pattern from index 1 onwards
  for (let i = 1; i < roles.length - 1; i++) {
    const current = roles[i];
    const next = roles[i + 1];
    
    // User must be followed by assistant (except for the last message)
    if (current === 'user' && next === 'user') {
      return false;
    }
    
    // Assistant must be followed by user
    if (current === 'assistant' && next === 'assistant') {
      return false;
    }
  }
  
  return true;
}

// GET endpoint for testing and model info
export async function GET() {
  return NextResponse.json({ 
    message: 'MEENA Chat API is running',
    version: '3.1.0 - With Message Pattern Validation',
    providers: {
      sarvam: {
        available: isProviderAvailable('sarvam'),
        models: ['sarvam-m'],
        specialties: ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Marathi', 'Kannada', 'Multilingual Support']
      },
      groq: {
        available: isProviderAvailable('groq'),
        models: ['gemma2-9b-it'],
        note: 'Alternative model option'
      }
    },
    features: {
      conversationHistory: 'Last 6 messages sent for context',
      contextAwareFollowUp: 'Supports follow-up questions and references',
      multilingualContext: 'Maintains context across language switches',
      messageValidation: 'Validates alternating user/assistant pattern for SarvamAI'
    },
    models: Object.entries(AVAILABLE_MODELS).map(([key, value]) => ({
      id: key,
      provider: value.provider,
      name: value.name,
      category: value.category,
      available: isProviderAvailable(value.provider),
      recommended: value.category === 'Primary' ? 'Best for all languages including English & Indian languages' : 'Alternative general purpose model'
    })),
    timestamp: new Date().toISOString()
  });
}

// Function to log conversation to MongoDB for admin dashboard
async function logConversationToMongoDB(message, response, language = 'English', contextualInfo = null) {
  try {
    await dbConnect();
    
    // Generate a simple user ID (could be enhanced with proper user tracking)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation = await Chat.create({
      userId,
      message: message.trim(),
      response: response.trim(),
      metadata: {
        language: language || 'English',
        hasContext: !!contextualInfo,
        contextInfo: contextualInfo ? {
          hasKnowledgeBase: !!contextualInfo,
          timestamp: new Date().toISOString()
        } : null,
        provider: 'chat-api',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('✅ Conversation logged to MongoDB:', conversation._id);
    return conversation._id.toString();
    
  } catch (error) {
    console.error('❌ MongoDB conversation logging failed:', error.message);
    throw error;
  }
}