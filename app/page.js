
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import InteractiveMap from './components/InteractiveMap';
import ContactButton from './components/ContactButton';
import { renderTextWithMaps, parseMapCoordinates } from '../lib/mapUtils';
import { renderTextWithContacts } from '../lib/contactUtils';
import { 
  Bot, 
  User, 
  Globe, 
  Mic, 
  Send, 
  Volume2, 
  Paperclip, 
  Menu, 
  X,
  MessageSquare,
  Clock,
  Settings,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Phone
} from 'lucide-react';

// Helper function to check if message contains maps or contacts
const hasInteractiveContent = (messageText) => {
  const mapPattern = /MAP_COORDINATES\{[^}]+\}/g;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /\+?[\d\s\-\(\)]{8,}/;
  
  return mapPattern.test(messageText) || emailPattern.test(messageText) || phonePattern.test(messageText);
};

// Component to render messages with embedded maps and contact buttons
const MessageWithElements = ({ messageText, className = "" }) => {
  console.log('🔍 MessageWithElements received text:', messageText.substring(0, 200) + '...');
  
  // First process maps
  const { text: textAfterMaps, maps } = renderTextWithMaps(messageText, InteractiveMap);
  console.log('🗺️ Maps found:', maps?.length || 0);
  
  // Then process contacts on the remaining text
  const { text: finalText, contacts } = renderTextWithContacts(textAfterMaps, ContactButton);
  console.log('📞 Contacts found:', contacts?.length || 0);
  console.log('📝 Final processed text:', finalText.substring(0, 200) + '...');

  return (
    <div className={className}>
      <ReactMarkdown 
        components={{
          p: ({ children }) => <div className="mb-2">{children}</div>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 ml-4 mb-2">{children}</ol>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 ml-4 mb-2">{children}</ul>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, inline }) => 
            inline ? 
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code> :
              <div className="my-2">
                <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono">{children}</code>
                </pre>
              </div>,
          pre: ({ children }) => 
            <div className="my-2">
              <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">{children}</pre>
            </div>,
          blockquote: ({ children }) => 
            <blockquote className="border-l-4 border-blue-200 pl-4 py-2 my-2 bg-blue-50 italic">
              {children}
            </blockquote>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-2">{children}</h3>,
        }}
      >
        {finalText}
      </ReactMarkdown>
      {maps && maps.length > 0 && (
        <div className="mt-3 space-y-2">
          {maps.map((mapComponent, index) => (
            <div key={index}>
              {mapComponent}
            </div>
          ))}
        </div>
      )}
      {contacts && contacts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {contacts.map((contactComponent, index) => (
            <div key={index}>
              {contactComponent}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  // Add custom CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .animate-fade-in {
        animation: fade-in 0.8s ease-out;
      }
      
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      .animate-gradient {
        background-size: 200% 200%;
        animation: gradient-shift 4s ease infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => document.head.removeChild(style);
  }, []);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loadingChatId, setLoadingChatId] = useState(null);
  const [forceSaveFlag, setForceSaveFlag] = useState(0);
  const [isChromaEnabled, setIsChromaEnabled] = useState(false);
  const [contextResults, setContextResults] = useState([]);
  const [selectedModel, setSelectedModel] = useState('sarvam-m');
  const [availableModels, setAvailableModels] = useState([]);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [showFallbackDialog, setShowFallbackDialog] = useState(false);
  const [fallbackData, setFallbackData] = useState({});
  const [userContact, setUserContact] = useState({ name: '', phone: '' });
  const [submittingFallback, setSubmittingFallback] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);



  const languages = [
    'English', 'हिन्दी (Hindi)', 'मराठी (Marathi)', 
    'தமிழ் (Tamil)', 'বাংলা (Bengali)', 'ગુજરાતી (Gujarati)', 'ಕನ್ನಡ (Kannada)'
  ];

  const welcomeMessages = [
    { lang: 'English', text: 'Hello! I\'m MEENA, your educational assistant.' },
    { lang: 'हिन्दी', text: 'नमस्ते! मैं MEENA हूं, आपकी शैक्षिक सहायक।' },
    { lang: 'मराठी', text: 'नमस्कार! मी MEENA आहे, तुमची शैक्षिक सहाय्यक।' },
    { lang: 'தமிழ்', text: 'வணக்கம்! நான் MEENA, உங்கள் கல்வி உதவியாளர்.' },
    { lang: 'বাংলা', text: 'নমস্কার! আমি MEENA, আপনার শিক্ষা সহায়ক।' },
    { lang: 'ગુજરાતી', text: 'નમસ્તે! હું MEENA છું, તમારી શૈક્ષિક સહાયક।' },
    { lang: 'ಕನ್ನಡ', text: 'ನಮಸ್ಕಾರ! ನಾನು MEENA, ನಿಮ್ಮ ಶೈಕ್ಷಣಿಕ ಸಹಾಯಕ।' }
  ];

  const faqSuggestions = [
    'Mid-semester exam dates', 'Fee payment deadline', 'Hostel room booking', 
    'Library timings', 'Scholarship deadline', 'Placement cell contact',
    'Mess fee details', 'Medical center hours', 'ERP login issues'
  ];

  const sidebarLinks = [
    { icon: HelpCircle, text: 'FAQ', category: 'help' },
    { icon: Settings, text: 'Admin Dashboard', category: 'admin' },
    { icon: BookOpen, text: 'Notices', category: 'notices' }
  ];

  // Define fetchAvailableModels early to prevent initialization issues
  const fetchAvailableModels = useCallback(async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();
      console.log('🔍 API Response:', data);
      
      if (data.models) {
        const availableModelsList = data.models.filter(model => model.available);
        console.log('📋 Available models from API:', availableModelsList);
        setAvailableModels(availableModelsList);
        
        // Set SarvamAI as default if available
        const sarvamModel = availableModelsList.find(model => model.id === 'sarvam-m');
        console.log('🚀 SarvamAI model found:', sarvamModel);
        
        if (sarvamModel && !selectedModel) {
          setSelectedModel(sarvamModel.id);
        }
      }
    } catch (error) {
      console.warn('Could not fetch available models:', error);
      // Set default models if API fails
      setAvailableModels([
        { id: 'sarvam-m', name: 'Sarvam-M', provider: 'sarvam', category: 'Primary', available: true },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'groq', category: 'Alternative', available: true }
      ]);
    }
  }, [selectedModel]);

  // Helper function to check if response indicates lack of knowledge (REDUCED SENSITIVITY)
  const checkForHumanFallback = (response, query) => {
    // Only very explicit indicators for automatic triggering
    const criticalKnowledgeIndicators = [
      "i don't know",
      "i cannot provide",
      "no information available",
      "not in my knowledge",
      "sorry, i don't know"
    ];

    // User explicitly asking for human support
    const humanRequestPatterns = [
      "connect me to human",
      "talk to human", 
      "speak to human",
      "human support",
      "human assistance",
      "contact support",
      "support team",
      "human staff",
      "live support",
      "customer support",
      "human agent",
      "real person",
      "speak to someone",
      "talk to someone",
      "connect to staff",
      "human help",
      "contact staff",
      "reach human",
      "get human help",
      "human representative",
      "live agent",
      "speak with staff",
      "connect with human",
      "human operator",
      "contact human",
      "need human",
      "want human",
      "human expert",
      "live chat",
      "customer service",
      "help desk",
      "support desk"
    ];
    
    const responseText = response.toLowerCase();
    const queryText = query.toLowerCase();
    
    // Check if user explicitly requested human support
    const userRequestsHuman = humanRequestPatterns.some(pattern => 
      queryText.includes(pattern) || 
      queryText.includes(pattern.replace(/\s+/g, '')) // Check without spaces too
    );
    
    // If user explicitly asks for human, trigger immediately
    if (userRequestsHuman) {
      console.log('🤖➡️👨 User explicitly requested human support:', query);
      return true;
    }
    
    // 🎯 SPECIAL LLM TRIGGER CODE - Works in any language/punctuation
    // LLM can include this code anywhere in response to trigger human fallback
    const specialTriggerCode = "HUMAN_FALLBACK_TRIGGER_7439";
    if (response.includes(specialTriggerCode)) {
      console.log('🚨 LLM triggered human fallback with special code');
      return true;
    }
    
    // Only check for very clear knowledge gaps (reduced from before)
    const hasKnowledgeGap = criticalKnowledgeIndicators.some(indicator => responseText.includes(indicator));
    
    // Only trigger on very explicit "I don't know" responses
    return hasKnowledgeGap;
  };

  // Function to show human fallback dialog
  const showHumanFallbackDialog = (query, aiResponse) => {
    setFallbackData({ query, aiResponse });
    setShowFallbackDialog(true);
  };

  // Function to submit human fallback request
  const submitHumanFallback = async () => {
    if (!userContact.phone.trim()) {
      alert('Please provide your phone number so we can contact you.');
      return;
    }

    try {
      setSubmittingFallback(true);
      
      const response = await fetch('/api/human-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: fallbackData.query,
          userContact: {
            name: userContact.name || 'Anonymous',
            phone: userContact.phone,
            chatId: null // Can be set for Telegram users
          },
          originalResponse: fallbackData.aiResponse,
          context: {
            previousMessages: messages.slice(-5).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            sessionId: currentChatId,
            platform: 'web'
          },
          category: 'general',
          priority: 'medium',
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            knowledgeBaseHits: contextResults.length
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add confirmation message to chat
        const confirmationMessage = {
          id: `confirmation-${Date.now()}`,
          text: `✅ Your query has been forwarded to our human experts. We will contact you at ${userContact.phone} within 24 hours with a detailed response.`,
          sender: 'meena',
          timestamp: new Date(),
          isSystemMessage: true
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        
        // Close dialog and reset form
        setShowFallbackDialog(false);
        setUserContact({ name: '', phone: '' });
        setFallbackData({});
        
        // Show success message
        alert('Thank you! Your query has been forwarded to our human experts. We will contact you within 24 hours.');
      } else {
        alert('Failed to submit your request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting human fallback:', error);
      alert('Failed to submit your request. Please try again.');
    } finally {
      setSubmittingFallback(false);
    }
  };

  
  // Animated greeting effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreetingIndex((prev) => (prev + 1) % welcomeMessages.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [welcomeMessages.length]);

  useEffect(() => {
    // Check if running in embedded mode
    const urlParams = new URLSearchParams(window.location.search);
    setIsEmbedded(urlParams.get('embedded') === 'true');
    
    initializeChromaDB();
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      // Stop any playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      // Stop browser TTS
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentAudio]);



  // Note: Removed automatic language-based model switching
  // Users can manually select between SarvamAI (primary) and Groq Gemma 2 (alternative)

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage === 'English' ? 'en-US' : 
                       selectedLanguage.includes('हिन्दी') ? 'hi-IN' :
                       selectedLanguage.includes('मराठी') ? 'mr-IN' :
                       selectedLanguage.includes('தமிழ்') ? 'ta-IN' :
                       selectedLanguage.includes('বাংলা') ? 'bn-IN' :
                       selectedLanguage.includes('ગુજરાતી') ? 'gu-IN' :
                       selectedLanguage.includes('ಕನ್ನಡ') ? 'kn-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInputValue(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
    }
  }, [selectedLanguage]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('meena-chat-history');
      console.log('Raw localStorage data:', savedHistory);
      
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          console.log('Parsed chat history:', parsedHistory);
          console.log('Number of chats loaded:', parsedHistory.length);
          
          // Validate each chat has messages
          parsedHistory.forEach((chat, index) => {
            console.log(`Chat ${index}:`, {
              id: chat.id,
              title: chat.title,
              messageCount: chat.messages?.length || 0,
              hasMessages: Array.isArray(chat.messages) && chat.messages.length > 0
            });
          });
          
          setChatHistory(parsedHistory);
        } catch (error) {
          console.error('Error loading chat history:', error);
          // Clear corrupted data
          localStorage.removeItem('meena-chat-history');
        }
      }
    }
  }, []);

  // Initialize ChromaDB on component mount
  useEffect(() => {
    initializeChromaDB();
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      // Don't save if there are streaming messages
      const hasStreamingMessages = messages.some(msg => msg.isStreaming);
      
      // Don't save if the last message is a MEENA message that's empty or very short (likely incomplete)
      const lastMessage = messages[messages.length - 1];
      const isIncompleteResponse = lastMessage?.sender === 'meena' && 
                                  (!lastMessage.text || lastMessage.text.trim().length < 10);
      
      if (hasStreamingMessages) {
        console.log('⏳ Skipping save - messages still streaming');
        return;
      }
      
      if (isIncompleteResponse) {
        console.log('⏳ Skipping save - incomplete response:', lastMessage?.text?.length || 0, 'chars');
        return;
      }
      
      const chatId = currentChatId || `chat_${Date.now()}`;
      if (!currentChatId) {
        setCurrentChatId(chatId);
      }

      const chatSession = {
        id: chatId,
        title: (messages.find(m => m.sender === 'user')?.text?.substring(0, 50) || 'New Chat') + 
               (messages.find(m => m.sender === 'user')?.text?.length > 50 ? '...' : ''),
        messages: messages.map(msg => ({ 
          ...msg, 
          isStreaming: false 
        })),
        timestamp: new Date().toISOString(),
        language: selectedLanguage,
        lastMessage: messages[messages.length - 1]?.text?.substring(0, 100) || ''
      };
      
      console.log('✅ Saving chat session:', {
        id: chatSession.id,
        title: chatSession.title,
        messageCount: chatSession.messages.length,
        lastMessageText: chatSession.messages[chatSession.messages.length - 1]?.text?.substring(0, 50)
      });
      
      // Update chat history immediately without checking existing
      setChatHistory(prevHistory => {
        const existingChatIndex = prevHistory.findIndex(chat => chat.id === chatId);
        let updatedHistory;
        
        if (existingChatIndex !== -1) {
          // Update existing chat
          updatedHistory = [...prevHistory];
          updatedHistory[existingChatIndex] = chatSession;
        } else {
          // Add new chat
          updatedHistory = [chatSession, ...prevHistory.slice(0, 19)]; // Keep last 20 sessions
        }
        
        // Save to localStorage asynchronously to avoid blocking UI
        setTimeout(() => {
          localStorage.setItem('meena-chat-history', JSON.stringify(updatedHistory));
        }, 0);
        
        return updatedHistory;
      });
    }
  }, [messages, currentChatId, selectedLanguage, forceSaveFlag]); // Added forceSaveFlag dependency

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ChromaDB Integration Functions
  const initializeChromaDB = async () => {
    console.log('\n🚀 ===== INITIALIZING CHROMADB =====');
    try {
      console.log('📡 Sending GET request to /api/chromadb...');
      const response = await fetch('/api/chromadb', {
        method: 'GET'
      });
      
      console.log('📊 ChromaDB init response status:', response.status);
      const result = await response.json();
      console.log('📋 ChromaDB init result:', result);
      
      if (result.success) {
        setIsChromaEnabled(true);
        console.log('✅ ChromaDB ENABLED - Context search will work');
        console.log('📊 Stats:', result.stats);
      } else {
        console.warn('❌ ChromaDB initialization FAILED:', result.error);
        console.warn('⚠️ MEENA will respond without context');
      }
    } catch (error) {
      console.error('❌ ChromaDB connection ERROR:', error.message);
      console.warn('⚠️ MEENA will respond without context');
    }
  };

  const storeChatMessage = async (messageData) => {
    if (!isChromaEnabled) return;
    
    try {
      // Don't store empty or system messages
      if (!messageData.text || messageData.text.trim() === '') return;
      
      const response = await fetch('/api/chromadb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add_chat_message',
          data: {
            id: messageData.id,
            text: messageData.text,
            sender: messageData.sender,
            chatId: currentChatId,
            userId: 'current_user', // You can make this dynamic
            language: selectedLanguage,
            timestamp: messageData.timestamp
          }
        })
      });
      
      if (response.ok) {
        console.log('📝 Message stored in ChromaDB:', messageData.id);
      }
    } catch (error) {
      console.warn('Warning: Failed to store message in ChromaDB:', error);
    }
  };

  const searchKnowledgeBase = async (query) => {
    console.log('🔍 FRONTEND: searchKnowledgeBase called');
    console.log(`  Query: "${query}"`);
    console.log(`  ChromaEnabled: ${isChromaEnabled}`);
    
    if (!isChromaEnabled || !query) {
      console.log('❌ Search skipped: ChromaDB not enabled or empty query');
      return [];
    }
    
    try {
      console.log('📡 Sending request to /api/chromadb...');
      const response = await fetch('/api/chromadb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'search_knowledge',
          data: { query, limit: 3 }
        })
      });
      
      console.log(`📡 Response status: ${response.status}`);
      const result = await response.json();
      console.log('📡 Full Response data:', JSON.stringify(result, null, 2));
      
      if (result.success && result.results) {
        console.log(`✅ Found ${result.results.length} relevant knowledge entries`);
        console.log('📋 Detailed results:');
        result.results.forEach((item, i) => {
          console.log(`  ${i + 1}. Title: ${item.title || 'No title'}`);
          console.log(`      Content: ${(item.text || item.content || 'No content').substring(0, 100)}...`);
          console.log(`      Category: ${item.category || 'No category'}`);
          console.log(`      Similarity: ${item.similarity?.toFixed(3) || 'No similarity'}`);
        });
        return result.results;
      } else {
        console.log('❌ Search failed or no results:', result.error);
        return [];
      }
      
    } catch (error) {
      console.error('❌ Knowledge search failed:', error);
      return [];
    }
  };

  const getChatContext = async (chatId) => {
    if (!isChromaEnabled || !chatId) return [];
    
    try {
      const response = await fetch('/api/chromadb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_chat_context',
          data: { chatId, contextLimit: 5 }
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.context) {
        return result.context;
      }
      
      return [];
    } catch (error) {
      console.warn('Warning: Chat context retrieval failed:', error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const userMessage = {
        id: Date.now(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentInput = inputValue;
      setInputValue('');
      setIsLoading(true);
      
      try {
        // Search for relevant context using ChromaDB
        let contextualInfo = '';
        console.log('\n🔍 ===== FRONTEND CONTEXT SEARCH DEBUG =====');
        console.log('🔧 ChromaDB Enabled:', isChromaEnabled);
        console.log('📝 User Input:', currentInput);
        console.log('🆔 Current Chat ID:', currentChatId);
        
        if (isChromaEnabled) {
          console.log('🚀 Starting parallel context search...');
          
          const [knowledgeResults, chatContext] = await Promise.all([
            searchKnowledgeBase(currentInput),
            getChatContext(currentChatId)
          ]);
          
          console.log('📊 DETAILED SEARCH RESULTS:');
          console.log('  📚 Knowledge Results Count:', knowledgeResults.length);
          console.log('  💬 Chat Context Count:', chatContext.length);
          
          if (knowledgeResults.length > 0) {
            console.log('  📋 Knowledge Results Details:');
            knowledgeResults.forEach((result, index) => {
              console.log(`    ${index + 1}. Title: ${result.title || result.metadata?.title || 'No title'}`);
              console.log(`       Category: ${result.category || result.metadata?.category || 'No category'}`);
              console.log(`       Content: ${(result.text || result.content || '').substring(0, 100)}...`);
            });
          } else {
            console.log('  ❌ No knowledge base matches found');
          }
          
          if (knowledgeResults.length > 0) {
            contextualInfo = '\n\nRELEVANT CONTEXT:\n' + 
              knowledgeResults.map(result => `- ${result.text || result.content}`).join('\n');
            setContextResults(knowledgeResults);
            
            console.log('✅ CONTEXT GENERATION SUCCESS:');
            console.log('📖 Knowledge entries being added to prompt:');
            knowledgeResults.forEach((result, i) => {
              console.log(`  ${i + 1}. "${result.title}" (${(result.content || result.text)?.length} chars)`);
            });
            console.log(`📝 Final contextual info length: ${contextualInfo.length} characters`);
            
            // Show context preview that will be sent to LLM
            console.log('🔍 EXACT CONTEXT BEING SENT TO LLM:');
            console.log('─'.repeat(60));
            console.log(contextualInfo);
            console.log('─'.repeat(60));
            
          } else {
            console.log('❌ NO CONTEXT WILL BE SENT TO LLM - Knowledge base empty or no matches');
            console.log('❌ NO KNOWLEDGE CONTEXT FOUND!');
            console.log('⚠️ This means MEENA will respond generically without MANIT-specific information');
          }
          
          if (chatContext.length > 0) {
            console.log('💬 Using chat history context:', chatContext.length, 'messages');
          }
        } else {
          console.log('❌ ChromaDB not enabled - no context will be added');
        }
        
        // Store user message in ChromaDB
        await storeChatMessage(userMessage);
        
        // Create a placeholder message for MEENA's response
        const meenaMessageId = Date.now() + 1;
        const meenaMessage = {
          id: meenaMessageId,
          text: '',
          sender: 'meena',
          timestamp: new Date(),
          isStreaming: true
        };
        
        setMessages(prev => [...prev, meenaMessage]);
        
        // Prepare enhanced user message with context
        let enhancedMessage = currentInput;
        let hasContext = contextualInfo && contextualInfo.trim().length > 0;
        
        if (hasContext) {
          enhancedMessage = `${currentInput}

---
📚 RELEVANT INFORMATION FROM MANIT KNOWLEDGE BASE:
${contextualInfo}
---

Please answer my question using the relevant information provided above. Be specific and cite the information when possible. If the information is not available in the knowledge base, please mention that I should contact the appropriate MANIT office for the most current details.`;
          
          console.log('\n✅ ENHANCED USER MESSAGE WITH CONTEXT:');
          console.log('📝 Original Question:', currentInput);
          console.log('📋 Context Added:', 'YES');
          console.log('📏 Enhanced Message Length:', enhancedMessage.length);
          console.log('🔍 Enhanced Message Preview:');
          console.log(enhancedMessage.substring(0, 300) + '...');
        } else {
          console.log('\n❌ NO CONTEXT ENHANCEMENT:');
          console.log('📝 Original Message Only:', currentInput);
          console.log('📋 Context Available:', 'NO');
        }

        // Call the chat API
        console.log('\n🤖 CHAT API CALL DETAILS:');
        console.log(`📝 Message Type: ${hasContext ? 'Enhanced with Context' : 'Original Only'}`);
        console.log(`🌐 Language: ${selectedLanguage}`);
        console.log(`🎯 Model: ${selectedModel}`);
        console.log(`� Context Length: ${contextualInfo.length} chars`);
        console.log(`✅ Has Context: ${hasContext ? 'YES' : 'NO'}`);
        
        // Prepare conversation history for context (last 10 messages, excluding the current one being added)
        const conversationHistory = messages.filter(msg => 
          msg.sender && msg.text && !msg.isStreaming && !msg.isError
        ).slice(-10); // Last 10 complete messages for context

        console.log('💬 Sending conversation history:', conversationHistory.length, 'messages');
        if (conversationHistory.length > 0) {
          console.log('📝 History preview:', conversationHistory.map(m => 
            `${m.sender}: ${m.text.substring(0, 50)}...`
          ));
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: enhancedMessage,
            originalMessage: currentInput,
            language: selectedLanguage,
            contextualInfo: contextualInfo,
            model: selectedModel,
            hasContext: hasContext,
            conversationHistory: conversationHistory
          })
        });
        
        console.log(`📡 Chat API Response Status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let fullResponse = '';
        
        // Process streaming response
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content !== undefined) {
                    // Handle replace flag for shimmer/loading messages
                    if (data.replace === true) {
                      fullResponse = data.content; // Replace entire content
                    } else {
                      fullResponse += data.content; // Append content
                    }
                    
                    // Check for fallback trigger and clean from display during streaming
                    const hasFallbackTrigger = fullResponse.includes('HUMAN_FALLBACK_TRIGGER_7439');
                    
                    // Clean fallback trigger from display, handling markdown formatting
                    let displayResponse = fullResponse
                      .replace(/\*\*HUMAN_FALLBACK_TRIGGER_7439\*\*/g, '') // Bold markdown
                      .replace(/\*HUMAN_FALLBACK_TRIGGER_7439\*/g, '')     // Italic markdown
                      .replace(/HUMAN_FALLBACK_TRIGGER_7439/g, '')         // Plain text
                      .replace(/\*\*\s*\*\*/g, '')                         // Clean up empty bold markers with spaces
                      .trim();
                    
                    // Debug logging for fallback trigger
                    if (hasFallbackTrigger) {
                      console.log('🔔 Fallback trigger detected during streaming, flag set to:', hasFallbackTrigger);
                    }
                    
                    // Update the message with streaming content
                    setMessages(prev => prev.map(msg => 
                      msg.id === meenaMessageId 
                        ? { ...msg, text: displayResponse, isStreaming: true, hasFallbackTrigger }
                        : msg
                    ));
                  } else if (data.done) {
                    break;
                  } else if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          }
          
          // Check for fallback trigger and clean the response before displaying
          const hasFallbackTrigger = fullResponse.includes('HUMAN_FALLBACK_TRIGGER_7439');
          
          // Clean fallback trigger from final response, handling markdown formatting
          const cleanedResponse = fullResponse
            .replace(/\*\*HUMAN_FALLBACK_TRIGGER_7439\*\*/g, '') // Bold markdown
            .replace(/\*HUMAN_FALLBACK_TRIGGER_7439\*/g, '')     // Italic markdown
            .replace(/HUMAN_FALLBACK_TRIGGER_7439/g, '')         // Plain text
            .replace(/\*\*\s*\*\*/g, '')                         // Clean up empty bold markers with spaces
            .trim();
          
          // Debug logging for final fallback trigger
          console.log('🔔 Final response analysis:', {
            fullResponseLength: fullResponse.length,
            hasFallbackTrigger,
            cleanedResponseLength: cleanedResponse.length,
            triggerFound: fullResponse.includes('HUMAN_FALLBACK_TRIGGER_7439')
          });
          
          // Mark streaming as complete - ensure this always happens
          setMessages(prev => prev.map(msg => 
            msg.id === meenaMessageId 
              ? { ...msg, text: cleanedResponse, isStreaming: false, hasAttachment: Math.random() > 0.8, hasFallbackTrigger }
              : msg
          ));
          
          console.log('✅ Streaming completed, response length:', fullResponse.length);
          console.log('🧹 Cleaned response length:', cleanedResponse.length);
          
          // Auto-trigger disabled - users can manually request help using the help button
          // const shouldTriggerFallback = checkForHumanFallback(fullResponse, currentInput);
          // if (shouldTriggerFallback) {
          //   setTimeout(() => {
          //     showHumanFallbackDialog(currentInput, cleanedResponse);
          //   }, 1000);
          // }
          
          // Store MEENA's response in ChromaDB
          if (fullResponse.trim()) {
            const meenaResponseMessage = {
              id: meenaMessageId,
              text: fullResponse,
              sender: 'meena',
              timestamp: new Date()
            };
            await storeChatMessage(meenaResponseMessage);
          }
          
          // Force a save check after streaming completes by changing forceSaveFlag
          setTimeout(() => {
            console.log('🔄 Triggering save check after streaming completion');
            setForceSaveFlag(prev => prev + 1); // This will trigger the useEffect
          }, 200);
          
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          
          // If streaming fails, still update the message to show partial response
          setMessages(prev => prev.map(msg => 
            msg.id === meenaMessageId 
              ? { 
                  ...msg, 
                  text: fullResponse || 'Sorry, I encountered an error while generating the response. Please try again.',
                  isStreaming: false,
                  isError: fullResponse === ''
                }
              : msg
          ));
        }
        
      } catch (error) {
        console.error('Error calling Chat API:', error);
        
        // Ensure any streaming message is marked as complete with error
        setMessages(prev => prev.map(msg => 
          msg.isStreaming 
            ? { 
                ...msg, 
                text: msg.text || 'Sorry, I encountered an error while processing your request. Please try again later or contact support if the issue persists.',
                isStreaming: false,
                isError: true,
                hasFallbackTrigger: true // Error cases should allow human fallback
              }
            : msg
        ));
        
      } finally {
        setIsLoading(false);
        
        // Final safety check to ensure no messages are left in streaming state
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.isStreaming 
              ? { 
                  ...msg, 
                  text: msg.text || 'Response incomplete. Please try again.',
                  isStreaming: false,
                  isError: true,
                  hasFallbackTrigger: true // Incomplete responses should allow human fallback
                }
              : msg
          ));
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Ctrl+L or Cmd+L to clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      e.preventDefault();
      setMessages([]);
    }
    // Ctrl+M or Cmd+M to toggle microphone
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      toggleListening();
    }
  };

  const toggleListening = () => {
    if (!speechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      speechRecognition.stop();
    } else {
      speechRecognition.start();
    }
  };

  const handleFAQClick = (faq) => {
    setInputValue(faq);
  };

  const speakText = async (text) => {
    try {
      setIsTTSLoading(true);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      // Stop browser TTS if running
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Smart text chunking for better TTS results
      if (text.length > 800) {
        console.log('📝 Long text detected, using smart chunking for better TTS');
        await speakTextInChunks(text);
        return;
      }
      
      console.log('🔊 Starting SarvamAI TTS for:', {
        text: text.substring(0, 50) + '...',
        fullTextLength: text.length,
        language: selectedLanguage
      });
      
      // Debug: Show the exact text being sent to TTS
      console.log('📝 FULL TTS TEXT BEING SENT:');
      console.log('─'.repeat(80));
      console.log(text);
      console.log('─'.repeat(80));
      console.log(`📊 Total characters: ${text.length}`);
      
      // Call SarvamAI TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: selectedLanguage
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data.audioBase64) {
        console.log('✅ SarvamAI TTS successful, playing audio');
        
        // Create audio from base64
        const audioBlob = new Blob(
          [Uint8Array.from(atob(result.data.audioBase64), c => c.charCodeAt(0))],
          { type: 'audio/wav' }
        );
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Set up audio event listeners
        audio.onloadeddata = () => {
          console.log('🎵 Audio loaded, starting playback');
        };
        
        audio.onended = () => {
          console.log('🎵 Audio playback completed');
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (e) => {
          console.error('❌ Audio playback error:', e);
          fallbackToBasicTTS(text);
        };
        
        // Store current audio reference and play
        setCurrentAudio(audio);
        await audio.play();
        
      } else if (result.fallback) {
        console.log('⚠️ SarvamAI TTS not available, using browser TTS');
        fallbackToBasicTTS(text);
      } else {
        throw new Error(result.error || 'TTS conversion failed');
      }
      
    } catch (error) {
      console.error('❌ SarvamAI TTS Error:', error);
      fallbackToBasicTTS(text);
    } finally {
      setIsTTSLoading(false);
    }
  };
  
  // Smart text chunking for long texts
  const speakTextInChunks = async (text) => {
    console.log('🔀 Chunking text for better TTS:', text.length, 'characters');
    
    // Split text intelligently at sentence boundaries
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + (currentChunk ? '. ' : '') + sentence.trim();
      
      if (testChunk.length <= 700) { // Leave buffer under 800
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
          currentChunk = sentence.trim();
        } else {
          // Single sentence too long, force add it
          chunks.push(sentence.trim());
        }
      }
    }
    
    // Add remaining chunk
    if (currentChunk) {
      chunks.push(currentChunk + (currentChunk.endsWith('.') ? '' : '.'));
    }
    
    console.log('📋 Split into', chunks.length, 'chunks:', chunks.map(c => c.length + ' chars'));
    
    // Speak chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🎙️ Speaking chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 50)}..."`);
      
      try {
        await speakSingleChunk(chunk);
        // Small pause between chunks
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error speaking chunk ${i + 1}:`, error);
        // Continue with remaining chunks
      }
    }
  };
  
  // Speak a single chunk of text
  const speakSingleChunk = async (text) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: selectedLanguage
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data.audioBase64) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(result.data.audioBase64), c => c.charCodeAt(0))],
          { type: 'audio/wav' }
        );
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Return a promise that resolves when audio finishes
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          
          audio.onerror = (e) => {
            console.error('❌ Chunk audio error:', e);
            URL.revokeObjectURL(audioUrl);
            reject(e);
          };
          
          audio.play().catch(reject);
        });
      } else {
        throw new Error(result.error || 'Chunk TTS failed');
      }
    } catch (error) {
      console.error('❌ Single chunk TTS error:', error);
      throw error;
    }
  };

  // Fallback to basic browser TTS
  const fallbackToBasicTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on selected language
      utterance.lang = selectedLanguage === 'English' ? 'en-US' : 
                      selectedLanguage.includes('हिन्दी') ? 'hi-IN' :
                      selectedLanguage.includes('मराठी') ? 'mr-IN' :
                      selectedLanguage.includes('தமிழ்') ? 'ta-IN' :
                      selectedLanguage.includes('বাংলা') ? 'bn-IN' :
                      selectedLanguage.includes('ગુજરાતી') ? 'gu-IN' :
                      selectedLanguage.includes('ಕನ್ನಡ') ? 'kn-IN' : 'en-US';
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  const handleSidebarAction = (category) => {
    switch (category) {
      case 'help':
        setInputValue('Show me frequently asked questions');
        break;
      case 'admin':
        // Navigate to admin dashboard
        window.open('/admin', '_blank');
        break;
      case 'notices':
        setInputValue('Show me recent notices and announcements');
        break;
      default:
        break;
    }
  };

  const startNewChat = () => {
    // Stop any ongoing streaming first
    setMessages(prev => prev.map(msg => 
      msg.isStreaming 
        ? { 
            ...msg, 
            text: msg.text || 'Response interrupted by new chat.',
            isStreaming: false
          }
        : msg
    ));
    
    // Stop loading state
    setIsLoading(false);
    
    // Clear chat
    setTimeout(() => {
      setMessages([]);
      setCurrentChatId(null);
      setInputValue('');
      setShowChatHistory(false);
    }, 50);
  };

  // Debug function to check localStorage
  const debugLocalStorage = () => {
    const data = localStorage.getItem('meena-chat-history');
    console.log('=== DEBUG LOCALSTORAGE ===');
    console.log('Raw data:', data);
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed data:', parsed);
        console.log('Number of chats:', parsed.length);
        
        parsed.forEach((chat, index) => {
          console.log(`Chat ${index + 1}:`, {
            id: chat.id,
            title: chat.title,
            messageCount: chat.messages?.length || 0,
            messages: chat.messages,
            lastMessage: chat.messages?.[chat.messages.length - 1]
          });
        });
      } catch (e) {
        console.error('Parse error:', e);
      }
    } else {
      console.log('No data found in localStorage');
    }
    console.log('=== END DEBUG ===');
  };

  // Debug function to check current messages state
  const debugCurrentMessages = () => {
    console.log('=== CURRENT MESSAGES DEBUG ===');
    console.log('Messages array:', messages);
    console.log('Message count:', messages.length);
    console.log('Last message:', messages[messages.length - 1]);
    console.log('Current chat ID:', currentChatId);
    console.log('=== END CURRENT MESSAGES DEBUG ===');
  };

  // Make it available globally for debugging
  if (typeof window !== 'undefined') {
    window.debugLocalStorage = debugLocalStorage;
    window.debugCurrentMessages = debugCurrentMessages;
  }

  const loadChatHistory = (chat) => {
    console.log('Loading chat history:', chat);
    console.log('Chat messages:', chat.messages);
    
    // FIRST: Stop any ongoing streaming in current chat
    setMessages(prev => prev.map(msg => 
      msg.isStreaming 
        ? { 
            ...msg, 
            text: msg.text || 'Response interrupted by chat switch.',
            isStreaming: false
          }
        : msg
    ));
    
    // SECOND: Stop loading state
    setIsLoading(false);
    
    // Set loading state for visual feedback
    setLoadingChatId(chat.id);
    
    // Use setTimeout to ensure UI updates are smooth
    setTimeout(() => {
      if (chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0) {
        // Ensure no messages in the loaded chat are in streaming state
        const cleanMessages = chat.messages.map(msg => ({
          ...msg,
          isStreaming: false // Force all loaded messages to be non-streaming
        }));
        
        console.log('Loading messages:', {
          originalCount: chat.messages.length,
          cleanCount: cleanMessages.length,
          originalLastMessage: chat.messages[chat.messages.length - 1],
          cleanLastMessage: cleanMessages[cleanMessages.length - 1]
        });
        
        setMessages(cleanMessages);
        setCurrentChatId(chat.id);
        setSelectedLanguage(chat.language || 'English');
        console.log('Successfully loaded messages:', cleanMessages.length);
      } else {
        console.error('No valid messages found in chat history:', chat);
        alert('This chat history appears to be empty or corrupted.');
      }
      
      setShowChatHistory(false);
      setLoadingChatId(null);
      
      // Close sidebar on mobile after loading
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }, 100); // Small delay for smooth transition
  };

  const deleteChatFromHistory = (chatId, e) => {
    e.stopPropagation(); // Prevent chat loading when clicking delete
    e.preventDefault();
    
    setChatHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(chat => chat.id !== chatId);
      // Async localStorage update to avoid blocking UI
      setTimeout(() => {
        localStorage.setItem('meena-chat-history', JSON.stringify(updatedHistory));
      }, 0);
      return updatedHistory;
    });
    
    // If current chat is deleted, start new chat
    if (currentChatId === chatId) {
      startNewChat();
    }
  };

  const formatChatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const clearChatHistory = () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      setChatHistory([]);
      // Async localStorage update
      setTimeout(() => {
        localStorage.removeItem('meena-chat-history');
      }, 0);
      setShowChatHistory(false);
      alert('Chat history cleared successfully!');
    }
  };

  const stopStreaming = () => {
    setMessages(prev => prev.map(msg => 
      msg.isStreaming 
        ? { 
            ...msg, 
            text: msg.text || 'Response stopped by user.',
            isStreaming: false
          }
        : msg
    ));
    setIsLoading(false);
  };

  if (isEmbedded) {
    return (
      <div className="h-screen bg-white flex flex-col">
        {/* Language Selector - Compact */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex justify-end">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Bot className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  MEENA
                </span>
              </h3>
              <div key={currentGreetingIndex} className="animate-fade-in mb-2">
                <p className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {welcomeMessages[currentGreetingIndex].text}
                </p>
                <p className="text-xs text-gray-500 mt-1">{welcomeMessages[currentGreetingIndex].lang}</p>
              </div>
              <p className="text-gray-600 text-sm font-medium">Ask me anything about MANIT!</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[90vw] ${hasInteractiveContent(message.text) ? 'lg:max-w-sm xl:max-w-lg' : 'lg:max-w-xs xl:max-w-md'} ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  {message.sender === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-gray-600" />
                  )}
                </div>
                <div className={`px-3 py-2 text-sm min-w-0 flex-1 ${
                  message.sender === 'user' 
                    ? 'rounded-lg bg-blue-600 text-white' 
                    : 'rounded-md bg-gray-100 text-black'
                }`}>
                  {message.sender === 'user' ? (
                    <div className="break-words overflow-wrap-anywhere">{message.text}</div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="text-gray-800 min-w-0 flex-1">
                        <MessageWithElements 
                          messageText={message.text}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-1">
                        {message.hasFallbackTrigger && (
                          <button
                            onClick={() => {
                              console.log('🆘 Fallback button clicked for message:', message);
                              const lastUserMessage = messages.filter(m => m.sender === 'user').pop();
                              showHumanFallbackDialog(
                                lastUserMessage?.text || 'General inquiry',
                                message.text
                              );
                            }}
                            className="p-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                            title="Contact Human Support"
                          >
                            <HelpCircle size={14} />
                          </button>
                        )}
                        {/* Debug: Show fallback trigger status */}
                        {console.log('🔍 Message render debug:', {
                          messageId: message.id,
                          hasFallbackTrigger: message.hasFallbackTrigger,
                          text: message.text?.substring(0, 100) + '...'
                        })}
                        {/* Temporary: Always show fallback for testing */}
                        {message.sender === 'meena' && !message.isStreaming && !message.hasFallbackTrigger && (
                          <button
                            onClick={() => {
                              console.log('🧪 Test fallback button clicked (no trigger detected)');
                              const lastUserMessage = messages.filter(m => m.sender === 'user').pop();
                              showHumanFallbackDialog(
                                lastUserMessage?.text || 'General inquiry',
                                message.text
                              );
                            }}
                            className="p-1 rounded-full bg-gray-400 hover:bg-gray-500 text-white transition-colors opacity-50"
                            title="Test Fallback (No Trigger Detected)"
                          >
                            <HelpCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleTTS(message.text)}
                          disabled={isTTSLoading}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                          title="Listen to response"
                        >
                          <Volume2 size={14} className={isTTSLoading ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot size={16} className="text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isMinimized ? 'w-16' : 'w-80'} lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {!isMinimized ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">MEENA</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={startNewChat}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                      title="New Chat"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                      title="Minimize Sidebar"
                    >
                      <Menu size={18} />
                    </button>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 p-4 overflow-y-auto">
                {/* Chat History Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Chats</h3>
                    {chatHistory.length > 0 && (
                      <span className="text-xs text-gray-500">({chatHistory.length})</span>
                    )}
                  </div>
                  
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {chatHistory.length === 0 ? (
                      <p className="text-sm text-gray-500 px-3 py-4 text-center border border-dashed border-gray-300 rounded-lg">
                        No chat history yet
                      </p>
                    ) : (
                      chatHistory.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => loadChatHistory(chat)}
                          className={`group cursor-pointer px-3 py-3 rounded-lg text-sm hover:bg-blue-50 transition-colors relative ${
                            currentChatId === chat.id ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:text-blue-600'
                          } ${loadingChatId === chat.id ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium truncate">{chat.title}</p>
                                {loadingChatId === chat.id && (
                                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-1">{chat.lastMessage}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatChatDate(chat.timestamp)}</p>
                            </div>
                            <button
                              onClick={(e) => deleteChatFromHistory(chat.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-500 transition-all flex-shrink-0"
                              title="Delete chat"
                              disabled={loadingChatId === chat.id}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Quick Actions</h3>
                  {sidebarLinks.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => handleSidebarAction(link.category)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-800 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <link.icon size={20} className="text-gray-600" />
                      <span className="font-medium text-gray-800">{link.text}</span>
                    </button>
                  ))}
                </div>
              </nav>
              
              {/* Clear Chat Button */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={startNewChat}
                  className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  + New Chat
                </button>
                {chatHistory.length > 0 && (
                  <button
                    onClick={clearChatHistory}
                    className="w-full px-4 py-2 mt-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear All History ({chatHistory.length})
                  </button>
                )}
              </div>
            </>
          ) : (
            // Minimized sidebar
            <div className="flex flex-col h-full items-center py-4">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-3 rounded-lg hover:bg-gray-100 text-gray-600 mb-4"
                title="Expand Sidebar"
              >
                <MessageSquare size={20} />
              </button>
              
              <button
                onClick={startNewChat}
                className="p-3 rounded-lg hover:bg-gray-100 text-gray-600 mb-4"
                title="New Chat"
              >
                <Plus size={20} />
              </button>
              
              {chatHistory.length > 0 && (
                <div className="text-xs text-gray-500 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center">
                  {chatHistory.length > 9 ? '9+' : chatHistory.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0 h-screen max-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu size={22} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MEENA
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
                    {messages.length > 0 
                      ? `Current Chat • ${messages.length} messages` 
                      : 'Educational Assistant'
                    }
                  </p>
                  <p className="text-xs text-gray-400 hidden lg:block">
                    Model: {selectedModel}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Model Selector */}
              <div className="relative">
                {/* Mobile - Short Code */}
                <select 
                  value={selectedModel}
                  onChange={(e) => {
                    console.log('🔄 Model changed to:', e.target.value);
                    setSelectedModel(e.target.value);
                  }}
                  className="md:hidden appearance-none bg-white border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 font-bold text-xs"
                  style={{
                    backgroundImage: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    minWidth: '50px'
                  }}
                  title={`Current Model: ${selectedModel}`}
                >
                  {availableModels.map((model) => {
                    const shortCode = model.category === 'Primary' ? 'SM' : 
                                     model.name.includes('llama') ? 'LL' :
                                     model.name.includes('gemma') ? 'GM' :
                                     model.name.includes('mixtral') ? 'MX' : 'AI';
                    return (
                      <option 
                        key={model.id} 
                        value={model.id} 
                        className="text-gray-800 bg-white py-2"
                        disabled={!model.available}
                      >
                        {shortCode}
                      </option>
                    );
                  })}
                </select>
                
                {/* Desktop - Full Text */}
                <select 
                  value={selectedModel}
                  onChange={(e) => {
                    console.log('🔄 Model changed to:', e.target.value);
                    setSelectedModel(e.target.value);
                  }}
                  className="hidden md:block appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 font-medium text-sm"
                  style={{
                    backgroundImage: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    minWidth: '140px'
                  }}
                  title={`Current Model: ${selectedModel}`}
                >
                  {availableModels.map((model) => (
                    <option 
                      key={model.id} 
                      value={model.id} 
                      className="text-gray-800 bg-white py-2"
                      disabled={!model.available}
                    >
                      {model.category === 'Primary' ? '🚀 Sarvam-M' : `🔄 ${model.name} (${model.provider.toUpperCase()})`} {!model.available ? ' (Not Available)' : ''}
                    </option>
                  ))}
                </select>
                <Bot className="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              
              {/* Language Selector */}
              <div className="relative">
                {/* Mobile - Short Codes */}
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="md:hidden appearance-none bg-white border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium text-xs"
                  style={{
                    backgroundImage: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    minWidth: '50px'
                  }}
                  title={`Current Language: ${selectedLanguage}`}
                >
                  {languages.map((lang, index) => {
                    const shortCode = lang === 'English' ? 'En' : 
                                     lang.includes('हिन्दी') ? 'Hi' :
                                     lang.includes('मराठी') ? 'Mr' :
                                     lang.includes('தமிழ்') ? 'Ta' :
                                     lang.includes('বাংলা') ? 'Bn' :
                                     lang.includes('ગુજરાતી') ? 'Gu' :
                                     lang.includes('ಕನ್ನಡ') ? 'Kn' : 'En';
                    return (
                      <option key={index} value={lang} className="text-gray-800 bg-white py-2">
                        {shortCode}
                      </option>
                    );
                  })}
                </select>
                
                {/* Desktop - Full Text */}
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="hidden md:block appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium text-sm"
                  style={{
                    backgroundImage: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    minWidth: '120px'
                  }}
                  title={`Current Language: ${selectedLanguage}`}
                >
                  {languages.map((lang, index) => (
                    <option key={index} value={lang} className="text-gray-800 bg-white py-2">
                      {lang}
                    </option>
                  ))}
                </select>
                <Globe className="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0 bg-gradient-to-b from-transparent via-blue-50/30 to-purple-50/30">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              {/* Hero Section */}
              <div className="mb-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-lg mx-auto">
                  <Bot className="text-white" size={44} />
                </div>
                
                {/* Gradient MEENA Title */}
                <h1 className="text-6xl font-black mb-4 text-center">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    MEENA
                  </span>
                </h1>
                
                <p className="text-sm md:text-lg lg:text-xl text-gray-600 mb-2 font-medium text-center">
                  Multilingual Embeddable Educational Natural Language Assistant
                </p>
                
                {/* Animated Greeting */}
                <div className="h-12 md:h-16 flex items-center justify-center">
                  <div key={currentGreetingIndex} className="animate-fade-in text-center">
                    <p className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {welcomeMessages[currentGreetingIndex].text.includes('MEENA') ? (
                        <>
                          {welcomeMessages[currentGreetingIndex].text.split('MEENA')[0]}
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MEENA</span>
                          {welcomeMessages[currentGreetingIndex].text.split('MEENA')[1]}
                        </>
                      ) : (
                        welcomeMessages[currentGreetingIndex].text
                      )}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">
                      {welcomeMessages[currentGreetingIndex].lang}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
                {faqSuggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(suggestion)}
                    className="bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end space-x-2 max-w-[90vw] ${hasInteractiveContent(message.text) ? 'lg:max-w-sm xl:max-w-lg' : 'lg:max-w-xs xl:max-w-md'} ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600'
                    }`}>
                      {message.sender === 'user' ? 
                        <User className="text-white" size={16} /> : 
                        <Bot className="text-white" size={16} />
                      }
                    </div>
                    <div className={`rounded-lg px-4 py-2 min-w-0 flex-1 ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : message.isError
                        ? 'bg-red-50 border border-red-200 text-red-800 font-semibold'
                        : 'bg-white border border-gray-200 text-gray-800 font-semibold'
                    }`}>
                      {message.sender === 'user' ? (
                        <p className="text-white font-semibold break-words overflow-wrap-anywhere">{message.text}</p>
                      ) : (
                        <div className="text-gray-800 font-semibold min-w-0">
                          <MessageWithElements messageText={message.text} />
                        </div>
                      )}
                      {message.isStreaming && (
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <button 
                            onClick={stopStreaming}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                            title="Stop streaming"
                          >
                            Stop
                          </button>
                        </div>
                      )}
                      {message.hasFallbackTrigger && !message.isStreaming && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-600">Need more help?</span>
                          <button
                            onClick={() => {
                              console.log('🆘 Widget fallback button clicked for message:', message);
                              const lastUserMessage = messages.filter(m => m.sender === 'user').pop();
                              showHumanFallbackDialog(
                                lastUserMessage?.text || 'General inquiry',
                                message.text
                              );
                            }}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                            title="Contact Human Support"
                          >
                            <HelpCircle size={12} />
                            <span>Contact Human</span>
                          </button>
                        </div>
                      )}
                      {/* Debug: Widget fallback trigger status */}
                      {console.log('🔍 Widget message render debug:', {
                        messageId: message.id,
                        hasFallbackTrigger: message.hasFallbackTrigger,
                        isStreaming: message.isStreaming,
                        text: message.text?.substring(0, 100) + '...'
                      })}
                      {message.sender === 'meena' && !message.isStreaming && !message.isError && (
                        <div className="flex items-center space-x-2 mt-2">
                          <button 
                            className={`p-1 rounded transition-colors ${
                              isTTSLoading 
                                ? 'bg-blue-100 cursor-wait' 
                                : 'hover:bg-gray-100 hover:text-blue-600'
                            }`}
                            title={isTTSLoading ? 'Converting to speech...' : 'Listen with SarvamAI TTS (Arya voice)'}
                            onClick={() => {
                              console.log('🎙️ TTS Button clicked for message:', {
                                messageId: message.id,
                                textLength: message.text?.length || 0,
                                isStreaming: message.isStreaming,
                                textPreview: message.text?.substring(0, 100) + '...'
                              });
                              speakText(message.text);
                            }}
                            disabled={isTTSLoading}
                          >
                            {isTTSLoading ? (
                              <div className="animate-spin w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <Volume2 size={14} className="text-gray-600" />
                            )}
                          </button>
                          {message.hasAttachment && (
                            <button className="p-1 rounded hover:bg-gray-100" title="View attachment">
                              <Paperclip size={14} className="text-gray-600" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>



        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          {/* ChromaDB Status Indicator - Hidden */}
          {false && isChromaEnabled && contextResults.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">
                  🔍 Found {contextResults.length} relevant knowledge {contextResults.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            </div>
          )}

          {/* SarvamAI Model Indicator - Hidden */}
          {false && selectedModel === 'sarvam-m' && (
            <div className="mb-3 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-700 font-medium">
                  🚀 Using SarvamAI - Optimized for {selectedLanguage} & multilingual understanding
                </span>
              </div>
            </div>
          )}

          {/* TTS Status Indicator */}
          {isTTSLoading && (
            <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-medium">
                  🎙️ Converting to speech with SarvamAI TTS - Arya voice ({selectedLanguage})
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 font-medium placeholder-gray-600 bg-white"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={toggleListening}
              className={`p-3 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <Mic size={20} />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors relative"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
            <button
              onClick={() => {
                const lastUserMessage = messages.filter(m => m.sender === 'user').pop();
                const lastMeenaMessage = messages.filter(m => m.sender === 'meena').pop();
                showHumanFallbackDialog(
                  lastUserMessage?.text || 'General inquiry',
                  lastMeenaMessage?.text || 'User requested human assistance'
                );
              }}
              className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              title="Get Human Help"
            >
              <HelpCircle size={20} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-700 font-medium">
            <p className="text-gray-800">Powered by MEENA – Smart India Hackathon 2025</p>
            <div className="flex items-center space-x-3">
              <span className="text-gray-700">Available on:</span>
              <div className="flex space-x-2">
                <MessageSquare size={16} className="text-green-600" />
                <span className="text-blue-500">📱</span>
                <span className="text-purple-500">🌐</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Human Fallback Dialog */}
      {showFallbackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Need Human Assistance?</h2>
              <p className="text-sm text-gray-600 mt-1">
                It looks like I couldn&apos;t provide the information you need. Let me connect you with our human experts.
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Your Query:</h3>
                <p className="text-gray-800 bg-blue-50 p-4 rounded-lg text-sm font-medium border border-blue-200">{fallbackData.query}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">AI Response:</h3>
                <p className="text-gray-800 bg-orange-50 p-4 rounded-lg text-sm font-medium border border-orange-200">{fallbackData.aiResponse}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={userContact.name}
                    onChange={(e) => setUserContact(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={userContact.phone}
                    onChange={(e) => setUserContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your phone number"
                    required
                  />
                  <p className="text-sm text-gray-700 mt-2 font-medium">
                    ✅ We&apos;ll contact you within 24 hours with a detailed response
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFallbackDialog(false);
                  setUserContact({ name: '', phone: '' });
                  setFallbackData({});
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitHumanFallback}
                disabled={!userContact.phone.trim() || submittingFallback}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
              >
                {submittingFallback ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Phone size={16} />
                    Request Human Help
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
