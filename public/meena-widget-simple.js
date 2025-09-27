// MEENA Embeddable Widget - Simplified Version
(function() {
  'use strict';

  // Configuration
  const defaultConfig = {
    apiUrl: window.location.origin + '/api/chat',
    ttsUrl: window.location.origin + '/api/tts',
    title: 'MEENA - AI Assistant',
    subtitle: 'Ask me anything about MANIT!',
    primaryColor: '#3B82F6',
    position: 'bottom-right',
    language: 'English',
    model: 'sarvam-m',
    enableTTS: true,
    enableVoiceInput: true
  };

  // Parse configuration from script tag
  function getConfig() {
    const scriptTag = document.querySelector('script[data-meena-widget]');
    if (!scriptTag) return defaultConfig;

    const config = Object.assign({}, defaultConfig);
    
    // Parse data attributes
    Object.keys(defaultConfig).forEach(function(key) {
      const dataKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const value = scriptTag.getAttribute('data-' + dataKey);
      if (value !== null) {
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
    const widgetHTML = [
      '<div id="meena-widget" class="meena-widget meena-widget-' + config.position + '">',
      '  <div id="meena-trigger" class="meena-trigger">',
      '    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">',
      '      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2"/>',
      '    </svg>',
      '  </div>',
      '',
      '  <div id="meena-chat-window" class="meena-chat-window meena-hidden">',
      '    <div class="meena-header">',
      '      <div class="meena-header-content">',
      '        <div class="meena-avatar">M</div>',
      '        <div class="meena-header-text">',
      '          <div class="meena-title">' + config.title + '</div>',
      '          <div class="meena-subtitle">' + config.subtitle + '</div>',
      '        </div>',
      '      </div>',
      '      <button id="meena-close" class="meena-close-btn">×</button>',
      '    </div>',
      '',
      '    <div id="meena-messages" class="meena-messages">',
      '      <div class="meena-message meena-bot-message">',
      '        <div class="meena-message-text">Hello! I\'m MEENA, your AI assistant for MANIT. How can I help you today?</div>',
      '      </div>',
      '    </div>',
      '',
      '    <div class="meena-input-area">',
      '      <div class="meena-input-container">',
      '        <textarea id="meena-input" class="meena-input" placeholder="Type your message..." rows="1"></textarea>',
      '        <button id="meena-send-btn" class="meena-send-btn">Send</button>',
      '      </div>',
      '      <div class="meena-controls">',
      '        <select id="meena-language" class="meena-select">',
      '          <option value="English">English</option>',
      '          <option value="हिन्दी (Hindi)">हिन्दी (Hindi)</option>',
      '          <option value="मराठी (Marathi)">मराठी (Marathi)</option>',
      '          <option value="தமிழ் (Tamil)">தமிழ் (Tamil)</option>',
      '          <option value="বাংলা (Bengali)">বাংলা (Bengali)</option>',
      '          <option value="ગુજરાતી (Gujarati)">ગુજરાતી (Gujarati)</option>',
      '          <option value="ಕನ್ನಡ (Kannada)">ಕನ್ನಡ (Kannada)</option>',
      '        </select>',
      '        <div id="meena-status" class="meena-status">Ready</div>',
      '      </div>',
      '    </div>',
      '',
      '    <div class="meena-powered-by">Powered by MEENA AI</div>',
      '  </div>',
      '</div>'
    ].join('\\n');

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  // Create CSS styles
  function createStyles() {
    const css = [
      '.meena-widget {',
      '  position: fixed;',
      '  z-index: 999999;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '',
      '.meena-widget-bottom-right { bottom: 20px; right: 20px; }',
      '.meena-widget-bottom-left { bottom: 20px; left: 20px; }',
      '.meena-widget-top-right { top: 20px; right: 20px; }',
      '.meena-widget-top-left { top: 20px; left: 20px; }',
      '',
      '.meena-trigger {',
      '  width: 60px;',
      '  height: 60px;',
      '  background: ' + config.primaryColor + ';',
      '  border-radius: 50%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  cursor: pointer;',
      '  box-shadow: 0 4px 20px rgba(0,0,0,0.15);',
      '  transition: all 0.3s ease;',
      '}',
      '',
      '.meena-trigger:hover {',
      '  transform: scale(1.05);',
      '}',
      '',
      '.meena-chat-window {',
      '  position: absolute;',
      '  width: 400px;',
      '  height: 600px;',
      '  background: white;',
      '  border-radius: 16px;',
      '  box-shadow: 0 10px 50px rgba(0,0,0,0.15);',
      '  display: flex;',
      '  flex-direction: column;',
      '  overflow: hidden;',
      '  transition: all 0.3s ease;',
      '}',
      '',
      '.meena-widget-bottom-right .meena-chat-window,',
      '.meena-widget-top-right .meena-chat-window {',
      '  right: 0;',
      '}',
      '',
      '.meena-widget-bottom-left .meena-chat-window,',
      '.meena-widget-top-left .meena-chat-window {',
      '  left: 0;',
      '}',
      '',
      '.meena-widget-bottom-right .meena-chat-window,',
      '.meena-widget-bottom-left .meena-chat-window {',
      '  bottom: 80px;',
      '}',
      '',
      '.meena-widget-top-right .meena-chat-window,',
      '.meena-widget-top-left .meena-chat-window {',
      '  top: 80px;',
      '}',
      '',
      '.meena-hidden {',
      '  opacity: 0;',
      '  visibility: hidden;',
      '  transform: scale(0.8);',
      '}',
      '',
      '.meena-header {',
      '  background: ' + config.primaryColor + ';',
      '  color: white;',
      '  padding: 16px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '}',
      '',
      '.meena-header-content {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 12px;',
      '}',
      '',
      '.meena-avatar {',
      '  width: 36px;',
      '  height: 36px;',
      '  background: rgba(255,255,255,0.2);',
      '  border-radius: 50%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  font-weight: bold;',
      '}',
      '',
      '.meena-title {',
      '  font-weight: 600;',
      '  font-size: 16px;',
      '}',
      '',
      '.meena-subtitle {',
      '  font-size: 14px;',
      '  opacity: 0.9;',
      '}',
      '',
      '.meena-close-btn {',
      '  background: none;',
      '  border: none;',
      '  color: white;',
      '  font-size: 24px;',
      '  cursor: pointer;',
      '  padding: 4px;',
      '}',
      '',
      '.meena-messages {',
      '  flex: 1;',
      '  padding: 16px;',
      '  overflow-y: auto;',
      '  background: #f8fafc;',
      '}',
      '',
      '.meena-message {',
      '  margin-bottom: 12px;',
      '}',
      '',
      '.meena-bot-message .meena-message-text {',
      '  background: white;',
      '  color: #374151;',
      '  padding: 12px 16px;',
      '  border-radius: 18px;',
      '  display: inline-block;',
      '  max-width: 85%;',
      '  box-shadow: 0 1px 3px rgba(0,0,0,0.1);',
      '}',
      '',
      '.meena-user-message {',
      '  text-align: right;',
      '}',
      '',
      '.meena-user-message .meena-message-text {',
      '  background: ' + config.primaryColor + ';',
      '  color: white;',
      '  padding: 12px 16px;',
      '  border-radius: 18px;',
      '  display: inline-block;',
      '  max-width: 85%;',
      '}',
      '',
      '.meena-input-area {',
      '  background: white;',
      '  border-top: 1px solid #e5e7eb;',
      '  padding: 16px;',
      '}',
      '',
      '.meena-input-container {',
      '  display: flex;',
      '  gap: 8px;',
      '  margin-bottom: 12px;',
      '}',
      '',
      '.meena-input {',
      '  flex: 1;',
      '  border: 2px solid #d1d5db;',
      '  border-radius: 20px;',
      '  padding: 12px 16px;',
      '  font-size: 14px;',
      '  resize: none;',
      '  outline: none;',
      '  max-height: 100px;',
      '  background-color: #FFFFFF;',
      '  color: #1F2937;',
      '  font-weight: 500;',
      '}',
      '',
      '.meena-input:focus {',
      '  border-color: ' + config.primaryColor + ';',
      '  box-shadow: 0 0 0 3px ' + config.primaryColor + '40;',
      '  background-color: #FEFEFE;',
      '}',
      '',
      '.meena-send-btn {',
      '  background: ' + config.primaryColor + ';',
      '  color: white;',
      '  border: none;',
      '  border-radius: 20px;',
      '  padding: 12px 24px;',
      '  cursor: pointer;',
      '  font-size: 14px;',
      '}',
      '',
      '.meena-send-btn:disabled {',
      '  opacity: 0.5;',
      '  cursor: not-allowed;',
      '}',
      '',
      '.meena-controls {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  align-items: center;',
      '}',
      '',
      '.meena-select {',
      '  border: 1px solid #d1d5db;',
      '  border-radius: 6px;',
      '  padding: 6px 8px;',
      '  font-size: 12px;',
      '}',
      '',
      '.meena-status {',
      '  font-size: 12px;',
      '  color: #6b7280;',
      '}',
      '',
      '.meena-powered-by {',
      '  text-align: center;',
      '  padding: 8px;',
      '  font-size: 11px;',
      '  color: #9ca3af;',
      '  border-top: 1px solid #f3f4f6;',
      '}',
      '',
      '@media (max-width: 480px) {',
      '  .meena-chat-window {',
      '    width: calc(100vw - 40px);',
      '    height: calc(100vh - 40px);',
      '    position: fixed !important;',
      '    top: 20px !important;',
      '    left: 20px !important;',
      '  }',
      '}'
    ].join('\\n');

    const styleSheet = document.createElement('style');
    styleSheet.textContent = css;
    document.head.appendChild(styleSheet);
  }

  // Widget functionality
  let isOpen = false;
  let isLoading = false;
  let conversationHistory = [];

  function initializeWidget() {
    const trigger = document.getElementById('meena-trigger');
    const chatWindow = document.getElementById('meena-chat-window');
    const closeBtn = document.getElementById('meena-close');
    const sendBtn = document.getElementById('meena-send-btn');
    const input = document.getElementById('meena-input');
    const languageSelect = document.getElementById('meena-language');

    // Set initial language
    languageSelect.value = config.language;

    // Toggle chat window
    function toggleChat() {
      isOpen = !isOpen;
      chatWindow.classList.toggle('meena-hidden', !isOpen);
      if (isOpen) input.focus();
    }

    trigger.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Send message
    async function sendMessage() {
      const message = input.value.trim();
      if (!message || isLoading) return;

      addMessage(message, 'user');
      input.value = '';
      showTyping();

      try {
        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            language: languageSelect.value,
            model: config.model,
            conversationHistory: conversationHistory.slice(-10),
            hasContext: false
          })
        });

        if (!response.ok) throw new Error('Failed to get response');

        hideTyping();
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botResponse = '';
        const messageElement = addMessage('', 'bot');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  botResponse += data.content;
                  messageElement.textContent = botResponse;
                }
              } catch (e) {
                console.warn('Parse error:', e);
              }
            }
          }
        }

        conversationHistory.push(
          { sender: 'user', text: message },
          { sender: 'meena', text: botResponse }
        );

        // Add TTS button if enabled
        if (config.enableTTS && botResponse) {
          addTTSButton(messageElement, botResponse);
        }

      } catch (error) {
        hideTyping();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById('meena-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'meena-message meena-' + sender + '-message';
    
    const textElement = document.createElement('div');
    textElement.className = 'meena-message-text';
    textElement.textContent = text;
    
    messageElement.appendChild(textElement);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return textElement;
  }

  function showTyping() {
    isLoading = true;
    document.getElementById('meena-send-btn').disabled = true;
    document.getElementById('meena-status').textContent = 'Thinking...';
  }

  function hideTyping() {
    isLoading = false;
    document.getElementById('meena-send-btn').disabled = false;
    document.getElementById('meena-status').textContent = 'Ready';
  }

  function addTTSButton(messageElement, text) {
    const button = document.createElement('button');
    button.innerHTML = '🔊';
    button.style.cssText = 'background:none;border:none;cursor:pointer;margin-left:8px;font-size:14px;';
    button.onclick = function() { speakText(text); };
    messageElement.parentNode.appendChild(button);
  }

  async function speakText(text) {
    try {
      const response = await fetch(config.ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: document.getElementById('meena-language').value
        })
      });

      const result = await response.json();
      
      if (result.success && result.data.audioBase64) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(result.data.audioBase64), function(c) { return c.charCodeAt(0); })],
          { type: 'audio/wav' }
        );
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = function() { URL.revokeObjectURL(audioUrl); };
        audio.play();
      }
    } catch (error) {
      console.warn('TTS failed:', error);
    }
  }

  // Initialize
  function init() {
    createStyles();
    createWidget();
    initializeWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global API
  window.MEENA = {
    open: function() {
      if (!isOpen) document.getElementById('meena-trigger').click();
    },
    close: function() {
      if (isOpen) document.getElementById('meena-close').click();
    }
  };

})();