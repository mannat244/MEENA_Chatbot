// Test conversation history functionality
const testConversationHistory = async () => {
  console.log('🧪 Testing Conversation History Feature...');
  
  try {
    // Simulate a conversation history
    const conversationHistory = [
      { sender: 'user', text: 'What are the library timings?' },
      { sender: 'meena', text: 'The MANIT library is open from 8:00 AM to 10:00 PM on weekdays.' },
      { sender: 'user', text: 'What about weekends?' },
      { sender: 'meena', text: 'On weekends, the library is open from 9:00 AM to 6:00 PM.' }
    ];
    
    // Test follow-up question
    const followUpMessage = 'Can you tell me more about the library services?';
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: followUpMessage,
        originalMessage: followUpMessage,
        language: 'English',
        model: 'sarvam-m',
        hasContext: false,
        conversationHistory: conversationHistory
      })
    });
    
    if (response.ok) {
      console.log('✅ Conversation history API call successful!');
      console.log('📊 Response status:', response.status);
      console.log('💬 Sent', conversationHistory.length, 'previous messages as context');
      
      // Note: We won't read the streaming response here as it's a test
      console.log('🎯 Follow-up question sent with context about library timings');
    } else {
      console.log('❌ API call failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure the development server is running: npm run dev');
  }
};

// Export for use in other files
export { testConversationHistory };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConversationHistory();
}