// Enhanced URL content extraction test with Readability.js
import { processURLsInMessage } from './lib/urlUtils.js';

console.log('🚀 Testing Enhanced URL Content Extraction with Readability.js');
console.log('═'.repeat(80));

const testUrls = [
  "what is written on https://notebooklm.google/",
  "check this article https://www.plex.tv/watch-free/",
  "read this page https://www.manit.ac.in/"
];

for (const testMessage of testUrls) {
  console.log(`\n🔍 Testing: ${testMessage}`);
  console.log('─'.repeat(50));
  
  try {
    const result = await processURLsInMessage(testMessage);
    
    if (result.hasURLs && result.urlData) {
      result.urlData.forEach((urlInfo, index) => {
        console.log(`\n📋 ===== URL ${index + 1} ENHANCED EXTRACTION =====`);
        console.log('🔗 URL:', urlInfo.url);
        console.log('✅ Success:', urlInfo.success);
        
        if (urlInfo.success) {
          console.log('📄 Title:', urlInfo.title || 'No title');
          console.log('📝 Description:', (urlInfo.description || 'No description').substring(0, 200));
          console.log('📊 Content Length:', urlInfo.content?.length || 0, 'characters');
          console.log('🔧 Extraction Method:', urlInfo.extractionMethod || 'Standard');
          console.log('📖 Readability Check:', urlInfo.isReadable ? 'PASSED' : 'FAILED');
          console.log('🎯 Page Type:', urlInfo.pageTypeInfo || 'General');
          console.log('⏰ Extracted at:', urlInfo.timestamp);
          
          console.log('\n🔍 ===== CONTENT PREVIEW (first 500 chars) =====');
          console.log((urlInfo.content || 'No content').substring(0, 500));
          console.log('🔍 ===== END PREVIEW =====');
          
          if (urlInfo.content && urlInfo.content.length > 500) {
            console.log('\n📄 ===== FULL CONTENT =====');
            console.log(urlInfo.content);
            console.log('📄 ===== END FULL CONTENT =====');
          }
        } else {
          console.log('❌ Error:', urlInfo.error);
        }
      });
    } else {
      console.log('❌ No URLs found or extraction failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n' + '═'.repeat(80));
}

console.log('\n✅ Enhanced URL extraction testing complete!');