"use client"
'use client';

import { useState, useEffect } from 'react';
import {
  Copy,
  Eye,
  Settings, 
  Palette, 
  Globe, 
  Code,
  CheckCircle,
  ExternalLink,
  Download
} from 'lucide-react';

export default function WidgetGenerator() {
  const [config, setConfig] = useState({
    apiUrl: '',
    title: 'MEENA - AI Assistant',
    subtitle: 'Ask me anything about MANIT!',
    primaryColor: '#3B82F6',
    position: 'bottom-right',
    width: '400px',
    height: '600px',
    language: 'English',
    model: 'sarvam-m',
    enableTTS: true,
    enableVoiceInput: true
  });
  
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState('code');

  useEffect(() => {
    // Set the API URL based on current location
    setConfig(prev => ({
      ...prev,
      apiUrl: window.location.origin
    }));
  }, []);

  const positions = [
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
    { value: 'top-right', label: 'Top Right', icon: '↗️' },
    { value: 'top-left', label: 'Top Left', icon: '↖️' }
  ];

  const languages = [
    'English', 'हिन्दी (Hindi)', 'मराठी (Marathi)', 
    'தமிழ் (Tamil)', 'বাংলা (Bengali)', 'ગુજરાતી (Gujarati)', 'ಕನ್ನಡ (Kannada)'
  ];

  const generateEmbedCode = () => {
    const attributes = [
      `data-api-url="${config.apiUrl}"`,
      `data-title="${config.title}"`,
      `data-primary-color="${config.primaryColor}"`,
      `data-position="${config.position}"`,
      `data-width="${config.width || '400px'}"`,
      `data-height="${config.height || '600px'}"`
    ];

    return `<!-- MEENA AI Widget - Embed this in your website's <head> or before </body> -->
<script 
  data-meena-iframe 
  ${attributes.join('\\n  ')}
  src="${config.apiUrl}/meena-widget-iframe.js">
</script>`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadWidget = () => {
    const link = document.createElement('a');
    link.href = '/meena-widget-simple.js';
    link.download = 'meena-widget.js';
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 MEENA Widget Generator
        </h1>
        <p className="text-gray-600">
          Create an embeddable MEENA AI assistant for any website. Copy the generated code and paste it into your website&apos;s HTML.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Widget Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* Basic Settings */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-300 pb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Basic Settings
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Widget Title
                  </label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Default Language
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Width
                    </label>
                    <select
                      value={config.width}
                      onChange={(e) => setConfig(prev => ({ ...prev, width: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm"
                    >
                      <option value="300px">Small (300px)</option>
                      <option value="400px">Medium (400px)</option>
                      <option value="500px">Large (500px)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Height
                    </label>
                    <select
                      value={config.height}
                      onChange={(e) => setConfig(prev => ({ ...prev, height: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm"
                    >
                      <option value="500px">Short (500px)</option>
                      <option value="600px">Medium (600px)</option>
                      <option value="700px">Tall (700px)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-300 pb-2">
                <Palette className="w-5 h-5 text-blue-600" />
                Appearance
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 border-2 border-gray-400 rounded cursor-pointer shadow-sm"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {positions.map(pos => (
                      <button
                        key={pos.value}
                        onClick={() => setConfig(prev => ({ ...prev, position: pos.value }))}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          config.position === pos.value
                            ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-md transform scale-105'
                            : 'border-gray-400 text-gray-800 bg-white hover:bg-gray-50 hover:border-blue-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-lg mb-1">{pos.icon}</div>
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Preview & Code Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Embed Code</h2>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode('code')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  previewMode === 'code'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  previewMode === 'preview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {previewMode === 'code' ? (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {generateEmbedCode()}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>

                <button
                  onClick={downloadWidget}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download JS
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 How to Use:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Copy the embed code above</li>
                  <li>2. Paste it in your website&apos;s HTML (before closing &lt;/body&gt; tag)</li>
                  <li>3. A floating chat button will appear automatically</li>
                  <li>4. Users can click it to open the MEENA chat iframe</li>
                  <li>5. The chat opens in a secure iframe with full functionality</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Widget Preview */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <div className="text-gray-500 mb-4">
                  <Eye className="w-8 h-8 mx-auto mb-2" />
                  Widget Preview
                </div>
                
                {/* Mock widget */}
                <div 
                  className="inline-flex items-center gap-3 px-4 py-3 rounded-full text-white font-medium shadow-lg"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm">
                    M
                  </div>
                  <span>{config.title}</span>
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    💬
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Position: <span className="font-medium">{positions.find(p => p.value === config.position)?.label}</span>
                </div>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Size</span>
                  <span className="text-sm font-medium text-blue-600">{config.width} × {config.height}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Language Support</span>
                  <span className="text-sm font-medium text-blue-600">{config.language}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Features</span>
                  <span className="text-sm font-medium text-green-600">Full MEENA Chat</span>
                </div>
              </div>

              {/* Live Demo Link */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">🚀 Test Your Widget:</h3>
                <p className="text-sm text-green-800 mb-3">
                  Want to see how it works? Try the live demo with your settings:
                </p>
                <button 
                  onClick={() => window.open('/widget-demo?' + new URLSearchParams(config).toString(), '_blank')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Live Demo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Additional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Widget Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Simple iframe-based implementation</li>
              <li>• Floating chat button interface</li>
              <li>• Full MEENA chat functionality</li>
              <li>• Multi-language support (7+ languages)</li>
              <li>• SarvamAI TTS with natural voices</li>
              <li>• Secure iframe sandbox</li>
              <li>• Customizable size and position</li>
              <li>• Mobile responsive design</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Browser Support:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Chrome 60+ ✅</li>
              <li>• Firefox 55+ ✅</li>
              <li>• Safari 12+ ✅</li>
              <li>• Edge 79+ ✅</li>
              <li>• Mobile browsers ✅</li>
              <li>• Works without JavaScript libraries</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro Tip:</strong> The iframe widget loads your full MEENA chat interface in embedded mode, 
            giving users the complete experience while keeping your main site secure and unaffected.
          </p>
        </div>
      </div>
    </div>
  );
}