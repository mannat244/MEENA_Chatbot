
'use client';

import { useState, useRef, useEffect } from 'react';
import { Groq } from 'groq-sdk';
import ReactMarkdown from 'react-markdown';
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
  ChevronRight
} from 'lucide-react';

export default function Home() {
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
  const messagesEndRef = useRef(null);

  // Initialize Groq client
  const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const languages = [
    'English', 'हिन्दी (Hindi)', 'मराठी (Marathi)', 
    'தமிழ் (Tamil)', 'বাংলা (Bengali)', 'ગુજરાતી (Gujarati)'
  ];

  const welcomeMessages = [
    { lang: 'English', text: 'Hello! I\'m MEENA, your educational assistant.' },
    { lang: 'हिन्दी', text: 'नमस्ते! मैं मीना हूं, आपकी शैक्षिक सहायक।' },
    { lang: 'मराठी', text: 'नमस्कार! मी मीना आहे, तुमची शैक्षिक सहाय्यक।' },
    { lang: 'தமிழ்', text: 'வணக்கம்! நான் மீனா, உங்கள் கல்வி உதவியாளர்.' },
    { lang: 'বাংলা', text: 'নমস্কার! আমি মীনা, আপনার শিক্ষা সহায়ক।' },
    { lang: 'ગુજરાતી', text: 'નમસ્તે! હું મીના છું, તમારી શૈક્ષિક સહાયક।' }
  ];

  const faqSuggestions = [
    'Mid-semester exam dates', 'Fee payment deadline', 'Hostel room booking', 
    'Library timings', 'Scholarship deadline', 'Placement cell contact',
    'Mess fee details', 'Medical center hours', 'ERP login issues'
  ];

  const sidebarLinks = [
    { icon: HelpCircle, text: 'FAQ', category: 'help' },
    { icon: Settings, text: 'Dashboard', category: 'admin' },
    { icon: BookOpen, text: 'Notices', category: 'notices' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                       selectedLanguage.includes('ગુજરાતી') ? 'gu-IN' : 'en-US';

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
  }, [messages.length, currentChatId, selectedLanguage, forceSaveFlag]); // Added forceSaveFlag dependency

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        
        // Language instruction based on selected language
        const languageInstruction = selectedLanguage !== 'English' 
          ? `Please respond in ${selectedLanguage}. ` 
          : '';
        
        // Create chat completion with streaming
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are MEENA, a Multilingual Embeddable Educational Natural Language Assistant for Maulana Azad National Institute of Technology (MANIT), Bhopal. You help students with academic queries, campus information, and administrative processes.

CURRENT ACADEMIC INFORMATION (2025-26):
- Mid-Semester Exams: September 28 - October 5, 2025
- End-Semester Exams: December 15 - December 30, 2025
- Fee Payment Deadline: October 15, 2025 (Late fee ₹500 after this date)
- Scholarship Application Deadline: October 20, 2025
- Library Hours: 8:00 AM - 10:00 PM (Mon-Sat), 9:00 AM - 6:00 PM (Sunday)
- Hostel Fee: ₹5,000 - 10,000 per semester
- Mess Fee: ₹27,000 per semester
- Academic Fee: ₹65,000 per semester (B.Tech), ₹75,000 (M.Tech)

DEPARTMENTS & PROGRAMS:
- Computer Science & Engineering (CSE)
- Electronics & Communication (ECE)
- Mechanical Engineering (ME)
- Civil Engineering (CE)
- Electrical Engineering (EE)
- Chemical Engineering (ChE)
- Architecture & Planning
- MBA, MCA, M.Tech, PhD programs

CAMPUS FACILITIES:
- Central Library (24/7 during exams)
- Computer Center with high-speed internet
- Sports Complex with gym, swimming pool, courts
- Medical Center (8 AM - 8 PM)
- Canteens: Main Canteen, Food Court, Amul Parlor
- Bank: SBI branch inside campus
- ATMs: SBI, HDFC, ICICI available

HOSTEL INFORMATION:
Hostel Information:
- Boys' Hostels:
    • Hostel No. 1: Homi Jehangir Bhabha Bhawan
    • Hostel No. 2: Vikram Sarabhai Bhawan
    • Hostel No. 5: Mokshagundam Visvesvarayya Bhawan
    • Hostel No. 6: Jagadish Chandra Bhawan
    • Hostel No. 8: Ramanujan Bhavan
    • Hostel No. 10: A.P.J. Abdul Kalam Chhatrawas (CD Block) - for 1st to 3rd year boys  
        ◦ Triple Sharing: ₹5000 / semester  
        ◦ Dual Sharing: ₹7500 / semester  
        ◦ Single Room: ₹10000 / semester
    • NRI Hostel: Raja Ramanna Bhawan
    • Energy Centre (boys' facility)
- Girls' Hostel:
    • Hostel No. 7: Kalpana Chawla Bhawan


CONTACT INFORMATION:
- Academic Office: 0755-2670803
- Hostel Office: 0755-2670805
- Medical Center: 0755-2670807
- Training & Placement: 0755-2670810

RECENT NOTICES:
- Registration for Winter Training Programs starts October 1
- Placement drive for 2025 batch begins November 1 
- Cultural fest "Techno-Mania" , Maffick scheduled for March 2026
- New ERP system login credentials distributed

You must communicate naturally in English, Hindi, Punjabi, Marathi, Tamil, Telugu and other Indian regional languages. Keep replies concise, accurate, and conversational. If information is not available in the database, politely mention that the query will be escalated to the academic office. Always maintain a professional, student-friendly tone. ${languageInstruction}`
            },
            {
              role: "user",
              content: currentInput
            }
          ],
          model: "gemma2-9b-it",
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: true,
          stop: null
        });

        let fullResponse = '';
        
        // Process streaming response
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
            
            // Update the message with streaming content
            setMessages(prev => prev.map(msg => 
              msg.id === meenaMessageId 
                ? { ...msg, text: fullResponse, isStreaming: true }
                : msg
            ));
          }
          
          // Mark streaming as complete - ensure this always happens
          setMessages(prev => prev.map(msg => 
            msg.id === meenaMessageId 
              ? { ...msg, text: fullResponse, isStreaming: false, hasAttachment: Math.random() > 0.8 }
              : msg
          ));
          
          console.log('✅ Streaming completed, response length:', fullResponse.length);
          
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
        console.error('Error calling Groq API:', error);
        
        // Ensure any streaming message is marked as complete with error
        setMessages(prev => prev.map(msg => 
          msg.isStreaming 
            ? { 
                ...msg, 
                text: msg.text || 'Sorry, I encountered an error while processing your request. Please try again later or contact support if the issue persists.',
                isStreaming: false,
                isError: true
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
                  isError: true
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

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on selected language
      utterance.lang = selectedLanguage === 'English' ? 'en-US' : 
                      selectedLanguage.includes('हिन्दी') ? 'hi-IN' :
                      selectedLanguage.includes('मराठी') ? 'mr-IN' :
                      selectedLanguage.includes('தமிழ்') ? 'ta-IN' :
                      selectedLanguage.includes('বাংলা') ? 'bn-IN' :
                      selectedLanguage.includes('ગુજરાતી') ? 'gu-IN' : 'en-US';
      
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
        setInputValue('I need help with administrative processes');
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
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MEENA
                  </h1>
                  <p className="text-sm text-gray-500">
                    {messages.length > 0 
                      ? `Current Chat • ${messages.length} messages` 
                      : 'Educational Assistant'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                  style={{
                    backgroundImage: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                >
                  {languages.map((lang, index) => (
                    <option key={index} value={lang} className="text-gray-800 bg-white py-2">
                      {lang}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                <Bot className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to MEENA</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                {welcomeMessages.map((msg, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm mb-2">{msg.lang}</p>
                    <p className="text-gray-700 font-medium">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
                    <div className={`rounded-lg px-4 py-2 ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : message.isError
                        ? 'bg-red-50 border border-red-200 text-red-800 font-semibold'
                        : 'bg-white border border-gray-200 text-gray-800 font-semibold'
                    }`}>
                      {message.sender === 'user' ? (
                        <p className="text-white font-semibold">{message.text}</p>
                      ) : (
                        <div className="text-gray-800 font-semibold prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>,
                              pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2">{children}</pre>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-md font-bold mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">{children}</blockquote>,
                              a: ({ children, href }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
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
                      {message.sender === 'meena' && !message.isStreaming && !message.isError && (
                        <div className="flex items-center space-x-2 mt-2">
                          <button 
                            className="p-1 rounded hover:bg-gray-100" 
                            title="Listen to response"
                            onClick={() => speakText(message.text)}
                          >
                            <Volume2 size={14} className="text-gray-600" />
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

        {/* FAQ Suggestions */}
        {messages.length === 0 && (
          <div className="px-4 py-2 flex-shrink-0">
            <div className="flex flex-wrap gap-2 justify-center">
              {faqSuggestions.map((faq, index) => (
                <button
                  key={index}
                  onClick={() => handleFAQClick(faq)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-800 font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                >
                  {faq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800 font-medium placeholder-gray-500"
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
    </div>
  );
}
