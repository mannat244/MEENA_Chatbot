// Test URL processing functionality
import { processURLsInMessage, detectURLs, fetchURLContent } from '../lib/urlUtils.js';

async function testURLProcessing() {
  console.log('🧪 Testing URL Processing Functionality\n');
  
  // Test 1: URL Detection
  console.log('📝 Test 1: URL Detection');
  const testMessages = [
    'Check this out: https://www.manit.ac.in/content/scholarship',
    'Visit www.manit.ac.in for more info',
    'No URLs in this message',
    'Multiple URLs: https://google.com and https://www.manit.ac.in/content/scholarship'
  ];
  
  for (const message of testMessages) {
    const urls = detectURLs(message);
    console.log(`Message: "${message}"`);
    console.log(`URLs found: ${urls ? urls.length : 0}`);
    if (urls) {
      urls.forEach(url => console.log(`  - ${url.fullUrl}`));
    }
    console.log('');
  }
  
  // Test 2: Scholarship URL Processing
  console.log('📚 Test 2: Scholarship URL Processing');
  const scholarshipMessage = 'Can you tell me about scholarship details from https://www.manit.ac.in/content/scholarship';
  
  try {
    const result = await processURLsInMessage(scholarshipMessage);
    console.log('Processing result:', {
      hasURLs: result.hasURLs,
      processedURLs: result.processedURLs,
      contentLength: result.urlContent?.length || 0,
      error: result.error
    });
    
    if (result.urlContent) {
      console.log('\n📄 Extracted content preview:');
      console.log(result.urlContent.substring(0, 500) + '...');
    }
  } catch (error) {
    console.error('❌ Error during URL processing:', error.message);
  }
}

// Run the test
testURLProcessing().catch(console.error);