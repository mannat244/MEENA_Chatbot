// Test script to show full URL content extraction
import { processURLsInMessage } from '../lib/urlUtils.js';

const testMessage = "what is written on https://www.plex.tv/watch-free/";

console.log('🔍 Testing URL content extraction...');
console.log('📝 Test message:', testMessage);

const result = await processURLsInMessage(testMessage);

console.log('\n📊 ===== FULL URL PROCESSING RESULT =====');
console.log('🔗 Has URLs:', result.hasURLs);
console.log('📄 URL Data Available:', !!result.urlData);
console.log('💬 Content Available:', !!result.urlContent);

if (result.urlData) {
  result.urlData.forEach((urlInfo, index) => {
    console.log(`\n🌐 ===== URL ${index + 1} DETAILS =====`);
    console.log('🔗 URL:', urlInfo.url);
    console.log('📄 Title:', urlInfo.title);
    console.log('📝 Description:', urlInfo.description);
    console.log('📊 Content Length:', urlInfo.content?.length);
    console.log('🎯 Page Type:', urlInfo.pageTypeInfo || 'General');
    console.log('⏰ Timestamp:', urlInfo.timestamp);
    
    console.log('\n📋 ===== FULL EXTRACTED CONTENT =====');
    console.log(urlInfo.content);
    console.log('📋 ===== END FULL CONTENT =====');
  });
}

if (result.urlContent) {
  console.log('\n🎯 ===== FORMATTED CONTENT FOR LLM =====');
  console.log(result.urlContent);
  console.log('🎯 ===== END LLM CONTENT =====');
}

console.log('\n✅ URL content extraction test complete');