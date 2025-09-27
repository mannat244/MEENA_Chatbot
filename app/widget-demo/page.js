export default function WidgetDemo() {
  return (
    <html lang="en">
      <head>
        <title>MEENA Widget Demo</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          
          h1 {
            color: #2d3748;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5rem;
          }
          
          .demo-section {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
          }
          
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          
          .feature-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          
          .feature-card h3 {
            margin: 0 0 10px 0;
            color: #2d3748;
          }
          
          .feature-card p {
            margin: 0;
            color: #4a5568;
            font-size: 0.95rem;
          }
          
          .instructions {
            background: #e6fffa;
            border: 1px solid #38b2ac;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
          }
          
          .instructions h3 {
            margin: 0 0 15px 0;
            color: #2c7a7b;
          }
          
          .instructions ol {
            margin: 0;
            padding-left: 20px;
          }
          
          .instructions li {
            margin: 8px 0;
            color: #2d3748;
          }
          
          .warning {
            background: #fff5f5;
            border: 1px solid #fc8181;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #742a2a;
          }
          
          .back-link {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
            transition: background-color 0.2s;
          }
          
          .back-link:hover {
            background: #2563eb;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>🤖 MEENA Widget Live Demo</h1>
          
          <div className="demo-section">
            <h2>Welcome to the MEENA Widget Demo!</h2>
            <p>
              This page demonstrates how the MEENA AI assistant widget works when embedded in a real website. 
              The widget appears as a floating chat button that users can click to start conversations.
            </p>
          </div>

          <div className="instructions">
            <h3>📋 How to Test:</h3>
            <ol>
              <li>Look for the floating chat button (usually in the bottom-right corner)</li>
              <li>Click the chat button to open the MEENA assistant</li>
              <li>Ask questions about MANIT, courses, admissions, or anything else</li>
              <li>Try the voice features if enabled (speak button and listen to responses)</li>
              <li>Test different languages by typing in Hindi, Marathi, or other supported languages</li>
            </ol>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <h3>💬 Natural Conversations</h3>
              <p>Ask questions in natural language about MANIT, courses, facilities, and more.</p>
            </div>
            
            <div className="feature-card">
              <h3>🗣️ Voice Support</h3>
              <p>Listen to responses with high-quality Text-to-Speech and use voice input.</p>
            </div>
            
            <div className="feature-card">
              <h3>🌍 Multi-language</h3>
              <p>Supports English, Hindi, Marathi, Tamil, Bengali, and other Indian languages.</p>
            </div>
            
            <div className="feature-card">
              <h3>📱 Mobile Friendly</h3>
              <p>Responsive design that works perfectly on phones, tablets, and desktops.</p>
            </div>
            
            <div className="feature-card">
              <h3>💾 Memory</h3>
              <p>Remembers your conversation context for more natural follow-up questions.</p>
            </div>
            
            <div className="feature-card">
              <h3>⚡ Fast & Reliable</h3>
              <p>Quick responses powered by advanced AI models and optimized infrastructure.</p>
            </div>
          </div>

          <div className="warning">
            <strong>Note:</strong> This is a live demo using the same API as the main MEENA system. 
            Your conversations may be logged for quality improvement purposes.
          </div>

          <a href="/admin" className="back-link">
            ← Back to Admin Dashboard
          </a>
        </div>

        {/* MEENA Widget */}
        <script 
          async
          data-meena-iframe 
          data-api-url={typeof window !== 'undefined' ? window.location.origin : ''}
          data-title="MEENA - AI Assistant"
          data-primary-color="#3B82F6"
          data-position="bottom-right"
          data-width="400px"
          data-height="600px"
          src="/meena-widget-iframe.js">
        </script>
      </body>
    </html>
  );
}