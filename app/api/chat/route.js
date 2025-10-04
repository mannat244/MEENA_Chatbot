import { Groq } from 'groq-sdk';
import { SarvamAIClient } from 'sarvamai';
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb.js';
import Chat from '../../../models/Chat.js';
import { findLocationInQuery, generateMapResponse, CAMPUS_LOCATIONS } from '../../../lib/mapUtils.js';
import { processURLsInMessage } from '../../../lib/urlUtils.js';

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

    // APPROACH 1: High-confidence regex detection (pre-LLM fetch)
    const highConfidenceQuery = detectHighConfidenceQuery(originalMessage || message);
    if (highConfidenceQuery) {
      return await handleHighConfidenceQuery(highConfidenceQuery, message, language, conversationHistory);
    }

    // APPROACH 2: URL Detection with progress indication
    console.log('🔗 Checking for URLs in message...');
    const urlProcessingResult = await processURLsInMessage(originalMessage || message);
    
    let urlContext = '';
    let showingURLProgress = false;
    
    if (urlProcessingResult.hasURLs) {
      console.log(`🌐 Found ${urlProcessingResult.processedURLs} URLs in message`);
      showingURLProgress = true;
      
      if (urlProcessingResult.urlContent) {
        urlContext = `\n\n==== CONTENT FROM URLs ====\n${urlProcessingResult.urlContent}\n==== END URL CONTENT ====\n\n`;
        console.log('✅ URL content fetched and added to context');
        console.log('📋 ===== EXTRACTED URL CONTENT DETAILS =====');
        if (urlProcessingResult.urlData) {
          urlProcessingResult.urlData.forEach((urlInfo, index) => {
            if (urlInfo.success) {
              console.log(`\n🌐 URL ${index + 1}: ${urlInfo.url}`);
              console.log(`📄 Title: ${urlInfo.title || 'No title'}`);
              console.log(`📝 Description: ${urlInfo.description || 'No description'}`);
              console.log(`📊 Content Length: ${urlInfo.content?.length || 0} characters`);
              console.log(`🎯 Page Type Info: ${urlInfo.pageTypeInfo || 'None'}`);
              console.log(`� Extraction Method: ${urlInfo.extractionMethod || 'Standard'}`);
              console.log(`📖 Readability Check: ${urlInfo.isReadable ? 'PASSED' : 'FAILED'}`);
              console.log(`�🔍 Content Preview (first 300 chars): ${(urlInfo.content || '').substring(0, 300)}...`);
            } else {
              console.log(`\n❌ URL ${index + 1}: ${urlInfo.url} - Failed: ${urlInfo.error}`);
            }
          });
        }
        console.log('\n📋 ===== END URL CONTENT DETAILS =====');
      } else {
        console.log('❌ Failed to fetch URL content');
      }
    }

    // Prepare final message with URL context if available
    const finalMessage = urlContext ? message + urlContext : message;

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

📢 DYNAMIC CONTENT FETCHING:
When users ask about current information that needs to be fetched from MANIT website, use these special codes:

NOTICE_FETCH_7439 - Use when users ask about:
- Latest notices, announcements, updates
- "Any updates regarding...", "Recent announcements", "Current notices"
- Exam schedules, academic calendar updates
- Administrative announcements
- Placement updates, recruitment notices

SCHOLARSHIP_FETCH_7439 - Use when users ask about:
- Scholarship information, financial aid
- "Scholarship details", "Available scholarships"
- Fee concessions, financial assistance
- Merit scholarships, need-based aid

URL_FETCH_7439{"url": "complete_url_here"} - Use when users provide a specific URL and ask you to read/analyze it:
- "Check this link: https://example.com"
- "What does this page say: URL"
- "Read this webpage and tell me..."

These codes will automatically fetch the latest information and provide it to you for accurate responses.

${hasContext && !urlProcessingResult.hasURLs ? `CONTEXT-BASED RESPONSE MODE:
- The user's message includes relevant information from the MANIT knowledge base
- Prioritize and use the provided knowledge base information in your response
- Cite specific details from the knowledge base when answering
- If the knowledge base information answers their question, use it confidently
- If additional verification is needed, suggest they contact the appropriate office and include HUMAN_FALLBACK_TRIGGER_7439` : ''}${urlProcessingResult.hasURLs && urlProcessingResult.urlContent ? `🌐 EXTERNAL WEBSITE CONTENT MODE:
- The user provided URL(s) and I have fetched and analyzed the content from: ${urlProcessingResult.urlData?.map(u => u.url).join(', ')}
- The fetched website content is included in the user's message below
- Focus on answering their question using the EXTERNAL website content provided
- Clearly distinguish between MANIT information (if any) and external website content
- If the external content is unrelated to MANIT, clearly state this
- For MANIT-specific questions, prioritize knowledge base information over external content${hasContext ? '\n- Both external website content AND MANIT knowledge base information are available' : ''}` : ''}${!hasContext && !urlProcessingResult.hasURLs ? `NO-CONTEXT RESPONSE MODE:
- No specific MANIT information is available for this query
- Provide general guidance and suggest they contact MANIT offices for accurate details
- For important queries, include HUMAN_FALLBACK_TRIGGER_7439 to connect them to human support
- Mention that for current information, they should check the official MANIT website or contact:
  * Academic Office: For exam dates, academic calendar
  * Accounts Office: For fee information
  * Hostel Office: For accommodation queries
  * Training & Placement: For placement related queries` : ''}

${languageInstruction}`;

    const systemPrompt = basePrompt;

    // 🔍 DEBUG: Log the complete conversation being sent to LLM
    console.log('\n🔍 ===== COMPLETE LLM REQUEST DEBUG =====');
    console.log('🤖 Model:', model);
    console.log('🌐 Language:', language);
    console.log('🔧 Has Context:', hasContext);
    console.log('📝 Message Length:', finalMessage?.length || 0);
    console.log('📄 Context Length:', contextualInfo?.length || 0);
    console.log('🔗 URL Context Length:', urlContext?.length || 0);
    if (urlProcessingResult.hasURLs) {
      console.log('🌐 URLs Processed:', urlProcessingResult.urlData?.map(u => u.url).join(', '));
      console.log('✅ URL content included in LLM prompt');
      console.log('\n📋 ===== URL CONTENT BEING SENT TO LLM =====');
      console.log(urlContext.substring(0, 1000) + (urlContext.length > 1000 ? '...[TRUNCATED]' : ''));
      console.log('📋 ===== END URL CONTENT FOR LLM =====');
    }
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
            content: finalMessage
          });
        } else {
          // Last message was user, we need to skip it or merge
          console.log('⚠️ Cannot add user message - last message was also from user. Merging with previous.');
          // Instead of adding new message, update the last user message
          if (validatedHistory.length > 0 && validatedHistory[validatedHistory.length - 1].role === 'user') {
            sarvamMessages[sarvamMessages.length - 1].content += `\n\nAdditional question: ${finalMessage}`;
          } else {
            sarvamMessages.push({
              role: "user",
              content: finalMessage
            });
          }
        }
      } else {
        // No history, just add current user message
        sarvamMessages.push({
          role: "user", 
          content: finalMessage
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
          { role: "user", content: finalMessage }
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
          content: finalMessage
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
          // APPROACH 2: Show URL reading progress if URLs were processed
          if (showingURLProgress && urlProcessingResult.urlContent) {
            const urlProgressMessage = `🔗 **Reading content from your URL${urlProcessingResult.processedURLs > 1 ? 's' : ''}...**\n\n`;
            const progressData = `data: ${JSON.stringify({ content: urlProgressMessage })}\n\n`;
            controller.enqueue(encoder.encode(progressData));
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
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
          
          // Process special triggers after streaming is complete
          if (fullResponseText.trim()) {
            try {
              // APPROACH 3: Check for and process special triggers with fresh LLM response
              const processedResponse = await processSpecialTriggers(
                fullResponseText, 
                message, 
                finalMessage, 
                systemPrompt, 
                model, 
                conversationMessages
              );
              
              // If fresh response was generated, send it as replacement
              if (processedResponse !== fullResponseText) {
                console.log('📤 Sending fresh LLM response from triggers...');
                
                // Send the fresh response
                const words = processedResponse.split(' ');
                for (let i = 0; i < words.length; i++) {
                  const wordToSend = (i > 0 ? ' ' : '') + words[i];
                  const data = `data: ${JSON.stringify({ content: wordToSend })}\n\n`;
                  controller.enqueue(encoder.encode(data));
                  await new Promise(resolve => setTimeout(resolve, 30));
                }
                
                // Update fullResponseText for logging
                fullResponseText = processedResponse;
              }
              
              // Enhanced contextual info including URL data
              const enhancedContextualInfo = contextualInfo || '';
              const urlInfo = urlProcessingResult.hasURLs ? 
                `\n\n=== URL PROCESSING INFO ===\nProcessed URLs: ${urlProcessingResult.processedURLs}\nURL Content Available: ${!!urlProcessingResult.urlContent}\nURLs: ${urlProcessingResult.urlData?.map(u => u.url).join(', ') || 'None'}\n=== END URL INFO ===` : '';
              
              await logConversationToMongoDB(message, fullResponseText, language, enhancedContextualInfo + urlInfo);
            } catch (logError) {
              console.error('⚠️ Failed to process triggers or log conversation:', logError.message);
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

// APPROACH 1: High-confidence query detection (very specific patterns)
function detectHighConfidenceQuery(query) {
  if (!query || typeof query !== 'string') return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Very specific patterns we're 100% confident about
  const patterns = {
    notices: [
      /^(latest\s+)?notices?$/,
      /^(current\s+)?announcements?$/,
      /^what\s+are\s+the\s+(latest|current|recent)\s+notices/,
      /^(show|get|fetch)\s+(latest\s+)?notices/
    ],
    scholarship: [
      /^scholarships?$/,
      /^(available\s+)?scholarships?\s+(details?|info|information)$/,
      /^what\s+scholarships?\s+are\s+available/,
      /^(show|get|list)\s+scholarships?$/
    ]
  };
  
  for (const [type, regexArray] of Object.entries(patterns)) {
    for (const regex of regexArray) {
      if (regex.test(normalizedQuery)) {
        console.log(`🎯 High-confidence ${type} query detected:`, normalizedQuery);
        return { type, query: normalizedQuery };
      }
    }
  }
  
  return null;
}

// APPROACH 1: Handle high-confidence queries with pre-fetch
async function handleHighConfidenceQuery(queryInfo, originalMessage, language, conversationHistory) {
  console.log(`🚀 Processing high-confidence ${queryInfo.type} query`);
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Show immediate loading message
        const loadingMessage = `🔍 **Fetching latest ${queryInfo.type} information...**\n\n*Loading from MANIT website...*`;
        const data = `data: ${JSON.stringify({ content: loadingMessage })}\n\n`;
        controller.enqueue(encoder.encode(data));
        
        // Wait a moment for the shimmer effect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let fetchedContent = '';
        
        if (queryInfo.type === 'notices') {
          // Fetch notices
          const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
          const noticesResponse = await fetch(`${baseUrl}/api/notices`);
          const noticesData = await noticesResponse.json();
          
          if (noticesData.success && noticesData.notices) {
            const latestNotices = noticesData.notices.slice(0, 8);
            fetchedContent = 'Here are the latest MANIT notices and announcements:\n\n';
            latestNotices.forEach((notice, index) => {
              fetchedContent += `${index + 1}. **${notice.title}**\n`;
              if (notice.date) fetchedContent += `   📅 ${notice.date}\n`;
              if (notice.link) fetchedContent += `   🔗 ${notice.link}\n`;
              fetchedContent += '\n';
            });
            fetchedContent += '\n*Source: MANIT Official Website*';
          }
        } else if (queryInfo.type === 'scholarship') {
          // Fetch scholarship info
          const { fetchURLContent } = await import('../../../lib/urlUtils.js');
          const scholarshipUrl = 'https://www.manit.ac.in/content/scholarship';
          const scholarshipData = await fetchURLContent(scholarshipUrl);
          
          if (scholarshipData && scholarshipData.success) {
            fetchedContent = `Here's the latest scholarship information from MANIT:\n\n**${scholarshipData.title}**\n\n`;
            fetchedContent += scholarshipData.content.substring(0, 2000) + '...\n\n';
            fetchedContent += `📖 *For complete details, visit: ${scholarshipUrl}*`;
          }
        }
        
        if (fetchedContent) {
          // Stream the fetched content
          const words = fetchedContent.split(' ');
          for (let i = 0; i < words.length; i++) {
            const wordToSend = (i > 0 ? ' ' : '') + words[i];
            const data = `data: ${JSON.stringify({ content: wordToSend })}\n\n`;
            controller.enqueue(encoder.encode(data));
            await new Promise(resolve => setTimeout(resolve, 40));
          }
        } else {
          const errorMessage = `Sorry, I couldn't fetch the latest ${queryInfo.type} information right now. Please check the MANIT website directly or try again later.`;
          const data = `data: ${JSON.stringify({ content: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        
        // Send completion signal
        const doneData = `data: ${JSON.stringify({ done: true })}\n\n`;
        controller.enqueue(encoder.encode(doneData));
        
        // Log to MongoDB
        try {
          await dbConnect();
          const chatDoc = new Chat({
            message: originalMessage,
            response: fetchedContent || `Failed to fetch ${queryInfo.type}`,
            timestamp: new Date(),
            language: language || 'English',
            hasContext: true,
            contextInfo: `High-confidence ${queryInfo.type} query`,
            model: 'high_confidence_fetch'
          });
          await chatDoc.save();
          console.log('📊 High-confidence query logged to MongoDB');
        } catch (dbError) {
          console.warn('Database logging failed:', dbError.message);
        }
        
        controller.close();
        
      } catch (error) {
        console.error(`High-confidence ${queryInfo.type} query error:`, error);
        const errorData = `data: ${JSON.stringify({ error: `Failed to fetch ${queryInfo.type}: ${error.message}` })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
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

// APPROACH 3: Process special triggers and get fresh LLM response
async function processSpecialTriggers(responseText, originalMessage, finalMessage, systemPrompt, model, conversationMessages) {
  console.log('🔍 Checking for special triggers in response...');
  
  let hasTriggered = false;
  let fetchedData = '';
  
  // Check for NOTICE_FETCH_7439
  if (responseText.includes('NOTICE_FETCH_7439')) {
    console.log('📢 NOTICE_FETCH trigger detected - fetching latest notices...');
    hasTriggered = true;
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const noticesResponse = await fetch(`${baseUrl}/api/notices`);
      const noticesData = await noticesResponse.json();
      
      if (noticesData.success && noticesData.notices) {
        const latestNotices = noticesData.notices.slice(0, 5);
        fetchedData += '\n\n=== LATEST MANIT NOTICES ===\n';
        latestNotices.forEach((notice, index) => {
          fetchedData += `${index + 1}. ${notice.title}\n`;
          if (notice.date) fetchedData += `   Date: ${notice.date}\n`;
          if (notice.link) fetchedData += `   Link: ${notice.link}\n`;
          fetchedData += '\n';
        });
        fetchedData += '=== END NOTICES ===\n';
      }
    } catch (error) {
      console.error('❌ Error fetching notices:', error);
    }
  }
  
  // Check for SCHOLARSHIP_FETCH_7439
  if (responseText.includes('SCHOLARSHIP_FETCH_7439')) {
    console.log('🎓 SCHOLARSHIP_FETCH trigger detected - fetching scholarship info...');
    hasTriggered = true;
    try {
      const scholarshipUrl = 'https://www.manit.ac.in/content/scholarship';
      const { fetchURLContent } = await import('../../../lib/urlUtils.js');
      const scholarshipData = await fetchURLContent(scholarshipUrl);
      
      if (scholarshipData && scholarshipData.success) {
        fetchedData += '\n\n=== SCHOLARSHIP INFORMATION ===\n';
        fetchedData += `Title: ${scholarshipData.title}\n`;
        fetchedData += `Content: ${scholarshipData.content.substring(0, 1500)}\n`;
        fetchedData += `Source: ${scholarshipUrl}\n`;
        fetchedData += '=== END SCHOLARSHIP INFO ===\n';
      }
    } catch (error) {
      console.error('❌ Error fetching scholarship info:', error);
    }
  }
  
  // Check for URL_FETCH_7439{"url": "..."}
  const urlFetchRegex = /URL_FETCH_7439\s*\{[^}]*"url"\s*:\s*"([^"]+)"[^}]*\}/gi;
  let urlMatch;
  while ((urlMatch = urlFetchRegex.exec(responseText)) !== null) {
    const url = urlMatch[1];
    console.log(`🌐 URL_FETCH trigger detected for: ${url}`);
    hasTriggered = true;
    
    try {
      const { fetchURLContent } = await import('../../../lib/urlUtils.js');
      const urlData = await fetchURLContent(url);
      
      if (urlData && urlData.success) {
        fetchedData += `\n\n=== CONTENT FROM ${url} ===\n`;
        fetchedData += `Title: ${urlData.title}\n`;
        fetchedData += `Content: ${urlData.content.substring(0, 1500)}\n`;
        fetchedData += `=== END URL CONTENT ===\n`;
      }
    } catch (error) {
      console.error(`❌ Error fetching URL ${url}:`, error);
    }
  }
  
  // If triggers were found, get fresh LLM response with additional data
  if (hasTriggered && fetchedData) {
    console.log('🔄 Triggers detected - getting fresh LLM response with additional data...');
    
    const enhancedPrompt = finalMessage + fetchedData + 
      '\n\nBased on the above information I just fetched, please provide a comprehensive and helpful response to the user.';
    
    try {
      // Get fresh response from LLM
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationMessages,
        { role: "user", content: enhancedPrompt }
      ];
      
      if (model.includes('sarvam')) {
        const sarvam = (await import('sarvamai')).SarvamAIClient;
        const sarvamClient = new sarvam({ apiSubscriptionKey: process.env.SARVAM_API_KEY });
        const freshResponse = await sarvamClient.chat.completions({
          messages: messages,
          model: model,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false
        });
        
        return freshResponse.choices?.[0]?.message?.content || responseText;
      } else {
        const groq = (await import('groq-sdk')).Groq;
        const groqClient = new groq({ apiKey: process.env.GROQ_API_KEY });
        const freshResponse = await groqClient.chat.completions.create({
          messages: messages,
          model: model,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false
        });
        
        return freshResponse.choices?.[0]?.message?.content || responseText;
      }
    } catch (error) {
      console.error('❌ Error getting fresh LLM response:', error);
      // Fallback: remove triggers and add basic content
      let processedResponse = responseText
        .replace(/NOTICE_FETCH_7439/g, '')
        .replace(/SCHOLARSHIP_FETCH_7439/g, '')
        .replace(urlFetchRegex, '');
      
      return processedResponse + '\n\n' + fetchedData;
    }
  }
  
  return responseText;
}

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