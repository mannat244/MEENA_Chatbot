// MEENA Embeddable Widget
// This script creates a floating chat widget that can be embedded on any website

(function() {
  'use strict';

  // Configuration - will be overridden by embed parameters
  const defaultConfig = {
    apiUrl: 'https://your-domain.com/api/chat',
    ttsUrl: 'https://your-domain.com/api/tts',
    title: 'MEENA - AI Assistant',
    subtitle: 'Ask me anything about MANIT!',
    primaryColor: '#3B82F6',
    position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    language: 'English',
    model: 'sarvam-m',
    enableTTS: true,
    enableVoiceInput: true,
    widgetId: null
  };

  // Parse configuration from script tag
  function getConfig() {
    const scriptTag = document.querySelector('script[data-meena-widget]');
    if (!scriptTag) return defaultConfig;

    const config = { ...defaultConfig };
    
    // Parse data attributes
    Object.keys(defaultConfig).forEach(key => {
      const dataKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const value = scriptTag.getAttribute(`data-${dataKey}`);
      if (value !== null) {
        // Convert string values to appropriate types
        if (value === 'true') config[key] = true;
        else if (value === 'false') config[key] = false;
        else config[key] = value;
      }
    });

    return config;
  }

  const config = getConfig();

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <div id="meena-widget" class="meena-widget meena-widget-${config.position}">
        <!-- Chat Trigger Button -->
        <div id="meena-trigger" class="meena-trigger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="meena-notification-dot" id="meena-notification"></div>
        </div>

        <!-- Chat Window -->
        <div id="meena-chat-window" class="meena-chat-window meena-hidden">
          <!-- Header -->
          <div class="meena-header">
            <div class="meena-header-content">
              <div class="meena-avatar">
                <div class="meena-avatar-circle">M</div>
              </div>
              <div class="meena-header-text">
                <div class="meena-title">${config.title}</div>
                <div class="meena-subtitle">${config.subtitle}</div>
              </div>
            </div>
            <button id="meena-close" class="meena-close-btn">×</button>
          </div>

          <!-- Messages Area -->
          <div id="meena-messages" class="meena-messages">
            <div class="meena-message meena-bot-message">
              <div class="meena-message-content">
                <div class="meena-message-text">Hello! I'm MEENA, your AI assistant for MANIT. How can I help you today?</div>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="meena-input-area">
            <div class="meena-input-container">
              <textarea 
                id="meena-input" 
                class="meena-input" 
                placeholder="Type your message..."
                rows="1"
              ></textarea>
              ${config.enableVoiceInput ? `
                <button id="meena-voice-btn" class="meena-voice-btn" title="Voice Input">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
                    <path d="M19 10V12C19 16.42 15.42 20 11 20H13C17.97 20 22 15.97 22 11V10H19ZM2 10V12C2 15.97 6.03 20 11 20H13C8.58 20 5 16.42 5 12V10H2Z" fill="currentColor"/>
                  </svg>
                </button>
              ` : ''}
              <button id="meena-send-btn" class="meena-send-btn" title="Send Message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            
            <!-- Controls -->
            <div class="meena-controls">
              <select id="meena-language" class="meena-select">
                <option value="English">English</option>
                <option value="हिन्दी (Hindi)">हिन्दी (Hindi)</option>
                <option value="मराठी (Marathi)">मराठी (Marathi)</option>
                <option value="தமிழ் (Tamil)">தமிழ் (Tamil)</option>
                <option value="বাংলা (Bengali)">বাংলা (Bengali)</option>
                <option value="ગુજરાતી (Gujarati)">ગુજરાતી (Gujarati)</option>
                <option value="ಕನ್ನಡ (Kannada)">ಕನ್ನಡ (Kannada)</option>
              </select>
              
              <div class="meena-status" id="meena-status">
                <span class="meena-status-dot"></span>
                <span class="meena-status-text">Ready</span>
              </div>
            </div>
          </div>

          <!-- Powered By -->
          <div class="meena-powered-by">
            <span>Powered by MEENA AI</span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  // Create and inject CSS
  function createStyles() {
    const styles = `
      .meena-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .meena-widget-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .meena-widget-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .meena-widget-top-right {
        top: 20px;
        right: 20px;
      }

      .meena-widget-top-left {
        top: 20px;
        left: 20px;
      }

      .meena-trigger {
        width: 60px;
        height: 60px;
        background: ${config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        position: relative;
      }

      .meena-trigger:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
      }

      .meena-notification-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background: #EF4444;
        border-radius: 50%;
        display: none;
        animation: meena-pulse 2s infinite;
      }

      @keyframes meena-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }

      .meena-chat-window {
        position: absolute;
        width: 400px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
        transform-origin: bottom right;
      }

      .meena-widget-bottom-right .meena-chat-window,
      .meena-widget-top-right .meena-chat-window {
        right: 0;
      }

      .meena-widget-bottom-left .meena-chat-window,
      .meena-widget-top-left .meena-chat-window {
        left: 0;
      }

      .meena-widget-bottom-right .meena-chat-window,
      .meena-widget-bottom-left .meena-chat-window {
        bottom: 80px;
      }

      .meena-widget-top-right .meena-chat-window,
      .meena-widget-top-left .meena-chat-window {
        top: 80px;
      }

      .meena-hidden {
        opacity: 0;
        visibility: hidden;
        transform: scale(0.8);
      }

      .meena-header {
        background: ${config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .meena-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .meena-avatar-circle {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
      }

      .meena-title {
        font-weight: 600;
        font-size: 16px;
        margin: 0;
      }

      .meena-subtitle {
        font-size: 14px;
        opacity: 0.9;
        margin: 2px 0 0 0;
      }

      .meena-close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .meena-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .meena-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #F8FAFC;
      }

      .meena-message {
        display: flex;
        flex-direction: column;
      }

      .meena-bot-message {
        align-items: flex-start;
      }

      .meena-user-message {
        align-items: flex-end;
      }

      .meena-message-content {
        max-width: 85%;
        position: relative;
      }

      .meena-message-text {
        padding: 12px 16px;
        border-radius: 18px;
        line-height: 1.4;
        font-size: 14px;
      }

      .meena-bot-message .meena-message-text {
        background: white;
        color: #374151;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .meena-user-message .meena-message-text {
        background: ${config.primaryColor};
        color: white;
      }

      .meena-message-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        padding: 0 4px;
      }

      .meena-action-btn {
        background: none;
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        color: #6B7280;
        transition: all 0.2s;
      }

      .meena-action-btn:hover {
        background: #F3F4F6;
        color: ${config.primaryColor};
      }

      .meena-input-area {
        background: white;
        border-top: 1px solid #E5E7EB;
        padding: 16px;
      }

      .meena-input-container {
        display: flex;
        align-items: end;
        gap: 8px;
        margin-bottom: 12px;
      }

      .meena-input {
        flex: 1;
        border: 2px solid #D1D5DB;
        border-radius: 20px;
        padding: 12px 16px;
        font-size: 14px;
        resize: none;
        outline: none;
        transition: all 0.2s;
        max-height: 100px;
        min-height: 40px;
        background-color: #FFFFFF;
        color: #1F2937;
        font-weight: 500;
      }

      .meena-input:focus {
        border-color: ${config.primaryColor};
        box-shadow: 0 0 0 3px ${config.primaryColor}25;
        background-color: #FEFEFE;
      }

      .meena-voice-btn,
      .meena-send-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .meena-voice-btn {
        background: #F3F4F6;
        color: #6B7280;
      }

      .meena-voice-btn:hover,
      .meena-voice-btn.meena-listening {
        background: #EF4444;
        color: white;
      }

      .meena-send-btn {
        background: ${config.primaryColor};
        color: white;
      }

      .meena-send-btn:hover {
        background: ${config.primaryColor}dd;
      }

      .meena-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .meena-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .meena-select {
        border: 1px solid #D1D5DB;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        outline: none;
        background: white;
      }

      .meena-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #6B7280;
      }

      .meena-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10B981;
      }

      .meena-status-dot.meena-loading {
        background: #F59E0B;
        animation: meena-pulse 1s infinite;
      }

      .meena-status-dot.meena-error {
        background: #EF4444;
      }

      .meena-powered-by {
        text-align: center;
        padding: 8px;
        font-size: 11px;
        color: #9CA3AF;
        border-top: 1px solid #F3F4F6;
      }

      .meena-typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
      }

      .meena-typing-dot {
        width: 8px;
        height: 8px;
        background: #9CA3AF;
        border-radius: 50%;
        animation: meena-typing 1.4s infinite;
      }

      .meena-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .meena-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes meena-typing {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-10px);
        }
      }

      @media (max-width: 480px) {
        .meena-chat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 40px);
          position: fixed !important;
          top: 20px !important;
          left: 20px !important;
          right: 20px !important;
          bottom: 20px !important;
        }
      }
    \`;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Widget functionality
  let isOpen = false;
  let isLoading = false;
  let conversationHistory = [];
  let recognition = null;

  function initializeWidget() {
    const trigger = document.getElementById('meena-trigger');
    const chatWindow = document.getElementById('meena-chat-window');
    const closeBtn = document.getElementById('meena-close');
    const sendBtn = document.getElementById('meena-send-btn');
    const input = document.getElementById('meena-input');
    const voiceBtn = document.getElementById('meena-voice-btn');
    const languageSelect = document.getElementById('meena-language');

    // Set initial language
    languageSelect.value = config.language;

    // Toggle chat window
    function toggleChat() {
      isOpen = !isOpen;
      chatWindow.classList.toggle('meena-hidden', !isOpen);
      
      if (isOpen) {
        input.focus();
        // Hide notification dot when opened
        document.getElementById('meena-notification').style.display = 'none';
      }
    }

    trigger.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Send message
    async function sendMessage() {
      const message = input.value.trim();
      if (!message || isLoading) return;

      // Add user message
      addMessage(message, 'user');
      input.value = '';
      input.style.height = 'auto';

      // Show typing indicator
      showTypingIndicator();
      setStatus('thinking', 'Thinking...');

      try {
        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            language: languageSelect.value,
            model: config.model,
            conversationHistory: conversationHistory.slice(-10),
            hasContext: false
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        hideTypingIndicator();
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botResponse = '';
        const messageElement = addMessage('', 'bot');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  botResponse += data.content;
                  updateMessage(messageElement, botResponse);
                } else if (data.done) {
                  break;
                }
              } catch (e) {
                console.warn('Failed to parse streaming data:', e);
              }
            }
          }
        }

        // Add to conversation history
        conversationHistory.push(
          { sender: 'user', text: message },
          { sender: 'meena', text: botResponse }
        );

        setStatus('ready', 'Ready');

      } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        setStatus('error', 'Error');
        setTimeout(() => setStatus('ready', 'Ready'), 3000);
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });

    // Voice input (if enabled)
    if (config.enableVoiceInput && voiceBtn) {
      initializeVoiceInput(voiceBtn);
    }
  }

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById('meena-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `meena-message meena-${sender}-message`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'meena-message-content';
    
    const textElement = document.createElement('div');
    textElement.className = 'meena-message-text';
    textElement.textContent = text;
    
    contentElement.appendChild(textElement);

    // Add TTS button for bot messages
    if (sender === 'bot' && text && config.enableTTS) {
      const actionsElement = document.createElement('div');
      actionsElement.className = 'meena-message-actions';
      
      const ttsButton = document.createElement('button');
      ttsButton.className = 'meena-action-btn';
      ttsButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 9V15H7L12 20V4L7 9H3Z" stroke="currentColor" stroke-width="2"/>
          <path d="M15.54 8.46C16.4731 9.39309 17.0001 10.6656 17.0001 12C17.0001 13.3344 16.4731 14.6069 15.54 15.54" stroke="currentColor" stroke-width="2"/>
        </svg>
      `;
      ttsButton.title = 'Listen';
      ttsButton.addEventListener('click', () => speakText(text));
      
      actionsElement.appendChild(ttsButton);
      contentElement.appendChild(actionsElement);
    }
    
    messageElement.appendChild(contentElement);
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return textElement;
  }

  function updateMessage(element, text) {
    element.textContent = text;
    const messagesContainer = document.getElementById('meena-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    isLoading = true;
    document.getElementById('meena-send-btn').disabled = true;
    
    const messagesContainer = document.getElementById('meena-messages');
    const typingElement = document.createElement('div');
    typingElement.id = 'meena-typing';
    typingElement.className = 'meena-message meena-bot-message';
    typingElement.innerHTML = \`
      <div class="meena-message-content">
        <div class="meena-typing-indicator">
          <div class="meena-typing-dot"></div>
          <div class="meena-typing-dot"></div>
          <div class="meena-typing-dot"></div>
        </div>
      </div>
    \`;
    
    messagesContainer.appendChild(typingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTypingIndicator() {
    isLoading = false;
    document.getElementById('meena-send-btn').disabled = false;
    const typingElement = document.getElementById('meena-typing');
    if (typingElement) {
      typingElement.remove();
    }
  }

  function setStatus(type, text) {
    const statusDot = document.querySelector('.meena-status-dot');
    const statusText = document.querySelector('.meena-status-text');
    
    statusDot.className = \`meena-status-dot meena-\${type}\`;
    statusText.textContent = text;
  }

  async function speakText(text) {
    if (!config.enableTTS) return;
    
    try {
      const response = await fetch(config.ttsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          language: document.getElementById('meena-language').value
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
        
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.warn('TTS failed:', error);
    }
  }

  function initializeVoiceInput(voiceBtn) {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      voiceBtn.style.display = 'none';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Will be updated based on language selection

    recognition.onstart = () => {
      voiceBtn.classList.add('meena-listening');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      document.getElementById('meena-input').value = transcript;
    };

    recognition.onend = () => {
      voiceBtn.classList.remove('meena-listening');
    };

    recognition.onerror = () => {
      voiceBtn.classList.remove('meena-listening');
    };

    voiceBtn.addEventListener('click', () => {
      if (voiceBtn.classList.contains('meena-listening')) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    createStyles();
    createWidget();
    initializeWidget();
    
    // Show notification after a delay to attract attention
    setTimeout(() => {
      if (!isOpen) {
        document.getElementById('meena-notification').style.display = 'block';
      }
    }, 5000);
  }

  // Expose global function for custom integration
  window.MEENA = {
    open: () => {
      if (!isOpen) {
        document.getElementById('meena-trigger').click();
      }
    },
    close: () => {
      if (isOpen) {
        document.getElementById('meena-close').click();
      }
    },
    sendMessage: (message) => {
      document.getElementById('meena-input').value = message;
      document.getElementById('meena-send-btn').click();
    }
  };

})();